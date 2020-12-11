import RecorderStream from './RecorderStream'
import {User, VoiceChannel, VoiceConnection, VoiceState} from 'discord.js'
import {GuildContext} from '../guild/Context'
import {SilentStreamUtils} from '../utils/SilentStreamUtils'
import {CommandDispatcher} from '../commands/Dispatcher'
import {GlobalContext} from '../GlobalContext'
import {Logger} from '../Logger'
import MergedStream from './MergedStream'
import {CachedStream} from './CachedStream'
import SilenceInsertionHandler from './SilenceInsertionHandler'
import SilenceDetectionStream from './SilenceDetectionStream'

const USER_REJOIN_THRESHOLD = 5000
const NO_USER_TIMEOUT = 60 * 1000
const MAX_VOICE_COMMAND_LENGTH = 7500

const TAG = 'ConnectionHandler'

export default class VoiceConnectionHandler {
    private readonly context: GuildContext
    private readonly lowMemoryMode: boolean
    private readonly voiceStreams: Map<string, RecorderStream> = new Map()
    private readonly removedTimeouts: Map<string, NodeJS.Timeout> = new Map()
    private readonly isListeningToCommand: Map<string, boolean> = new Map()
    private noUsersInVoiceChannelTimeout: NodeJS.Timeout | undefined

    private readonly silenceInsertionHandler = new SilenceInsertionHandler(this.voiceStreams)
    private readonly mergeStream: MergedStream = new MergedStream(this.voiceStreams)

    constructor(guildContext: GuildContext) {
        this.context = guildContext
        this.lowMemoryMode = false // TODO: Implement a global? parameter
        this.silenceInsertionHandler.start()
    }

    getMergedVoiceStream(): MergedStream {
        return this.mergeStream
    }

    getVoiceStreams(): Map<string, CachedStream> {
        return this.voiceStreams
    }

    getVoiceStreamForUser(user: User): CachedStream | undefined {
        return this.voiceStreams.get(user.id)
    }

    addVoiceStreamForUser(user: User) {
        this.startVoiceStreamForUser(user)
    }

    deleteVoiceStreamForUser(user: User) {
        this.removeVoiceStreamForUser(user)
    }

    disconnect(): Promise<void> {
        return new Promise((res, rej) => {
            this.context.getVoiceConnection()?.on('disconnect', () => {
                res()
            })
            this.context.getProvider().getDJ().stop()
            this.context.getVoiceConnection()?.disconnect()
        })
    }

    reset() {
        this.voiceStreams.clear()
        this.context.getVoiceDependencyProvider().getHotwordEngine()?.clear()
        this.removedTimeouts.forEach((timeout: NodeJS.Timeout) => {
            clearTimeout(timeout)
        })
        this.removedTimeouts.clear()
        this.isListeningToCommand.clear()
    }

    joinVoiceChannel(voiceChannel: VoiceChannel | undefined | null): Promise<void> {
        if (!voiceChannel) {
            throw new Error('VoiceChannel is undefined')
        }
        return voiceChannel.join().then((connection: VoiceConnection) => {
            if (!this.context.getVoiceConnection()) {
                this.context.setVoiceConnection(connection)
                this.initializeConnection()
            }
        })
    }

    userJoinedChannel(newVoiceState: VoiceState) {
        if (this.noUsersInVoiceChannelTimeout) {
            Logger.i(TAG, 'Cancelling no user timeout')
            clearTimeout(this.noUsersInVoiceChannelTimeout)
            this.noUsersInVoiceChannelTimeout = undefined
        }
    }

    userLeftChannel(user?: User) {
        if (!user) {
            return
        }
        this.isListeningToCommand.delete(user.id)
        this.removeVoiceStreamForUser(user)
        const members = this.context.getVoiceConnection()?.channel.members
        if (members?.filter(member => member.id !== GlobalContext.getBotID()).size === 0) {
            Logger.i(TAG, 'Starting no user timeout')
            this.noUsersInVoiceChannelTimeout = setTimeout(() => {
                this.disconnect()
            }, NO_USER_TIMEOUT)
        }
    }

