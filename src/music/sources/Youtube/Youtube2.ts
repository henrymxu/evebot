import {SearchResult, TrackSource} from '../../Search';
import {Keys} from '../../../Keys';
import {Logger} from '../../../Logger';
import {TrackInfo} from '../../tracks/Track';
const YoutubeAPI = require('simple-youtube-api');

const TAG = 'YoutubeSource2 (simple-youtube-api)';
export default class Youtube2 implements TrackSource {
    private api;
    constructor() {
        this.api = new YoutubeAPI(Keys.get('youtube_api_token'));
    }

    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return this.api
            .searchVideos(query, 3, {relevanceLanguage: 'en'})
            .then((results: any[]) => {
                if (results.length === 0) {
                    throw new Error(`No search results found for ${query}`);
                }
                const searchResult: SearchResult = {
                    result: {urls: results.map(result => result.url)},
                    metadata: {mode: 'single'},
                };
                return searchResult;
            })
            .catch((err: Error) => {
                throw new Error(`Unable to find search results from YoutubeAPI ${err.message}`);
            });
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<TrackInfo[]> {
        return Promise.reject('Not supported on Youtube2');
        // return this.api.getPlaylist(playlistURL).then((playlist: any) => {
        //     Logger.i(TAG, `The playlist's title is ${playlist.title}`)
        //     return playlist.getVideos()
        // }).then((videos: any[]) => {
        //     Logger.i(TAG, `This playlist has ${videos.length === 50 ? '50+' : videos.length} videos.`)
        //     const searchResult: SearchResult = {
        //         result: videos.map((result) => { return { urls: [result.url] } }),
        //         metadata: { mode: 'playlist' }
        //     }
        //     return searchResult
        // })
    }
}

/**
 Video {
    type: 'video',
    raw: {
      kind: 'youtube#searchResult',
      etag: 'uB1F3Wtd4YYo_vGCG7YbUoR5i1k',
      id: [Object],
      snippet: [Object]
    },
    full: false,
    kind: 'youtube#searchResult',
    id: '5tXh_MfrMe0',
    title: 'Rascal Flatts - Life Is a Highway (From &quot;Cars&quot;/Official Video)',
    description: 'Best of Rascal Flatts: https://goo.gl/RogHVN Subscribe here: https://goo.gl/mJjBnF Music video by Rascal Flatts performing Life Is a Highway. (C) 2006 ...',
    thumbnails: { default: [Object], medium: [Object], high: [Object] },
    publishedAt: 2015-01-23T08:00:01.000Z,
    channel: Channel {
      type: 'channel',
      raw: [Object],
      full: false,
      kind: 'youtube#searchResult',
      id: 'UCMh30naOxjDTxd6Rigg6JjQ',
      title: 'RascalFlattsVEVO'
    }
    **/
