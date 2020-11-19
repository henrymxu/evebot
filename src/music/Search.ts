import url from "url"
import ytdl from "discord-ytdl-core"
import Youtube from "./sources/Youtube/Youtube2"
import {Utils} from "../utils/Utils"
import {Readable} from "stream"
import {Track} from "./tracks/Track"
import YoutubeTrack, {YoutubeTrackInfo} from "./tracks/YoutubeTrack"
import {Album} from "./tracks/Album"
import ExternalTrack, {ExternalTrackInfo} from "./tracks/ExternalTrack"
import {Logger} from "../Logger"

const TAG = 'YoutubeSearch'
const YoutubeSource = new Youtube()
export namespace Search {
    export function search(query): Promise<Track[]> {
        return new Promise((res, rej) => {
            parse(query).then(async (result) => {
                if (result.metadata.mode == "single") {
                    resolveSingleTrack(result).then((trackInfo) => {
                        res([trackInfo])
                    }).catch(err => { rej(err) })
                } else if (result.metadata.mode == "playlist") {

                } else if (result.metadata.mode == "stream") {

                }
            }).catch(err => {
                Logger.e(null, TAG, `Error searching for track ${query}, reason: ${err}`)
                rej(err)
            })
        })
    }

    export function searchAlbum(album: Album): Promise<Track[]> {
        const promises: Promise<Track>[] = []
        album.tracks.forEach((track) => {
            promises.push(new Promise<Track>((res1, rej1) => {
                parse(`${track.artist} - ${track.name}`).then((searchResult) => {
                    resolveSingleTrack(searchResult, track).then((trackResult) => {
                        res1(trackResult)
                    })
                })
            }))
        })
        return Promise.all(promises)
    }

    async function resolveSingleTrack(result: SearchResult, extraInfo?: ExternalTrackInfo): Promise<Track> {
        let resolved = false
        for (let info of result.infos) {
            const basicInfo = await ytdl.getBasicInfo(info.url)
            if (basicInfo.formats.length > 0) {
                resolved = true
                Logger.d(null, TAG, `Found ${basicInfo.videoDetails.title} for ${result.metadata.query}`)
                const id = Utils.generateUUID()
                const youtubeInfo: YoutubeTrackInfo = {
                    description: basicInfo.videoDetails.shortDescription,
                    length: +basicInfo.videoDetails.lengthSeconds,
                    title: basicInfo.videoDetails.title,
                    url: info.url,
                    channel: basicInfo.videoDetails.ownerChannelName,
                    thumbnailURL: basicInfo.thumbnail_url
                }
                if (!extraInfo) {
                    return new YoutubeTrack(id, youtubeInfo)
                } else {
                    return new ExternalTrack(id, youtubeInfo, extraInfo)
                }
            } else {
                Logger.w(null, TAG,
                    `${basicInfo.videoDetails.title} does not have supported formats, trying next track`)
            }
        }
        return Promise.reject('Could not find a playable video (region locked)')
    }
}

function parse(query: string): Promise<SearchResult> {
    const result = url.parse(query)
    if (result.hostname === 'www.youtube.com') {
        switch (result.pathname) {
            case '/watch':
                Logger.d(null, TAG, `Found a Youtube video for ${query}`)
                return YoutubeSource.getTrackURLFromSearch(query)
            case '/playlist':
                Logger.d(null, TAG, `Found a Youtube playlist for ${query}`)
                return YoutubeSource.getTrackURLsFromPlaylistSearch(query)
        }
    } else if (result.hostname === 'open.spotify.com') {
        if (result.pathname.includes('playlist')) {
            //.replace('/playlist/', '')
            // return retrieveSongsFromSpotifyPlaylist(result.pathname)
        }
    }
    return YoutubeSource.getTrackURLFromSearch(query)
}

export interface TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult>
    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult>
}

export interface SearchResult {
    infos: ResultInfo[]
    metadata: SearchMetaData
}

export interface ResultInfo {
    url?: string
    stream?: Readable
}

export interface SearchMetaData {
    mode: string // single, playlist
    query: string
}

function filter(format) {
    return format.codecs === 'opus' &&
        format.container === 'webm' &&
        format.audioSampleRate == 48000;
}

/**
 * Tries to find the highest bitrate audio-only format. Failing that, will use any available audio format.
 * @param {Object[]} formats The formats to select from
 * @param {boolean} isLive Whether the content is live or not
 */
function nextBestFormat(formats: any[], isLive: boolean) {
    let filter = format => format.audioBitrate;
    if (isLive) filter = format => format.audioBitrate && format.isHLS;
    formats = formats
        .filter(filter)
        .sort((a, b) => b.audioBitrate - a.audioBitrate);
    return formats.find(format => !format.bitrate) || formats[0];
}
