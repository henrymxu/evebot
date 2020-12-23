import {Utils} from '../../../utils/Utils';
import {Keys} from '../../../Keys';
import {Album} from '../../tracks/Album';
import {Logger} from '../../../Logger';
import {TrackInfo} from '../../tracks/Track';
const SpotifyWebAPI = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebAPI({
    clientId: Keys.get('spotify_id'),
    clientSecret: Keys.get('spotify_secret'),
    redirectUri: 'http://www.example.com/callback',
});

export namespace Spotify {
    export function resolveSpotifyLink(pathname: string): Promise<TrackInfo[]> {
        if (pathname.includes('playlist')) {
            const regex = new RegExp(/^\/playlist\/(\S*)$/);
            const id = pathname.match(regex)?.[1];
            if (!id) {
                return Promise.reject(new Error('Error parsing Spotify Playlist ID'));
            }
            Logger.d('Spotify', `Finding Spotify Playlist with ID >> ${id}`);
            return Spotify.getTrackInfosFromPlaylistID(id);
        } else if (pathname.includes('album')) {
            const regex = new RegExp(/^\/album\/(\S*)$/);
            const id = pathname.match(regex)?.[1];
            if (!id) {
                return Promise.reject(new Error('Error parsing Spotify Album ID'));
            }
            Logger.d('Spotify', `Finding Spotify Album with ID >> ${id}`);
            return Spotify.getTrackInfosFromAlbumID(id);
        }
        return Promise.reject(new Error('Not a valid Spotify link'));
    }

    export async function getArtistIDFromArtistName(artist: string): Promise<string> {
        if (!artist) {
            return '';
        }
        const token = await spotifyTokenPromise();
        const artistsResponse = await spotifyApi.searchArtists(artist, {
            limit: 1,
        });
        if (artistsResponse.body.artists.items.length === 0) {
            throw new Error(`No artists found for "${artist}"`);
        }
        return artistsResponse.body.artists.items[0].id;
    }

    export async function getTrackIDFromTrackName(track: string): Promise<string> {
        if (!track) {
            return '';
        }
        const token = await spotifyTokenPromise();
        const tracksResponse = await spotifyApi.searchTracks(track, {limit: 1});
        if (tracksResponse.body.tracks.items.length === 0) {
            throw new Error(`No tracks found for "${track}"`);
        }
        return tracksResponse.body.tracks.items[0].id;
    }

    export async function verifyGenreExists(genre: string): Promise<string> {
        if (!genre) {
            return '';
        }
        const token = await spotifyTokenPromise();
        const genreResponse = await spotifyApi.getAvailableGenreSeeds();
        if (genreResponse.body.genres.indexOf(genre) === -1) {
            throw new Error(`No genre found for "${genre}"`);
        }
        return genre;
    }

    export async function getTrackInfosFromSeeds(
        artists: string[],
        genres: string[],
        tracks: string[],
        length: number
    ): Promise<TrackInfo[]> {
        const token = await spotifyTokenPromise();
        const data = await spotifyApi.getRecommendations({
            seed_artists: artists,
            seed_genres: genres,
            seed_tracks: tracks,
            limit: length,
        });
        return convertResponseToSpotifyTracks(data.body.tracks);
    }

    export async function getTrackInfosFromAlbumSearch(query: string): Promise<Album> {
        const token = await spotifyTokenPromise();
        const albumResponse = await spotifyApi.searchAlbums(query, {limit: 1});
        if (albumResponse.body.albums.items.length === 0) {
            throw new Error(`No albums found for "${query}"`);
        }
        const album = albumResponse.body.albums.items[0];
        const tracks = await getTrackInfosFromAlbumID(album.id, token);
        return convertResponseToSpotifyAlbum(album, tracks);
    }

    export async function getTrackInfosFromAlbumID(albumID: string, accessToken?: string): Promise<TrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken);
        const albumResponse = await spotifyApi.getAlbumTracks(albumID);
        return convertResponseToSpotifyTracks(albumResponse.body.items);
    }

    export async function getTrackInfosFromPlaylistSearch(query: string): Promise<Album> {
        const token = await spotifyTokenPromise();
        const playlistResponse = await spotifyApi.searchPlaylists(query);
        if (playlistResponse.body.playlists.items.length === 0) {
            throw new Error(`No playlists found for "${query}"`);
        }
        const playlist = playlistResponse.body.playlists.items[0];
        const tracks = await getTrackInfosFromPlaylistID(playlist.id, token);
        return convertResponseToSpotifyAlbum(playlist, tracks);
    }

    export async function getTrackInfosFromPlaylistID(playlistID: string, accessToken?: string): Promise<TrackInfo[]> {
        const token = await spotifyTokenPromise(accessToken);
        const playlistResponse = await spotifyApi.getPlaylist(playlistID, {
            fields: ['tracks'],
        });
        return convertResponseToSpotifyTracks(
            playlistResponse.body.tracks.items.map((playlistTrack: any) => playlistTrack.track)
        );
    }

    export async function getRandomizedTrackInfosFromArtistName(artist: string, count = 25): Promise<TrackInfo[]> {
        const token = await spotifyTokenPromise();
        const artistID = await getArtistIDFromArtistName(artist);
        const artistResponse = await spotifyApi.getArtistAlbums(artistID);
        const albumIDs = artistResponse.body.items.map((album: any) => album.id);
        const albumResponse = await spotifyApi.getAlbums(albumIDs);
        const tracks = albumResponse.body.albums.map((album: any) => album.tracks.items).flat();
        const filteredTracks = tracks.filter((v: any, i: number, a: any[]) => {
            return a.findIndex((t: any) => t.id === v.id || t.name === v.name) === i;
        });
        return convertResponseToSpotifyTracks(Utils.randomlySelectNElementsInArray(filteredTracks, count));
    }

    export async function getTop10TracksInfosFromArtistName(artist: string): Promise<TrackInfo[]> {
        const token = await spotifyTokenPromise();
        const artistID = await getArtistIDFromArtistName(artist);
        const topTracksResponse = await spotifyApi.getArtistTopTracks(artistID, 'US');
        return convertResponseToSpotifyTracks(topTracksResponse.body.tracks);
    }
}

async function spotifyTokenPromise(token?: string): Promise<string> {
    if (token) {
        spotifyApi.setAccessToken(token);
        return token;
    }
    const credentials = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(credentials.body['access_token']);
    return credentials.body['access_token'];
}

function convertResponseToSpotifyAlbum(album: any, tracks: TrackInfo[]): Album {
    // If there is an owner, that means it is a playlist
    const artist = album.artists ? album.artists[0].name : album.owner.display_name;
    return {
        id: album.id,
        name: album.name,
        artist: artist,
        tracks: tracks,
        metadata: {
            imageURL: album.images ? album.images[0].url : undefined,
            externalURL: album.external_urls.spotify,
        },
    };
}

function convertResponseToSpotifyTracks(tracks: any[]): TrackInfo[] {
    return tracks.filter((track: any) => track !== null).map(track => convertResponseToSpotifyTrack(track));
}

function convertResponseToSpotifyTrack(result: any): TrackInfo {
    return {
        id: result.id,
        url: result.external_urls.spotify,
        title: result.name,
        artist: result.artists[0].name,
        length: result.duration_ms / 1000,
    };
}
