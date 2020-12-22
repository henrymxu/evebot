import {SearchResult, TrackSource} from '../../Search';
import {Keys} from '../../../Keys';
import YoutubeAPI, {YouTubeSearchResults} from 'youtube-search';
import {TrackInfo} from '../../tracks/Track';

export default class Youtube implements TrackSource {
    private readonly options: YoutubeAPI.YouTubeSearchOptions;
    constructor() {
        this.options = {
            maxResults: 3,
            key: Keys.get('youtube_api_token'),
        };
    }

    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            YoutubeAPI(query, this.options, (err, results: YouTubeSearchResults[] | undefined) => {
                if (err || !results || results.length === 0) {
                    if (err) {
                        console.error(`Error searching for ${query}, ${err}`);
                    }
                    rej(err);
                    return;
                }
                const searchResult: SearchResult = {
                    result: {urls: results.map(result => result.link)},
                    metadata: {mode: 'single'},
                };
                res(searchResult);
            });
        });
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<TrackInfo[]> {
        return Promise.reject('Not supported on Youtube');
    }
}
