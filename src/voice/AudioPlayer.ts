import PriorityQueue from 'priorityqueuejs'
import {StreamType, VoiceConnection} from 'discord.js'
import {Readable} from 'stream'
import {GuildContext} from '../guild/Context'
import {Track} from '../music/tracks/Track'
import {Logger} from '../Logger'
import {Utils} from '../utils/Utils'

const HIGH_WATER_MARK = 6

export default class AudioPlayer {
    private readonly context: GuildContext
    private interruptQueue: PriorityQueue<InterruptItem>
    private currentInterrupt: InterruptItem | undefined
    private completedInterruptCallbacks: (()=>any)[]
    private completedTracks: Track[]
    private trackQueue: Track[]
    private state: AudioPlayerState
    private volume: number

    constructor(context: GuildContext) {
        this.context = context
        this.initialize()
    }

    private initialize() {
        this.interruptQueue = new PriorityQueue((a: InterruptItem, b: InterruptItem) => {
            return a.priority - b.priority
        })

        this.currentInterrupt = undefined
        this.completedInterruptCallbacks = []

        this.completedTracks = []
        this.trackQueue = []

        this.state = AudioPlayerState.IDLE
        this.volume = 25
    }

    private getConnection(): VoiceConnection | undefined {
        return this.context.getVoiceConnection()
    }

    setVolume(volume: number, relative: boolean): boolean {
        this.volume = relative ? this.volume * volume : volume
        const scaledVolume = this.getScaledVolume()
        Logger.i(AudioPlayer.name, `Setting volume to ${this.volume} [${scaledVolume}]`, this.context)
        this.getConnection()?.dispatcher?.setVolume(scaledVolume)
        return true
    }

    getQueue(): Track[] {
        return this.trackQueue
    }

    getCompletedTracks(): Track[] {
        return this.completedTracks
    }

    pause(): boolean {
        if (!this.getConnection()?.dispatcher || this.state === AudioPlayerState.PAUSED) {
            return false
        }
        this.getConnection()?.dispatcher.pause()
        this.state = AudioPlayerState.PAUSED
        return true
    }

    resume(): boolean {
        if (!this.getConnection()?.dispatcher || this.state !== AudioPlayerState.PAUSED) {
            return false
        }
        if (this.getConnection()?.dispatcher) {
            this.getConnection()?.dispatcher.resume()
            this.state = AudioPlayerState.PLAYING
        } else {
            this.state = AudioPlayerState.IDLE
        }
        return true
    }

    stop(): boolean {
        this.endTrack(this.trackQueue.shift())
        this.trackQueue.forEach(track => { track.setFinished() })
        this.getConnection()?.dispatcher?.destroy()
        this.initialize()
        return true
    }

    skip(count: number): boolean {
        return this.playNext(count)
    }

    shuffle(): boolean {
        if (this.trackQueue.length < 2) {
            return false
        }
        const topElement = this.trackQueue.shift()!
        Utils.shuffleArray(this.trackQueue)
        this.trackQueue.unshift(topElement)
        return true
    }

    queueInterrupt(stream: Readable, audioType: string, priority: number, callback: ()=>any = ()=>{}) {
        const interruptItem: InterruptItem = {
            stream: stream,
            audioType: audioType,
            priority: priority,
            callback: callback
        }
        this.interruptQueue.enq(interruptItem)
        this.onInterruptQueued()
    }

    private onInterruptQueued() {
        if (this.interruptQueue.isEmpty()) {
            this.completedInterruptCallbacks.forEach(callback => {
                callback()
            })
            this.completedInterruptCallbacks = []
            this.prepareToPlay(true)
            return
        }
        if (this.state === AudioPlayerState.PLAYING && this.trackQueue.length > 0) {
            this.trackQueue[0].setPaused()
        } else if (this.state === AudioPlayerState.INTERRUPTING && this.interruptQueue.size() > 1) {
            if (this.interruptQueue.peek() === this.currentInterrupt) {
                return
            }
            this.currentInterrupt?.stream.pause()
            this.currentInterrupt?.stream.unpipe()
        }
        const interrupt: InterruptItem = this.interruptQueue.peek()
        this.currentInterrupt = interrupt
        this.getConnection()?.dispatcher?.destroy()
        this.getConnection()?.play(interrupt.stream, {
            type: interrupt.audioType as StreamType,
            highWaterMark: HIGH_WATER_MARK ,
            volume: this.getScaledVolume()
        }).on('start', () => {
            this.state = AudioPlayerState.INTERRUPTING
        }).on('finish', () => {
            this.interruptQueue.deq()
            this.state = AudioPlayerState.IDLE
            this.currentInterrupt = undefined
            this.completedInterruptCallbacks.push(interrupt.callback)
            this.onInterruptQueued()
        })
    }

    queueTrack(track: Track): boolean {
        let result = false
        this.trackQueue.push(track)
        if (!this.getConnection()?.dispatcher) {
            this.prepareToPlay(false)
            result = true
        }
        return result
    }

    private prepareToPlay(isResume: boolean) {
        const track = this.trackQueue[0]
        if (!track || track.isLoading()) {
            return
        }
        if ((track.isLoaded()) && track.getStream()) {
            this.play(track)
        } else {
            track.loadStream(this.context).then((stream) => {
                if (track.isFinished()) {
                    Logger.w(AudioPlayer.name,
                        `${track.getTitle()} was skipped before stream finished loading`, this.context)
                    stream.destroy()
                    return
                }
                this.context.getProvider().getDJ().onTrackStarted(track)
                this.play(track)
            })
        }
    }

    private play(track: Track) {
        this.getConnection()?.dispatcher?.destroy()
        // Stream should not be undefined
        this.getConnection()?.play(track.getStream()!, {
            type: 'opus',
            highWaterMark: HIGH_WATER_MARK,
            volume: this.getScaledVolume(),
            plp: 5,
        }).on('start', () => {
            this.state = AudioPlayerState.PLAYING
            track.setPlaying()
        }).on('finish', () => {
            this.playNext()
        }).on('error', (error) => {
            Logger.e(AudioPlayer.name, `An error occured ${error}`, this.context)
            this.playNext()
        })
    }

    private playNext(count: number = 1): boolean {
        this.state = AudioPlayerState.IDLE
        const current = this.trackQueue.shift()
        this.endTrack(current)
        while(--count > 0) {
            let track = this.trackQueue.shift()
            if (track) {
                this.completedTracks.push(track)
            }
        }
        this.prepareToPlay(false)
        this.context.getProvider().getDJ().onAudioPlayerFinished()
        return current !== undefined
    }

    private endTrack(track?: Track) {
        if (track) {
            this.getConnection()?.dispatcher?.destroy()
            track.setFinished()
            this.context.getProvider().getDJ().onTrackCompleted(track)
            this.completedTracks.push(track)
        }
    }

    private getScaledVolume(): number {
        return (this.volume / 100) * (2 - 0.5) + 0.5
    }
}

enum AudioPlayerState {
    IDLE,
    PAUSED,
    PLAYING,
    INTERRUPTING
}

interface InterruptItem {
    stream: Readable,
    audioType: string,
    priority: number,
    callback: ()=>any
}

