import {Readable} from 'stream'
import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {GuildUtils} from '../../utils/GuildUtils'

export abstract class Track {
    id: string
    metaData: TrackMetaData = {requesterId: '', source: undefined}
    private elapsedTimeInSeconds = 0
    private secondsInterval: NodeJS.Timeout | undefined
    protected state: TrackState = TrackState.QUEUED

    protected constructor(id: string) {
        this.id = id
    }

    isLoading(): boolean {
        return this.state === TrackState.LOADING
    }

    isLoaded(): boolean {
        return this.state === TrackState.LOADED || this.state === TrackState.PLAYING || this.state === TrackState.PAUSED
    }

    isFinished(): boolean {
        return this.state === TrackState.FINISHED
    }

    isPlaying(): boolean {
        return this.state === TrackState.PLAYING
    }

    isPaused(): boolean {
        return this.state === TrackState.PAUSED
    }

    setPlaying() {
        this.state = TrackState.PLAYING
        this.secondsInterval = setInterval(() => {
            this.elapsedTimeInSeconds++
        }, 1000)
    }

    setPaused() {
        this.state = TrackState.PAUSED
        if (this.secondsInterval) {
            clearInterval(this.secondsInterval)
        }
        this.getStream()?.pause()
        this.getStream()?.unpipe()
    }

    setFinished() {
        this.state = TrackState.FINISHED
        if (this.secondsInterval) {
            clearInterval(this.secondsInterval)
        }
        this.getStream()?.removeAllListeners('finish')
        this.getStream()?.destroy()
    }

    getRequester(context: GuildContext): string | undefined {
        return GuildUtils.parseUserFromUserID(context, this.metaData.requesterId)?.username
    }

    getElapsedTimeInSeconds(): number {
        return this.elapsedTimeInSeconds
    }

    abstract getTitle(): string

    abstract getArtist(): string

    abstract getLength(): number

    abstract getURL(): string

    abstract getThumbnailURL(): string | undefined

    abstract loadStream(context: GuildContext): Promise<Readable>

    abstract getStream(): Readable | undefined
}

export enum TrackState {
    QUEUED,
    LOADING,
    LOADED,
    PLAYING,
    FINISHED,
    PAUSED
}

export interface TrackInfo {
    id: string
    url: string
    title: string
    artist: string
    length: number
    description?: string
    thumbnailURL?: string
}

export interface TrackMetaData {
    requesterId: string
    source?: Message
}
