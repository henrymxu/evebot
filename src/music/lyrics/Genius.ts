const genius = require('genius-lyrics-api');
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
        return genius
            .getSong(options)
            .then((song: any) => {
                if (!song) {
                    throw new Error(`No lyrics found for ${songTitle}`);
                }
                return {
                    url: song.url,
                    albumArt: song.albumArt,
                    lyrics: song.lyrics,
                };
            })
            .catch((err: Error) => {
                throw new Error(`Error when retrieving lyrics for ${songTitle}: ${err}`);
            });
    }
}

export interface LyricsResult {
    url: string;
    albumArt: string;
    lyrics: string;
}
