import {Utils} from '../../../utils/Utils'
import {Keys} from '../../../Keys'
import {ExternalTrackInfo} from '../../tracks/ExternalTrack'
import {Album} from '../../tracks/Album'
const SpotifyWebAPI = require('spotify-web-api-node')

const spotifyApi = new SpotifyWebAPI({
    clientId: Keys.get('spotify_id'),
    clientSecret: Keys.get('spotify_secret'),
    redirectUri: 'http://www.example.com/callback'
})

export namespace Spotify {
    export async function getArtistIDFromArtistName(artist: string): Promise<string> {
        if (!artist) {
            return ''
        }
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.searchArtists(artist, { limit: 1 })
        if (data.body.artists.items.length === 0) {
            throw new Error('No artists found')
        }
        return data.body.artists.items[0].id
    }

    export async function getTrackIDFromTrackName(track: string): Promise<string> {
        if (!track) {
            return ''
        }
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.searchTracks(track, { limit: 1 })
        if (data.body.tracks.items.length === 0) {
            throw new Error('No tracks found')
        }
        return data.body.tracks.items[0].id
    }

    export async function verifyGenreExists(genre: string): Promise<string> {
        if (!genre) {
            return ''
        }
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.getAvailableGenreSeeds()
        if (data.body.genres.indexOf(genre) === -1) {
            throw new Error('No genre found')
        }
        return genre
    }

    export async function getTrackNamesFromSeeds(artists: string[], genres: string[], tracks: string[],
                                           length: number): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.getRecommendations({
            seed_artists: artists,
            seed_genres: genres,
            seed_tracks: tracks,
            limit: length,
        })
        return convertResponseToSpotifyTracks(data.body.tracks)
    }

    export async function getTrackNamesFromAlbumSearch(query: string): Promise<Album> {
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.searchAlbums(query, {limit: 1})
        if (data.body.albums.items.length === 0) {
            throw new Error('No albums found')
        }
        const album = data.body.albums.items[0]
        const tracks = await getTrackNamesFromAlbumID(album.id, token)
        return convertResponseToSpotifyAlbum(album, tracks)
    }

    export async function getTrackNamesFromAlbumID(albumID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken)
        const data = await spotifyApi.getAlbumTracks(albumID)
        return convertResponseToSpotifyTracks(data.body.items)
    }

    export async function getTrackNamesFromPlaylistSearch(query: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const data = await spotifyApi.searchPlaylists(query)
        if (data.body.playlists.items.length === 0) {
            throw new Error('No playlists found')
        }
        return getTrackNamesFromPlaylistID(data.body.playlists.items[0].id, token)
    }

    export async function getTrackNamesFromPlaylistID(playlistID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken)
        const data = await spotifyApi.getPlaylist(playlistID, { fields: ['tracks'] })
        return convertResponseToSpotifyTracks(data.body.tracks)
    }

    export async function getRandomizedTrackNamesFromArtistName(artist: string, count: number = 25): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const artistID = await getArtistIDFromArtistName(artist)
        const data = await spotifyApi.getArtistAlbums(artistID)
        const albumIDs = data.body.items.map((album: any) => album.id)
        const data2 = await spotifyApi.getAlbums(albumIDs)
        const tracks = data2.body.albums.map((album: any) => album.tracks.items).flat()
        const filteredTracks = tracks.filter((v: any, i: number, a: any[]) => {
            return a.findIndex((t: any) => (t.id === v.id || t.name === v.name)) === i
        })
        return convertResponseToSpotifyTracks(Utils.randomlySelectNElementsInArray(filteredTracks, count))
    }

    export async function getTop10TracksNamesFromArtistName(artist: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const artistID = await getArtistIDFromArtistName(artist)
        const data = await spotifyApi.getArtistTopTracks(artistID, 'US')
        return convertResponseToSpotifyTracks(data.body.tracks)
    }
}

async function spotifyTokenPromise(token?: string): Promise<string> {
    if (token) {
        spotifyApi.setAccessToken(token)
        return token
    }
    const credentials = await spotifyApi.clientCredentialsGrant()
    spotifyApi.setAccessToken(credentials.body['access_token'])
    return credentials.body['access_token']
}

function convertResponseToSpotifyAlbum(album: any, tracks: ExternalTrackInfo[]): Album {
    return {
        id: album.id,
        name: album.name,
        artist: album.artists[0].name,
        tracks: tracks,
        metadata: {
            imageURL: album.images[0].url,
            externalURL: album.external_urls.spotify
        }
    }
}

function convertResponseToSpotifyTracks(tracks: any[]): ExternalTrackInfo[] {
    return tracks.map((track) => convertResponseToSpotifyTrack(track))
}

function convertResponseToSpotifyTrack(result: any): ExternalTrackInfo {
    return {
        id: result.id,
        name: result.name,
        artist: result.artists[0].name,
        metadata: {
            externalURL: result.external_urls.spotify
        }
    }
}
