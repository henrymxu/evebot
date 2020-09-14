import {Track} from "./Track"
import {Readable} from "stream"
import ytdl from "ytdl-core-discord"
import {GuildContext} from "../../guild/Context"
import {StreamUtils} from "../../utils/StreamUtils"
import {Utils} from "../../utils/Utils"

export default class YoutubeTrack extends Track {
    private stream: Readable
    info: YoutubeInfo

    constructor(id: string, info: YoutubeInfo) {
        super(id)
        this.info = info
    }

    getTitle(): string {
        return this.info.title
    }

    asQueueString(): string {
        return Utils.convertSecondsToTimeString(this.info.length)
    }

    getStream(): Readable {
        return this.stream;
    }

    loadStream(context: GuildContext): Promise<Readable> {
        const announceStream = context.getVoiceDependencyProvider()
            .getSpeechGenerator().asyncGenerateSpeechFromText(`Now Playing ${this.info.title}`)
        const songStream = ytdl(this.info.url, {quality: 'highestaudio', highWaterMark: 1024 * 1024 * 10})

        return new Promise<Readable>((res, rej) => {
            Promise.all([announceStream, songStream]).then((streams: Readable[]) => {
                this.stream = StreamUtils.mergeAsync(...streams)
                res(this.stream)
            })
        })
    }
}

interface YoutubeInfo {
    url: string
    title: string
    length: number
    description: string
    thumbnailURL: string
}