import {SearchResult, TrackSource} from "../../Search"
import {Keys} from "../../../Keys"
const YoutubeAPI = require("simple-youtube-api")

export default class Youtube2 implements TrackSource {
    private api
    constructor() {
        this.api = new YoutubeAPI(Keys.get('youtube_api_token'))
    }

    getTrackURLFromSearch(query: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            this.api.searchVideos(query, 3, {
                'relevanceLanguage': 'en'
            }).then((results: any[]) => {
                if (results.length === 0) {
                    rej(`No search results found for ${query}`)
                }
                const searchResult: SearchResult = {
                    infos: results.map((result) => { return { url: result.url } }),
                    metadata: {
                        mode: "single",
                        query: query
                    }
                }
                res(searchResult)
            }).catch((err: Error) => {
                rej(`Unable to find search results from YoutubeAPI ${err.message}`)
            })
        })
    }

    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult> {
        return new Promise((res, rej) => {
            this.api.getPlaylist(playlistURL).then((playlist: any) => {
                console.log(`The playlist's title is ${playlist.title}`)
                playlist.getVideos().then((videos: any[]) => {
                    console.log(`This playlist has ${videos.length === 50 ? '50+' : videos.length} videos.`)
                    const searchResult: SearchResult = {
                        infos: videos.map((result) => { return { url: result.url } }),
                        metadata: {
                            mode: "playlist",
                            query: playlistURL
                        }
                    }
                    res(searchResult)
                }).catch((err: Error) => {
                    rej(err)
                })
            }).catch((err: Error) => {
                rej(err)
            })
        })
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