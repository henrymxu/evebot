import {URL} from 'url'
import ytdl from 'discord-ytdl-core'
import Youtube from './sources/Youtube/Youtube3'
import {Utils} from '../utils/Utils'
import {Readable} from 'stream'
import {Track} from './tracks/Track'
import YoutubeTrack, {YoutubeTrackInfo} from './tracks/YoutubeTrack'
import {Album} from './tracks/Album'
import ExternalTrack, {ExternalTrackInfo} from './tracks/ExternalTrack'
import {Logger} from '../Logger'

const TAG = 'YoutubeSearch'
const YoutubeSource = new Youtube()
export namespace Search {
    export async function search(query: string, info?: ExternalTrackInfo): Promise<Track[]> {
        try {
            const result = await parseQueryForType(query)
            switch(result.metadata.mode) {
                case 'single':
                case 'playlist':
                    // TODO: handle playlist result
                case 'stream':
                    // TODO: handle stream result
                default:
                    const track = await resolveSingleTrack(result, info)
                    return [track]
            }
        } catch (e) {
            Logger.e(TAG, `Error searching for track ${query}, reason: ${e}`)
            throw(e)
        }
    }

    export function searchAlbum(album: Album): Promise<Track[]> {
        const promises: Promise<Track>[] = []
        album.tracks.forEach((info: ExternalTrackInfo) => {
            promises.push(parseQueryForType(`${info.artist} - ${info.name}`).then((searchResult) => {
                return resolveSingleTrack(searchResult, info)
            }))
        })
        return Promise.all(promises)
    }
}

async function resolveSingleTrack(result: SearchResult, extraInfo?: ExternalTrackInfo): Promise<Track> {
    let resolved = false
    for (let info of result.infos) {
        if (!info.url) {
            continue
        }
        const basicInfo = await ytdl.getBasicInfo(info.url)
        if (basicInfo.formats.length > 0) {
            resolved = true
            Logger.d(TAG, `Found ${basicInfo.videoDetails.title} >> ${result.metadata.query}`)
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
            Logger.w(TAG, `${basicInfo.videoDetails.title} does not have supported formats, trying next track`)
        }
    }
    throw new Error('Could not find a playable video (region locked)')
}

function parseQueryForType(query: string): Promise<SearchResult> {
    try {
        const result = new URL(query)
        if (result.hostname === 'www.youtube.com') {
            switch (result.pathname) {
                case '/watch':
                    Logger.d(TAG, `Found a Youtube video >> ${query}`)
                    return Promise.resolve({
                        infos: [{url: query}],
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
                //.replace('/playlist/', '')
                // return retrieveSongsFromSpotifyPlaylist(result.pathname)
            }
        }
    } catch (e) {
        // ignore error
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
