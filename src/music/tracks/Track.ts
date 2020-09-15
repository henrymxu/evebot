import {Readable} from "stream"
import {Message} from "discord.js"
import {GuildContext} from "../../guild/Context"

export abstract class Track {
    id: string
    metaData: TrackMetaData
    protected currentlyLoading: boolean = false
    protected constructor(id: string) {
        this.id = id
    }

    isLoading(): boolean {
        return this.currentlyLoading
    }

    getRequester(context: GuildContext): string {
        return context.getUserFromUserID(this.metaData.requesterId).username
    }

    abstract getTitle(): string
    abstract getArtist(): string
    abstract getLength(): string

    abstract loadStream(context: GuildContext): Promise<Readable>
    abstract getStream(): Readable | undefined
}

export interface TrackItem {
    track: Track
    metaData: TrackMetaData
}

export interface TrackMetaData {
    requesterId: string
    source?: Message
}