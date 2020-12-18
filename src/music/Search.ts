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
            const result = await parseQueryForType(query)
            switch(result.metadata.mode) {
                case 'single':
                    const track = await resolveSingleTrack(result.results[0].urls, info)
                    Logger.d(TAG, `Found ${track.getTitle()} >> ${query}`)
                    return [track]
                case 'playlist':
                    const tracks = await resolveMultipleTracks(result)
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
        const promises: Promise<Track>[] = []
        album.tracks.forEach((info: ExternalTrackInfo) => {
            promises.push(parseQueryForType(convertTrackInfoToSearchableName(info)).then((searchResult) => {
                return resolveSingleTrack(searchResult.results[0].urls, info)
            }))
        })
        return Promise.all(promises)
    }
}

function parseQueryForType(query: string): Promise<SearchResult> {
    try {
        const result = new URL(query)
        if (result.hostname === 'www.youtube.com') {
            switch (result.pathname) {
                case '/watch':
                    Logger.d(TAG, `Found a Youtube video >> ${query}`)
                    return Promise.resolve({
                        results: [{urls: [query]}],
                        metadata: {
                            mode: 'single',
                            query: query
                        }
                    })
                case '/playlist':
                    Logger.d(TAG, `Found a Youtube playlist >> ${query}`)
                    return YoutubeSource.getTrackURLsFromPlaylistSearch(query)
            }
        } else if (result.hostname === 'open.spotify.com') {
            // TODO: implement spotify song parsing
            if (result.pathname?.includes('playlist')) {
                const regex = new RegExp(/^\/playlist\/(\S*)$/)
                const id = result.pathname?.match(regex)?.[1]
                if (!id) {
                    return Promise.reject(new Error('Error parsing Spotify Playlist ID'))
                }
                Logger.d(TAG, `Finding Spotify Playlist with ID >> ${id}`)
                return Spotify.getTrackInfosFromPlaylistID(id).then(trackInfos => {
                    return convertExternalTrackInfosToSearchResult(trackInfos)
                })
            } else if (result.pathname?.includes('album')) {
                const regex = new RegExp(/^\/album\/(\S*)$/)
                const id = result.pathname?.match(regex)?.[1]
                if (!id) {
                    return Promise.reject(new Error('Error parsing Spotify Album ID'))
                }
                Logger.d(TAG, `Finding Spotify Album with ID >> ${id}`)
                return Spotify.getTrackInfosFromAlbumID(id).then(trackInfos => {
                    return convertExternalTrackInfosToSearchResult(trackInfos)
                })
            }
        }
    } catch (e) {
        // ignore error
    }
    return YoutubeSource.getTrackURLFromSearch(query)
}

function convertExternalTrackInfosToSearchResult(trackInfos: ExternalTrackInfo[]): Promise<SearchResult> {
    const promises: Promise<SearchResult>[] = []
    trackInfos.forEach((info: ExternalTrackInfo) => {
        promises.push(YoutubeSource.getTrackURLFromSearch(convertTrackInfoToSearchableName(info)))
    })
    return Promise.allSettled(promises).then(searchResults => {
        const resultInfos: ResultInfo[] = searchResults
                .filter((searchResult: any) => searchResult.status === 'fulfilled')
                .map((searchResult: any) => { return { urls: searchResult.value.results[0].urls } })
        return {
            results: resultInfos,
            metadata: { mode: 'playlist' }
        }
    })
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

async function resolveMultipleTracks(searchResult: SearchResult): Promise<Track[]> {
    const promises: Promise<Track>[] = []
    for (let result of searchResult.results) {
        promises.push(resolveSingleTrack(result.urls))
    }
    return Promise.all(promises)
}

function convertTrackInfoToSearchableName(info: ExternalTrackInfo): string {
    return `${info.artist} - ${info.name}`
}

export interface TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult>
    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<SearchResult>
}

export interface SearchResult {
    results: ResultInfo[]
    metadata: SearchMetaData
}

export interface ResultInfo {
    urls: string[]
}

export interface SearchMetaData {
    mode: string // single, playlist
}
