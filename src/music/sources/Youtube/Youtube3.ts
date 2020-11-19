import {TrackSource, SearchResult} from "../../Search"
import ytsr from "ytsr"
import ytpl from "ytpl"
import {Logger} from "../../../Logger"

const TAG = "YoutubeSource3"

export default class Youtube3 implements TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            ytsr(query, {limit: 5}).then(result => {
                const videos = result.items.filter(item => item.type == "video")
                if (videos.length == 0) {
                    rej(`No search results found for ${query}`)
                }
                const searchResult: SearchResult = {
                    infos: videos.map((item) => {
                        return {
                            url: item["link"]
                        }
                    }),
                    metadata: {
                        mode: "single",
                        query: query
                    }
                }
                res(searchResult)
            }).catch((err) => {
                Logger.e(null, TAG, `Search Error, reason: ${err}`)
                rej(err)
            })
        })
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            ytpl(playlistURL).then(result => {
                Logger.i(null, TAG, `Found playlist ${result.title} with ${result.total_items} items`)
                const searchResult: SearchResult = {
                    infos: result.items.map((item) => {
                        return {
                            url: item.url_simple
                        }
                    }),
                    metadata: {
                        mode: "single",
                        query: playlistURL
                    }
                }
                res(searchResult)
            }).catch((err) => {
                rej(err)
            })
        })
    }
}