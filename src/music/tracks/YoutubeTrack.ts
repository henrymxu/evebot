import {Track, TrackState} from "./Track"
import {Readable} from "stream"
import ytdl from "discord-ytdl-core"
import {GuildContext} from "../../guild/Context"
import {StreamUtils} from "../../utils/StreamUtils"
import {Logger} from "../../Logger"

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
        // TODO: Truncate string
        return this.youtubeInfo.title
    }

    getArtist(): string {
        return this.youtubeInfo.channel
    }

    getLength(): number {
        return this.getYoutubeTrackInfo().length
    }

    getStream(): Readable {
        return this.stream;
    }

    loadStream(context: GuildContext): Promise<Readable> {
        this.state = TrackState.LOADING
        const announceStream = context.getVoiceDependencyProvider()
            .getSpeechGenerator().asyncGenerateSpeechFromText(`Now Playing ${this.youtubeInfo.title}`)
        const songStream = ytdl(this.youtubeInfo.url, {filter: 'audioonly', opusEncoded: true})
        return new Promise<Readable>((res, rej) => {
            Promise.all([announceStream, songStream]).then((streams: Readable[]) => {
                this.stream = StreamUtils.mergeAsync(...streams)
                this.state = TrackState.LOADED
                res(this.stream)
            }).catch(err => {
                Logger.e(context, YoutubeTrack.name, err)
                rej(err)
            })
        })
    }
}

export interface YoutubeTrackInfo {
    url: string
    title: string
    channel: string
    length: number
    description: string
    thumbnailURL: string
}