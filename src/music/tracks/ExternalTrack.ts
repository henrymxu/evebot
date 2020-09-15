import YoutubeTrack, {YoutubeTrackInfo} from "./YoutubeTrack"

export default class ExternalTrack extends YoutubeTrack {
    private readonly externalInfo: ExternalTrackInfo
    constructor(id: string, youtubeInfo: YoutubeTrackInfo, externalTrackInfo: ExternalTrackInfo) {
        super(id, youtubeInfo);
        this.externalInfo = externalTrackInfo
    }

    getTitle(): string {
        return this.externalInfo.name
    }

    getArtist(): string {
        return this.externalInfo.artist
    }

    getExternalTrackInfo(): ExternalTrackInfo {
        return this.externalInfo
    }
}

export interface ExternalTrackInfo {
    id: string
    name: string
    artist: string
    metadata: {
        externalURL: string
    }
}