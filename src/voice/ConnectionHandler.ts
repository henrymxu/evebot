import RecorderStream from "./RecorderStream"
import {User, VoiceChannel, VoiceState} from "discord.js"
import {GuildContext} from "../guild/Context"
import {SilentStreamUtils} from "../utils/SilentStreamUtils"
import {PassThrough} from "stream"
import {CommandDispatcher} from "../commands/Dispatcher"

const USER_REJOIN_THRESHOLD = 5000
const VOICE_COMMAND_LENGTH = 3000

export default class VoiceConnectionHandler {
    private readonly context: GuildContext
    private voiceStreams: Map<string, RecorderStream> = new Map()
    private removedTimeouts: Map<string, NodeJS.Timeout> = new Map()
    private isListeningToCommand: Map<string, boolean> = new Map()

    constructor(guildContext: GuildContext) {
        this.context = guildContext
    }

    getVoiceStreams(): Map<string, RecorderStream> {
        return this.voiceStreams
    }

    getVoiceStreamForUser(user: User): RecorderStream {
        return this.voiceStreams.get(user.id)
    }

    reset() {
        this.voiceStreams.clear()
        this.context.getVoiceDependencyProvider().getHotwordEngine().clear()
        this.removedTimeouts.forEach((timeout) => {
            clearTimeout(timeout)
        })
        this.removedTimeouts.clear()
        this.isListeningToCommand.clear()
        this.context.setVoiceConnection(null)
    }

    joinVoiceChannel(voiceChannel: VoiceChannel): Promise<any> {
        return new Promise((res, rej) => {
            voiceChannel.join().then((connection) => {
                this.context.setVoiceConnection(connection)
                this.initializeConnection()
                res()
            }).catch(err => {
                rej(err)
            })
        })
    }

    userLeftChannel(user: User) {
        this.removeVoiceStreamForUser(user)
    }

    userChangedChannel(oldState: VoiceState) {
        if (this.context.getVoiceConnection() &&
            oldState.channelID === this.context.getVoiceConnection().channel.id) {
            this.removeVoiceStreamForUser(oldState.member.user)
        }
    }

    private initializeConnection() {
        const connection = this.context.getVoiceConnection()
        if (!connection) {
            return
        }
        SilentStreamUtils.playSilentAudioStream(connection)
        connection.on('speaking', (user, speaking) => {
            if (user === undefined) {
                return
            }
            if (this.removedTimeouts.has(user.id)) {
                clearTimeout(this.removedTimeouts.get(user.id))
                this.removedTimeouts.delete(user.id)
            } else if (this.voiceStreams.has(user.id) || user.bot) {
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
        })
    }

    private removeVoiceStreamForUser(user: User) {
        if (!user) {
            return
        }
        console.log(`Preparing to remove ${user.tag}`)
        const timeout = setTimeout(() => {
            console.log(`Removing ${user.tag}`)
            this.voiceStreams.delete(user.id)
            this.removedTimeouts.delete(user.id)
        }, USER_REJOIN_THRESHOLD)
        this.removedTimeouts.set(user.id, timeout)
        this.context.getVoiceConnection()?.receiver.createStream(user).emit('end')
        this.context.getVoiceDependencyProvider()
        this.context.getVoiceDependencyProvider().getHotwordEngine().remove(user.id)
    }

    private startVoiceStreamForUser(user: User) {
        console.log(`Registering ${user.tag} => ${user.id}`)
        const connection = this.context.getVoiceConnection()
        let audio = connection.receiver.createStream(user, {
            mode: 'pcm',
            end: 'manual'
        })
        const reRegistering = this.voiceStreams.has(user.id)
        const recorderStream = (!reRegistering) ? new RecorderStream() : this.voiceStreams.get(user.id)
        audio.pipe(recorderStream, {end: false})
        this.voiceStreams.set(user.id, recorderStream)
        const hotwordEngine = this.context.getVoiceDependencyProvider().getHotwordEngine()
        hotwordEngine.register(user.id, recorderStream, ((trigger) => {
            if (this.isListeningToCommand.has(user.id)) {
                console.log(`Already listening for a command from ${user.id}`)
                return
            }
            this.isListeningToCommand.set(user.id, true)
            this.context.getProvider().getInterruptService().playHotwordAck(0)
            const recognitionStream = new PassThrough()
            recorderStream.pipe(recognitionStream)

            const speechRecognizer = this.context.getVoiceDependencyProvider().getSpeechRecognizer()
            speechRecognizer.recognizeTextFromSpeech(recognitionStream).then((text) => {
                console.log(`${user.tag} said ${text}`)
                CommandDispatcher.handleExplicitCommand(this.context, user, text)
            })
            setTimeout(() => {
                recognitionStream.end()
                recognitionStream.destroy()
                this.context.getProvider().getInterruptService().playHotwordAck(1)
                this.isListeningToCommand.delete(user.id)
            }, VOICE_COMMAND_LENGTH)
        }))
    }
}
