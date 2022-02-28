import {Keys} from '../../Keys';

export namespace GeniusLyrics {
    export function get(songTitle: string, artist?: string): Promise<LyricsResult> {
        const artistString = artist || '';
        const options = {
            apiKey: Keys.get('genius_token'),
            title: songTitle,
            artist: artistString,
            optimizeQuery: true,
        };
        return Promise.reject('This feature is temporarily disabled');
    }
}

export interface LyricsResult {
    url: string;
    albumArt: string;
    lyrics: string;
}
