import YoutubeTrack from './YoutubeTrack'
import {TrackInfo, TrackState} from './Track'
import {GuildContext} from '../../guild/Context'
import {Readable} from 'stream'
import {Search} from '../Search'

export default class ExternalTrack extends YoutubeTrack {
    private readonly externalInfo: TrackInfo

    constructor(externalTrackInfo: TrackInfo) {
        super(externalTrackInfo)
        this.externalInfo = externalTrackInfo
    }

    protected getInfo(): TrackInfo {
        return this.externalInfo
    }

    loadStream(context: GuildContext): Promise<Readable> {
        this.state = TrackState.LOADING
        return Search.search(this.convertTrackInfoToSearchableName()).then((info) => {
            this.youtubeInfo = info
            return super.loadStream(context)
        })
    }

    convertTrackInfoToSearchableName(): string {
        // const filteredName = info.title
        // return `${info.artist} - ${filteredName} - (Official Audio)`
        return `${this.externalInfo.artist} - ${this.externalInfo.title}`
    }
}
