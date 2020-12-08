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
        const artistsResponse = await spotifyApi.searchArtists(artist, { limit: 1 })
        if (artistsResponse.body.artists.items.length === 0) {
            throw new Error('No artists found')
        }
        return artistsResponse.body.artists.items[0].id
    }

    export async function getTrackIDFromTrackName(track: string): Promise<string> {
        if (!track) {
            return ''
        }
        const token = await spotifyTokenPromise()
        const tracksResponse = await spotifyApi.searchTracks(track, { limit: 1 })
        if (tracksResponse.body.tracks.items.length === 0) {
            throw new Error('No tracks found')
        }
        return tracksResponse.body.tracks.items[0].id
    }

    export async function verifyGenreExists(genre: string): Promise<string> {
        if (!genre) {
            return ''
        }
        const token = await spotifyTokenPromise()
        const genreResponse = await spotifyApi.getAvailableGenreSeeds()
        if (genreResponse.body.genres.indexOf(genre) === -1) {
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
        const albumResponse = await spotifyApi.searchAlbums(query, {limit: 1})
        if (albumResponse.body.albums.items.length === 0) {
            throw new Error('No albums found')
        }
        const album = albumResponse.body.albums.items[0]
        const tracks = await getTrackNamesFromAlbumID(album.id, token)
        return convertResponseToSpotifyAlbum(album, tracks)
    }

    export async function getTrackNamesFromAlbumID(albumID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken)
        const albumResponse = await spotifyApi.getAlbumTracks(albumID)
        return convertResponseToSpotifyTracks(albumResponse.body.items)
    }

    export async function getTrackNamesFromPlaylistSearch(query: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const playlistResponse = await spotifyApi.searchPlaylists(query)
        if (playlistResponse.body.playlists.items.length === 0) {
            throw new Error('No playlists found')
        }
        return getTrackNamesFromPlaylistID(playlistResponse.body.playlists.items[0].id, token)
    }

    export async function getTrackNamesFromPlaylistID(playlistID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken)
        const playlistResponse = await spotifyApi.getPlaylist(playlistID, { fields: ['tracks'] })
        return convertResponseToSpotifyTracks(playlistResponse.body.tracks)
    }

    export async function getRandomizedTrackNamesFromArtistName(artist: string, count: number = 25): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const artistID = await getArtistIDFromArtistName(artist)
        const artistResponse = await spotifyApi.getArtistAlbums(artistID)
        const albumIDs = artistResponse.body.items.map((album: any) => album.id)
        const albumResponse = await spotifyApi.getAlbums(albumIDs)
        const tracks = albumResponse.body.albums.map((album: any) => album.tracks.items).flat()
        const filteredTracks = tracks.filter((v: any, i: number, a: any[]) => {
            return a.findIndex((t: any) => (t.id === v.id || t.name === v.name)) === i
        })
        return convertResponseToSpotifyTracks(Utils.randomlySelectNElementsInArray(filteredTracks, count))
    }

    export async function getTop10TracksNamesFromArtistName(artist: string): Promise<ExternalTrackInfo[]> {
        const token = await spotifyTokenPromise()
        const artistID = await getArtistIDFromArtistName(artist)
        const topTracksResponse = await spotifyApi.getArtistTopTracks(artistID, 'US')
        return convertResponseToSpotifyTracks(topTracksResponse.body.tracks)
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
