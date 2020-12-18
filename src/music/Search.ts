import {URL} from 'url'
import ytdl from 'discord-ytdl-core'
import Youtube from './sources/Youtube/Youtube3'
import {Utils} from '../utils/Utils'
import {Track} from './tracks/Track'
import YoutubeTrack, {YoutubeTrackInfo} from './tracks/YoutubeTrack'
import {Album} from './tracks/Album'
import ExternalTrack, {ExternalTrackInfo} from './tracks/ExternalTrack'
import {Logger} from '../Logger'
import {Spotify} from './sources/Spotify/Spotify'

const TAG = 'YoutubeSearch'
const YoutubeSource = new Youtube()
export namespace Search {
    export async function search(query: string, info?: ExternalTrackInfo): Promise<Track[]> {
        try {
            const result = await parseQueryForResult(query)
            switch(result.metadata.mode) {
                case 'single':
                    const track = await resolveSingleTrack(result.result!.urls, info)
                    Logger.d(TAG, `Found ${track.getTitle()} >> ${query}`)
                    return [track]
                case 'playlist':
                    const tracks = await resolveExternalTrackInfos(result.trackInfos!)
                    Logger.d(TAG, `Found ${tracks.length} tracks for >> ${query}`)
                    return tracks
                case 'stream':
                    // TODO: handle stream result
                default:
                    return Promise.reject(new Error('Error'))
            }
        } catch (e) {
            Logger.e(TAG, `Error searching for track(s) >> ${query}, reason: ${e}`)
            throw(e)
        }
    }

    export function searchAlbum(album: Album): Promise<Track[]> {
        return resolveExternalTrackInfos(album.tracks)
    }
}

function parseQueryForResult(query: string): Promise<SearchResult> {
    try {
        const result = new URL(query)
        if (result.hostname === 'www.youtube.com') {
            switch (result.pathname) {
                case '/watch':
                    Logger.d(TAG, `Found a Youtube video >> ${query}`)
                    return Promise.resolve({
                        result: { urls: [query] },
                        metadata: { mode: 'single' }
                    })
                case '/playlist':
                    Logger.d(TAG, `Found a Youtube playlist >> ${query}`)
                    return YoutubeSource.getTrackURLsFromPlaylistSearch(query)
            }
        } else if (result.hostname === 'open.spotify.com') {
            return Spotify.resolveSpotifyLink(result.pathname).then((trackInfos: ExternalTrackInfo[]) => {
                return {
                    trackInfos: trackInfos,
                    metadata: { mode: 'playlist' }
                }
            })
        }
    } catch (e) {
        // ignore error
    }
    return YoutubeSource.getTrackURLFromSearch(query)
}

async function resolveSingleTrack(urls: string[], extraInfo?: ExternalTrackInfo): Promise<Track> {
    let resolved = false
    for (let url of urls) {
        const basicInfo = await ytdl.getBasicInfo(url)
        if (basicInfo.formats.length > 0) {
            resolved = true
            const id = Utils.generateUUID()
            const youtubeInfo: YoutubeTrackInfo = {
                description: basicInfo.videoDetails.shortDescription,
                length: +basicInfo.videoDetails.lengthSeconds,
                title: basicInfo.videoDetails.title,
                url: url,
                channel: basicInfo.videoDetails.ownerChannelName,
                thumbnailURL: basicInfo.thumbnail_url
            }
            if (!extraInfo) {
                return new YoutubeTrack(id, youtubeInfo)
            } else {
                return new ExternalTrack(id, youtubeInfo, extraInfo)
            }
        } else {
            Logger.w(TAG, `${basicInfo.videoDetails.title} does not have supported formats, trying next track`)
        }
    }
    throw new Error('Could not find a playable video (Possibly region locked)')
}

async function resolveExternalTrackInfos(infos: ExternalTrackInfo[]): Promise<Track[]> {
    const promises = infos.map((info: ExternalTrackInfo) => {
        let urlPromise: Promise<SearchResult>
        if (info.isYoutube) {
            urlPromise = Promise.resolve({
                result: { urls: [info.metadata.externalURL] },
                metadata: { mode: 'single' }
            })
        } else {
            urlPromise = YoutubeSource.getTrackURLFromSearch(convertTrackInfoToSearchableName(info))
        }
        return urlPromise.then((searchResult: SearchResult) => {
            return resolveSingleTrack(searchResult.result!.urls, info)
        })
    })
    return Promise.allSettled(promises).then(results => {
        const fulfilled = results.filter(result => result.status === 'fulfilled').map((result: any) => result.value)
        return Promise.resolve(fulfilled)
    })
}

function convertTrackInfoToSearchableName(info: ExternalTrackInfo): string {
    return `${info.artist} - ${info.name}`
}

export interface TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult>
    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult>
}

export interface SearchResult {
    result?: ResultInfo
    trackInfos?: ExternalTrackInfo[]
    metadata: SearchMetaData
}

export interface ResultInfo {
    urls: string[]
}

export interface SearchMetaData {
    mode: string // single, playlist
}
