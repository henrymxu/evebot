import {Track} from "./Track"
import {Readable} from "stream"
import ytdl from "ytdl-core-discord"
import {GuildContext} from "../../guild/Context"
import {StreamUtils} from "../../utils/StreamUtils"
import {Utils} from "../../utils/Utils"

export default class YoutubeTrack extends Track {
    private stream: Readable
    private readonly youtubeInfo: YoutubeTrackInfo

    constructor(id: string, info: YoutubeTrackInfo) {
        super(id)
        this.youtubeInfo = info
    }

    getYoutubeTrackInfo(): YoutubeTrackInfo {
        return this.youtubeInfo
    }

    getTitle(): string {
        return this.youtubeInfo.title
    }

    getArtist(): string {
        return this.getYoutubeTrackInfo().url
    }

    getLength(): string {
        return Utils.convertSecondsToTimeString(this.getYoutubeTrackInfo().length)
    }

    getStream(): Readable {
        return this.stream;
    }

    loadStream(context: GuildContext): Promise<Readable> {
        this.currentlyLoading = true
        const announceStream = context.getVoiceDependencyProvider()
            .getSpeechGenerator().asyncGenerateSpeechFromText(`Now Playing ${this.youtubeInfo.title}`)
        const songStream = ytdl(this.youtubeInfo.url, {quality: 'highestaudio', highWaterMark: 1024 * 1024 * 10})

        return new Promise<Readable>((res, rej) => {
            Promise.all([announceStream, songStream]).then((streams: Readable[]) => {
                this.stream = StreamUtils.mergeAsync(...streams)
                res(this.stream)
                this.currentlyLoading = false
            })
        })
    }
}

export interface YoutubeTrackInfo {
    url: string
    title: string
    length: number
    description: string
    thumbnailURL: string
}