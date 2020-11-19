import { ExternalTrackInfo } from './ExternalTrack'

export interface Album {
    id: string
    name: string
    artist: string
    tracks: ExternalTrackInfo[]
    metadata: {
        imageURL: string
        externalURL: string
    }
}