    userChangedChannel(oldState: VoiceState) {
        if (this.context.getVoiceConnection() &&
            oldState.channelID === this.context.getVoiceConnection()?.channel.id) {
            this.removeVoiceStreamForUser(oldState?.member?.user)
        }
    }

    private initializeConnection() {
        const connection = this.context.getVoiceConnection()
        if (!connection) {
            return
        }
        if (!this.context.getProvider().getDJ().isPlaying()) { // Don't play silent stream if bot is moved around
            SilentStreamUtils.playSilentAudioStream(connection)
        }
        connection.on('speaking', (user, speaking) => {
            if (user === undefined || GlobalContext.getBotID() === user.id) {
                return
            }
            const timeout = this.removedTimeouts.get(user.id)
            if (timeout) {
                clearTimeout(timeout)
                this.removedTimeouts.delete(user.id)
            } else if (this.voiceStreams.has(user.id) || user.bot) {
                return
            }
            if (this.context.getConfig().getUserVoiceOptOut(user.id)) {
                return
            }
            this.startVoiceStreamForUser(user)
        })

        connection.on('ready', () => {
            console.log('Connection ready')
        })

        connection.on('newSession', () => {
            console.log('New Session')
        })

        connection.on('warning', warning => {
            console.log(`Warning: ${warning}`)
        })

        connection.on('error', err => {
            console.log(`Error: ${err.name}, ${err.message}`)
        })

        connection.on('reconnecting', () => {
            console.log('Reconnecting')
            this.reset()
        })

        connection.on('disconnect', () => {
            console.log(`Disconnecting from ${connection.channel.guild.name}`)
            this.reset()
            this.context.setVoiceConnection(undefined)
        })
    }

    private removeVoiceStreamForUser(user?: User) {
        if (!user) {
            return
        }
        const timeout = setTimeout(() => {
            Logger.i(VoiceConnectionHandler.name, `Removing ${user.tag} [${user.id}]`, this.context)
            this.voiceStreams.delete(user.id)
            this.removedTimeouts.delete(user.id)
        }, USER_REJOIN_THRESHOLD)
        this.removedTimeouts.set(user.id, timeout)
        this.context.getVoiceConnection()?.receiver.createStream(user).emit('end')
        this.context.getVoiceDependencyProvider()
        this.context.getVoiceDependencyProvider().getHotwordEngine()?.remove(user.id)
    }

    private startVoiceStreamForUser(user: User) {
        Logger.i(VoiceConnectionHandler.name, `Registering ${user.tag} [${user.id}]`, this.context)
        const connection = this.context.getVoiceConnection()
        if (!connection) {
            return
        }
        let audio = connection.receiver.createStream(user, { mode: 'pcm', end: 'manual' })
        const previousStream = this.voiceStreams.get(user.id)
        const recorderStream = previousStream || new RecorderStream(true)
        audio.pipe(recorderStream, { end: false })
        this.voiceStreams.set(user.id, recorderStream)
        const speechRecognizer = this.context.getVoiceDependencyProvider().getSpeechRecognizer()
        const hotwordEngine = this.context.getVoiceDependencyProvider().getHotwordEngine()
        if (!speechRecognizer || !hotwordEngine) {
            Logger.w(TAG, `No SpeechRecognizer or HotwordEngine registered`, this.context)
            return
        }
        hotwordEngine.register(user.id, recorderStream, ((trigger) => {
            if (this.isListeningToCommand.has(user.id)) {
                Logger.w('HotwordDetector', `Already listening for a command from ${user.tag} [${user.id}]`, this.context)
                return
            }
            this.isListeningToCommand.set(user.id, true)
            this.context.getProvider().getInterruptService().playHotwordAck(0)
            const recognitionStream = new SilenceDetectionStream(() => {
                recognitionStream.end()
                recognitionStream.destroy()
                this.context.getProvider().getInterruptService().playHotwordAck(1)
                this.isListeningToCommand.delete(user.id)
            }, MAX_VOICE_COMMAND_LENGTH)
            recorderStream.pipe(recognitionStream)
            speechRecognizer.recognizeTextFromSpeech(recognitionStream).then((text) => {
                Logger.i('HotwordDetector', `${user.tag} said ${text}`, this.context)
                CommandDispatcher.handleExplicitCommand(this.context, user, text)
            })
        }))
    }
}
