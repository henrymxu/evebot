import PriorityQueue from "priorityqueuejs"
import {StreamType, VoiceConnection} from "discord.js"
import {Readable} from "stream"
import {GuildContext} from "../guild/Context"
import {Track} from "../music/tracks/Track"

export default class AudioPlayer {
    private context: GuildContext
    private interruptQueue: PriorityQueue<InterruptItem>

    private currentInterrupt: InterruptItem
    private completedInterruptCallbacks: (()=>any)[]

    private trackQueue: Track[]

    private state: string // idle, paused, playing, interrupting
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

        this.state = "idle"
        this.volume = 25
    }
    
    private getConnection(): VoiceConnection {
        return this.context.getVoiceConnection()
    }

    setVolume(volume: number, relative: boolean): boolean {
        this.volume = relative ? this.volume * volume : volume
        const scaledVolume = this.getScaledVolume()
        console.log(`Setting volume to ${this.volume} [${scaledVolume}]`)
        this.getConnection()?.dispatcher?.setVolume(scaledVolume)
        return true
    }

    getQueue(): Track[] {
        return this.trackQueue
    }

    pause(): boolean {
        if (!this.getConnection().dispatcher || this.state == "paused") {
            return false
        }
        this.getConnection().dispatcher.pause()
        this.state = "paused"
        return true
    }

    resume(): boolean {
        if (!this.getConnection().dispatcher || this.state != "paused") {
            return false
        }
        if (this.getConnection().dispatcher) {
            this.getConnection().dispatcher.resume()
            this.state = "playing"
        } else {
            this.state = "idle"
        }
        return true
    }

    stop(): boolean {
        if (!this.getConnection().dispatcher) {
            return false
        }
        this.getConnection().dispatcher.destroy()
        this.initialize()
        return true
    }

    skip(): boolean {
        this.playNext()
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
        if (this.state == "playing" && this.trackQueue.length > 0) {
            this.trackQueue[0].getStream().pause()
            this.trackQueue[0].getStream().unpipe()
        } else if (this.state == "interrupting" && this.interruptQueue.size() > 1) {
            if (this.interruptQueue[0] === this.currentInterrupt) {
                return
            }
            this.currentInterrupt.stream.pause()
            this.currentInterrupt.stream.unpipe()
        }
        const interrupt: InterruptItem = this.interruptQueue.peek()
        this.currentInterrupt = interrupt
        this.getConnection().dispatcher?.destroy()
        this.getConnection().play(
            interrupt.stream, {type: interrupt.audioType as StreamType}
        ).on('start', () => {
            this.state = "interrupting"
        }).on('finish', () => {
            this.interruptQueue.deq()
            this.state = "idle"
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
        if (!track) {
            return
        }
        if (track.getStream()) {
            this.play(track)
        } else {
            track.loadStream(this.context).then((stream) => {
                this.context.getProvider().getDJ().onTrackStarted(track)
                this.play(track)
            })
        }
    }

    private play(track: Track) {
        this.getConnection()?.dispatcher?.destroy()
        this.getConnection().play(track.getStream(), {
            type: 'opus',
            highWaterMark: 48,
            volume: this.getScaledVolume()
        }).on('start', () => {
            this.state = "playing"
        }).on('finish', () => {
            this.context.getProvider().getDJ().onTrackCompleted(track)
            this.state = "idle"
            this.playNext()
        })
    }

    private playNext(): boolean {
        const current = this.trackQueue.shift()
        if (current) {
            this.getConnection()?.dispatcher?.end()
            current.getStream().destroy()
        }
        const trackItem = this.trackQueue[0]
        if (!trackItem) {
            return false
        }
        this.prepareToPlay(false)
        return true
    }

    private getScaledVolume(): number {
        return (this.volume / 100) * (2 - 0.5) + 0.5
    }
}

interface InterruptItem {
    stream: Readable,
    audioType: string,
    priority: number,
    callback: ()=>any
}

