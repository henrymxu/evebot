import {Readable} from "stream"
import {Message} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {GuildUtils} from "../../utils/GuildUtils"

export abstract class Track {
    id: string
    metaData: TrackMetaData
    protected state: TrackState = TrackState.QUEUED
    protected constructor(id: string) {
        this.id = id
    }

    isLoading(): boolean {
        return this.state === TrackState.LOADING
    }

    isLoaded(): boolean {
        return this.state === TrackState.LOADED || this.state === TrackState.PLAYING
    }

    isSkipped(): boolean {
        return this.state === TrackState.SKIPPED
    }

    isPlaying(): boolean {
        return this.state === TrackState.PLAYING
    }

    setState(state: TrackState) {
        this.state = state
    }

    getRequester(context: GuildContext): string {
        return GuildUtils.parseUserFromUserID(context, this.metaData.requesterId).username
    }

    abstract getTitle(): string
    abstract getArtist(): string
    abstract getLength(): number

    abstract loadStream(context: GuildContext): Promise<Readable>
    abstract getStream(): Readable | undefined
}

export enum TrackState {
    QUEUED,
    LOADING,
    LOADED,
    PLAYING,
    SKIPPED
}

export interface TrackItem {
    track: Track
    metaData: TrackMetaData
}

export interface TrackMetaData {
    requesterId: string
    source?: Message
}