import {Track, TrackInfo, TrackState} from './Track'
import {Readable} from 'stream'
import ytdl from 'discord-ytdl-core'
import {GuildContext} from '../../guild/Context'
import {StreamUtils} from '../../utils/StreamUtils'
import {Logger} from '../../Logger'
import {SpeechGeneratorResult} from '../../speech/Interfaces'

export default class YoutubeTrack extends Track {
    protected youtubeInfo: TrackInfo | undefined
    private stream: Readable | undefined
    private announcementLength: number = 0

    constructor(info: TrackInfo) {
        super(info.id)
        this.youtubeInfo = info
    }

    protected getInfo(): TrackInfo {
        return this.youtubeInfo!
    }

    getElapsedTimeInSeconds(): number {
        return Math.max(super.getElapsedTimeInSeconds() - this.announcementLength, 0)
    }

    getTitle(): string {
        // TODO: Truncate string
        return this.getInfo().title
    }

    getArtist(): string {
        return this.getInfo().artist
    }

    getLength(): number {
        return this.getInfo().length
    }

    getURL(): string {
        return this.getInfo().url || this.youtubeInfo?.url || ''
    }

    getThumbnailURL(): string | undefined {
        return this.getInfo().thumbnailURL
    }

    getStream(): Readable | undefined{
        return this.stream;
    }

    loadStream(context: GuildContext): Promise<Readable> {
        if (!this.youtubeInfo) {
            return Promise.reject('Unable to load Track!')
        }
        this.state = TrackState.LOADING
        const sGen = context.getVoiceDependencyProvider().getSpeechGenerator()
        const announceResult = sGen ? sGen.asyncGenerateSpeechFromText(`Now Playing ${this.getInfo().title}`)
            : Promise.resolve(undefined)
        const songStream = ytdl(this.youtubeInfo!.url, {
            filter: 'audioonly',
            opusEncoded: true,
            highWaterMark: (1 << 25)
        })
        return Promise.all([announceResult, songStream]).then((streams: (Readable | SpeechGeneratorResult | undefined)[]) => {
            const announceStream = streams[0] ? (streams[0] as SpeechGeneratorResult).stream : undefined
            this.stream = announceStream ?
                StreamUtils.mergeAsync(announceStream, streams[1] as Readable) : streams[1] as Readable
            this.state = TrackState.LOADED
            this.announcementLength = (streams[0] as SpeechGeneratorResult).length
            return this.stream
        }).catch(err => {
            Logger.e(YoutubeTrack.name, err, context)
            throw err
        })
    }
}
