import {Track, TrackInfo} from './tracks/Track';
import {URL} from 'url';
import {Spotify} from './sources/Spotify/Spotify';
import {Search} from './Search';
import YoutubeTrack from './tracks/YoutubeTrack';
import ExternalTrack from './tracks/ExternalTrack';
import {Logger} from '../Logger';

const TAG = 'TrackRetriever';
export namespace TrackRetriever {
    export async function retrieveTracks(query: string): Promise<Track[]> {
        try {
            const result = new URL(query);
            switch (result.hostname) {
                case 'www.youtube.com':
                    return resolveYoutubeLink(result).then(infos => {
                        return infos.map(track => new YoutubeTrack(track));
                    });
                case 'open.spotify.com':
                    return Spotify.resolveSpotifyLink(result.pathname).then(infos => {
                        return infos.map(track => new ExternalTrack(track));
                    });
            }
        } catch (e) {
            // Ignore error (means not a link)
        }
        return Search.search(query).then(result => {
            return [new YoutubeTrack(result)];
        });
    }
}

function resolveYoutubeLink(result: URL): Promise<TrackInfo[]> {
    switch (result.pathname) {
        case '/watch':
            Logger.d(TAG, `Found a Youtube video >> ${result.toString()}`);
            return Search.retrieveYoutubeInfo([result.toString()]).then(info => {
                return [info];
            });
        case '/playlist':
            Logger.d(TAG, `Found a Youtube playlist >> ${result.toString()}`);
            return Search.searchPlaylist(result.toString());
        default:
            return Promise.reject();
    }
}
