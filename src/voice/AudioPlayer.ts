import PriorityQueue from 'priorityqueuejs'
import { StreamType, VoiceConnection } from 'discord.js'
import { Readable } from 'stream'
import { GuildContext } from '../guild/Context'
import { Track, TrackState } from '../music/tracks/Track'
import { Logger } from '../Logger'

export default class AudioPlayer {
    private readonly context: GuildContext
    private interruptQueue: PriorityQueue<InterruptItem>

    private currentInterrupt: InterruptItem
    private completedInterruptCallbacks: (() => any)[]

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

        this.trackQueue = []

        this.state = AudioPlayerState.IDLE
        this.volume = 25
    }

    private getConnection(): VoiceConnection {
        return this.context.getVoiceConnection()
    }

    setVolume(volume: number, relative: boolean): boolean {
        this.volume = relative ? this.volume * volume : volume
        const scaledVolume = this.getScaledVolume()
        Logger.i(this.context, AudioPlayer.name, `Setting volume to ${this.volume} [${scaledVolume}]`)
        this.getConnection()?.dispatcher?.setVolume(scaledVolume)
        return true
    }

    getQueue(): Track[] {
        return this.trackQueue
    }

    pause(): boolean {
        if (!this.getConnection().dispatcher || this.state == AudioPlayerState.PAUSED) {
            return false
        }
        this.getConnection().dispatcher.pause()
        this.state = AudioPlayerState.PAUSED
        return true
    }

    resume(): boolean {
        if (!this.getConnection().dispatcher || this.state != AudioPlayerState.PAUSED) {
            return false
        }
        if (this.getConnection().dispatcher) {
            this.getConnection().dispatcher.resume()
            this.state = AudioPlayerState.PLAYING
        } else {
            this.state = AudioPlayerState.IDLE
        }
        return true
    }

    stop(): boolean {
        if (!this.getConnection().dispatcher) {
            return false
        }
        this.getQueue().forEach((track) => {
            track.setFinished()
        })
        this.getConnection().dispatcher.destroy()
        this.initialize()
        return true
    }

    skip(): boolean {
        this.playNext()
        return true
    }

    queueInterrupt(stream: Readable, audioType: string, priority: number, callback: () => any = () => {}) {
        const interruptItem: InterruptItem = {
            stream: stream,
            audioType: audioType,
            priority: priority,
            callback: callback,
        }
        this.interruptQueue.enq(interruptItem)
        this.onInterruptQueued()
    }

    private onInterruptQueued() {
        if (this.interruptQueue.isEmpty()) {
            this.completedInterruptCallbacks.forEach((callback) => {
                callback()
            })
            this.completedInterruptCallbacks = []
            this.prepareToPlay(true)
            return
        }
        if (this.state == AudioPlayerState.PLAYING && this.trackQueue.length > 0) {
            this.trackQueue[0].setPaused()
        } else if (this.state == AudioPlayerState.INTERRUPTING && this.interruptQueue.size() > 1) {
            if (this.interruptQueue[0] === this.currentInterrupt) {
                return
            }
            this.currentInterrupt.stream.pause()
            this.currentInterrupt.stream.unpipe()
        }
        const interrupt: InterruptItem = this.interruptQueue.peek()
        this.currentInterrupt = interrupt
        this.getConnection().dispatcher?.destroy()
        this.getConnection()
            .play(interrupt.stream, { type: interrupt.audioType as StreamType })
            .on('start', () => {
                this.state = AudioPlayerState.INTERRUPTING
            })
            .on('finish', () => {
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
        if (!this.getConnection().dispatcher) {
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
        if (track.isLoaded() && track.getStream()) {
            this.play(track)
        } else {
            track.loadStream(this.context).then((stream) => {
                if (track.isFinished()) {
                    Logger.w(
                        this.context,
                        AudioPlayer.name,
                        `${track.getTitle()} was skipped before stream finished loading`
                    )
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
        this.getConnection()
            .play(track.getStream(), {
                type: 'opus',
                highWaterMark: 48,
                volume: this.getScaledVolume(),
            })
            .on('start', () => {
                this.state = AudioPlayerState.PLAYING
                track.setPlaying()
            })
            .on('finish', () => {
                this.playNext()
            })
    }

    private playNext(): boolean {
        const current = this.trackQueue.shift()
        this.endTrack(current)
        const nextTrackItem = this.trackQueue[0]
        this.prepareToPlay(false)
        return nextTrackItem !== undefined
    }

    private endTrack(track: Track) {
        if (track) {
            this.getConnection()?.dispatcher?.destroy()
            track.setFinished()
            this.context.getProvider().getDJ().onTrackCompleted(track)
            this.state = AudioPlayerState.IDLE
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
    INTERRUPTING,
}

interface InterruptItem {
    stream: Readable
    audioType: string
    priority: number
    callback: () => any
}
