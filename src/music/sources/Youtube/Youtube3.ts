import {TrackSource, SearchResult} from '../../Search';
import ytsr from 'ytsr';
import ytpl from 'ytpl';
import {Logger} from '../../../Logger';
import {TrackInfo} from '../../tracks/Track';

const TAG = 'YoutubeSource3 (ytsr)';
export default class Youtube3 implements TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return ytsr(query, {limit: 3})
            .then((result: ytsr.Result) => {
                const videos = result.items.filter((item: ytsr.Item) => item.type === 'video');
                if (videos.length === 0) {
                    throw new Error(`No search results found for ${query}`);
                }
                const searchResult: SearchResult = {
                    result: {
                        urls: videos.map((item: ytsr.Item) => (item as ytsr.Video).url),
                    },
                    metadata: {mode: 'single'},
                };
                return searchResult;
            })
            .catch((err: Error) => {
                Logger.e(TAG, `Search Error for ${query}, reason: ${err}`);
                throw err;
            });
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<TrackInfo[]> {
        return ytpl(playlistURL)
            .then((result: ytpl.Result) => {
                Logger.i(TAG, `Found playlist ${result.title} with ${result.estimatedItemCount} items`);
                return result.items.map((item: ytpl.Item) => {
                    return {
                        id: item.id,
                        url: item.url,
                        title: item.title,
                        artist: item.author.name,
                        length: item.durationSec || 0,
                    };
                });
            })
            .catch((err: Error) => {
                Logger.e(TAG, `Search Error for ${playlistURL}, reason: ${err}`);
                throw err;
            });
    }
}
