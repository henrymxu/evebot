import {SearchResult, TrackSource} from "../../Search"
import Keys from "../../../Keys"

import YoutubeAPI from "youtube-search"

export default class Youtube implements TrackSource {
    private options: YoutubeAPI.YouTubeSearchOptions
    constructor() {
        this.options = {
            maxResults: 3,
            key: Keys.get('youtube_api_token')
        }
    }

    getTrackUrl(query: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            YoutubeAPI(query, this.options, (err, results) => {
                if (err || !results || results.length === 0) {
                    if (err) {
                        console.error(`Error searching for ${query}, ${err}`)
                    }
                    rej(err)
                    return
                }
                const searchResult: SearchResult = {
                    infos: results.map(result => {
                        return {
                            url: result.link,
                        }
                    }),
                    metadata: {
                        mode: "single",
                        query: query
                    }
                }
                res(searchResult)
            })
        })
    }

    getTrackUrlsFromPlaylist(playlistURL: string): Promise<SearchResult> {
        return undefined;
    }

}