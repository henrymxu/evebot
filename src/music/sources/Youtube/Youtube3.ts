import {TrackSource, SearchResult} from '../../Search'
import ytsr, {Item, Result, Video} from 'ytsr'
import ytpl from 'ytpl'
import {Logger} from '../../../Logger'

const TAG = 'YoutubeSource3'

export default class Youtube3 implements TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return ytsr(query, { limit: 3 }).then((result: Result) => {
            const videos = result.items.filter((item: Item) => item.type === 'video')
            if (videos.length === 0) {
                throw new Error(`No search results found for ${query}`)
            }
            const searchResult: SearchResult = {
                infos: videos.map((item: Item) => { return { url: (item as Video).link } }),
                metadata: {
                    mode: 'single',
                    query: query
                }
            }
            return searchResult
        }).catch((err: Error) => {
            Logger.e(TAG, `Search Error, reason: ${err}`)
            throw err
        })
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult> {
        return ytpl(playlistURL).then((result) => {
            Logger.i(TAG, `Found playlist ${result.title} with ${result.total_items} items`)
            const searchResult: SearchResult = {
                infos: result.items.map((item) => { return { url: item.url_simple }}),
                metadata: {
                    mode: 'single',
                    query: playlistURL
                }
            }
            return searchResult
        })
    }
}