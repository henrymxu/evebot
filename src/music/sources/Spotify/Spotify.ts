// @ts-ignore
import SpotifyWebAPI from "spotify-web-api-node"
import {Keys} from "../../../Keys"
import {ExternalTrackInfo} from "../../tracks/ExternalTrack"
import {Album} from "../../tracks/Album"

const spotifyApi = new SpotifyWebAPI({
    clientId: Keys.get('spotify_id'),
    clientSecret: Keys.get('spotify_secret'),
    redirectUri: 'http://www.example.com/callback'
})

export namespace Spotify {
    export function searchArtist(artist: string): Promise<string> {
        if (!artist) {
            return Promise.resolve('')
        }
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchArtists(artist, { limit: 1 }).then((data: any) => {
                    if (data.body.artists.items.length === 0) {
                        rej('No artists found')
                        return
                    }
                    res(data.body.artists.items[0].id)
                }).catch((err: Error) => { rej(err) })
            })
        })
    }

    export function searchTrack(track: string): Promise<string> {
        if (!track) {
            return Promise.resolve('')
        }
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchTracks(track, { limit: 1 }).then((data: any) => {
                    if (data.body.tracks.items.length === 0) {
                        rej('No tracks found')
                        return
                    }
                    res(data.body.tracks.items[0].id)
                }).catch((err: Error) => { rej(err) })
            })
        })
    }

    export function searchGenre(genre: string): Promise<string> {
        if (!genre) {
            return Promise.resolve('')
        }
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.getAvailableGenreSeeds().then((data: any) => {
                    if (data.body.genres.indexOf(genre) === -1) {
                        rej('No genre found')
                        return
                    }
                    res(genre)
                }).catch((err: Error) => { rej(err) })
            })
        })
    }

    export function getTrackNamesFromSeeds(artists: string[], genres: string[], tracks: string[],
                                           length: number): Promise<ExternalTrackInfo[]> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.getRecommendations({
                    seed_artists: artists,
                    seed_genres: genres,
                    seed_tracks: tracks,
                    limit: length,
                }).then((result: any) => {
                    res(convertResponseToSpotifyTracks(result.body.tracks))
                }).catch((err: Error) => {
                    rej(err)
                })
            })
        })
    }

    export function getTrackNamesFromAlbumSearch(query: string): Promise<Album> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchAlbums(query, {limit: 1}).then((result: any) => {
                    if (result.body.albums.items.length === 0) {
                        rej('No albums found')
                        return
                    }
                    const album = result.body.albums.items[0]
                    getTrackNamesFromAlbumID(album.id, data.body['access_token']).then((tracks) => {
                        res(convertResponseToSpotifyAlbum(album, tracks))
                    })
                }).catch((err: Error) => {
                    rej(err)
                })
            })
        })
    }

    export function getTrackNamesFromAlbumID(albumID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        return new Promise((res, rej) => {
            let accessTokenPromise: Promise<any> = Promise.resolve(accessToken)
            if (!accessToken) {
                accessTokenPromise = spotifyApi.clientCredentialsGrant()
            }
            accessTokenPromise.then((token) => {
                spotifyApi.setAccessToken(token.body['access_token'])
                spotifyApi.getAlbumTracks(albumID).then((data: any) => {
                    res(convertResponseToSpotifyTracks(data.body.items))
                }).catch((err: Error) => {
                    rej(err)
                })
            }).catch((err: Error) => {
                rej(err)
            })
        })
    }

    export function getTrackNamesFromPlaylistSearch(query: string): Promise<ExternalTrackInfo[]> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then((data: any) => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchPlaylists(query).then((result: any) => {
                    if (result.body.playlists.items.length === 0) {
                        rej('No playlists found')
                        return
                    }
                    getTrackNamesFromPlaylistID(result.body.playlists.items[0].id, data.body['access_token'])
                        .then((data: ExternalTrackInfo[]) => { res(data) })
                }).catch((err: Error) => {
                    rej(err)
                })
            })
        })
    }

    export function getTrackNamesFromPlaylistID(playlistID: string, accessToken?: string): Promise<ExternalTrackInfo[]> {
        return new Promise((res, rej) => {
            let accessTokenPromise: Promise<any> = Promise.resolve(accessToken)
            if (!accessToken) {
                accessTokenPromise = spotifyApi.clientCredentialsGrant()
            }
            accessTokenPromise.then((token: any) => {
                spotifyApi.setAccessToken(token.body['access_token'])
                spotifyApi.getPlaylist(playlistID, {
                    fields: ['tracks']
                }).then((data: any) => {
                    res(convertResponseToSpotifyTracks(data.body.tracks))
                }).catch((err: Error) => {
                    rej(err)
                })
            }).catch((err: Error) => {
                rej(err)
            })
        })
    }
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
