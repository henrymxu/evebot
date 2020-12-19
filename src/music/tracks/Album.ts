import {TrackInfo} from './Track'

export interface Album {
    id: string
    name: string
    artist: string
    tracks: TrackInfo[]
    metadata: {
        imageURL: string
        externalURL: string
    }
}
