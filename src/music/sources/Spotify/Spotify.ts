import SpotifyWebAPI from "spotify-web-api-node"
import Keys from "../../../Keys"

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
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchArtists(artist, { limit: 1 }).then(data => {
                    if (data.body.artists.items.length === 0) {
                        rej('No artists found')
                        return
                    }
                    res(data.body.artists.items[0].id)
                }).catch(err => { rej(err) })
            })
        })
    }

    export function searchTrack(track: string): Promise<string> {
        if (!track) {
            return Promise.resolve('')
        }
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchTracks(track, { limit: 1 }).then(data => {
                    if (data.body.tracks.items.length === 0) {
                        rej('No tracks found')
                        return
                    }
                    res(data.body.tracks.items[0].id)
                }).catch(err => { rej(err) })
            })
        })
    }

    export function searchGenre(genre: string): Promise<string> {
        if (!genre) {
            return Promise.resolve('')
        }
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.getAvailableGenreSeeds().then(data => {
                    if (data.body.genres.indexOf(genre) === -1) {
                        rej('No genre found')
                        return
                    }
                    res(genre)
                }).catch(err => { rej(err) })
            })
        })
    }

    export function getTrackNamesFromSeeds(artists: string[], genres: string[], tracks: string[], length: number): Promise<string[]> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.getRecommendations({
                    seed_artists: artists,
                    seed_genres: genres,
                    seed_tracks: tracks,
                    limit: length,
                }).then(result => {
                    res(convertResponseToNames(result))
                }).catch(err => {
                    rej(err)
                })
            })
        })
    }

    export function getTrackNameFromSearch(query: string): Promise<string> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchTracks(query).then(result => {
                    if (result.body.tracks.items.length === 0) {
                        rej('No tracks found')
                        return
                    }
                    res(convertResponseToName(result.body.tracks.items[0]))
                })
            })
        })
    }

    export function getTrackNamesFromPlaylistSearch(query: string): Promise<string[]> {
        return new Promise((res, rej) => {
            spotifyApi.clientCredentialsGrant().then(data => {
                spotifyApi.setAccessToken(data.body['access_token'])
                spotifyApi.searchPlaylists(query).then(result => {
                    if (result.body.playlists.items.length === 0) {
                        rej('No playlists found')
                        return
                    }
                    this.getTrackNamesFromPlaylistURL(result.body.playlists.items[0].id, data.body['access_token'])
                        .then((data) => { res(data)})
                        .catch(err => {
                            console.log(`Spotify error: ${err}`)
                            rej(err)
                        })
                })
            })
        })
    }

    export function getTrackNamesFromPlaylistURL(playlistURL: string, accessToken?: string): Promise<string[]> {
        return new Promise(async (res, rej) => {
            if (!accessToken) {
                accessToken = await spotifyApi.clientCredentialsGrant()
            }
            spotifyApi.setAccessToken(accessToken)
            spotifyApi.getPlaylist(playlistURL.replace('/playlist/', ''), {
                fields: ['tracks']
            }).then((data) => {
                res(convertResponseToNames(data))
            }).catch(err => {
                console.log(`Spotify error: ${err}`)
                rej(err)
            })
        })
    }
}

function convertResponseToNames(result: any): string[] {
    return result.body.tracks.map(track => convertResponseToName(track))
}

function convertResponseToName(result: any): string {
    return `${result.artists[0].name} - ${result.name}`
}