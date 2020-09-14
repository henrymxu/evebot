import genius from "genius-lyrics-api"
import Keys from "../../Keys"

export namespace GeniusLyrics {
    export function get(songTitle: string, artist?: string): Promise<LyricsResult> {
        return new Promise((res, rej) => {
            const artistString = artist ? artist : ''
            const options = {
                apiKey: Keys.get('genius_token'),
                title: songTitle,
                artist: artistString,
                optimizeQuery: true
            };
            genius.getSong(options).then((song) => {
                if (!song) {
                    rej(`No lyrics found for ${songTitle}`)
                    return
                }
                res({
                    url: song.url,
                    albumArt: song.albumArt,
                    lyrics: song.lyrics
                })
            }).catch(err => {
                rej(`Error when retrieving lyrics for ${songTitle}: ${err}`)
            })
        })
    }
}

export interface LyricsResult {
    url: string
    albumArt: string
    lyrics: string
}
