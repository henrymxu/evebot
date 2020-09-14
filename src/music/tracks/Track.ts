import {Readable} from "stream"
import {Message} from "discord.js"
import {GuildContext} from "../../guild/Context"


export abstract class Track {
    id: string
    metaData: TrackMetaData
    protected constructor(id: string) {
        this.id = id
    }
    abstract getTitle(): string
    abstract asQueueString(): string

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