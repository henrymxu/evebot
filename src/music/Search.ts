import ytdl from 'discord-ytdl-core';
import Youtube from './sources/Youtube/Youtube3';
import {TrackInfo} from './tracks/Track';
import {Logger} from '../Logger';

const TAG = 'YoutubeSearch';
const YoutubeSource = new Youtube();
export namespace Search {
    export function search(query: string): Promise<TrackInfo> {
        return YoutubeSource.getTrackURLFromSearch(query).then((result: SearchResult) => {
            return retrieveYoutubeInfo(result.result!.urls).then(info => {
                Logger.d(TAG, `Found ${info.title} >> ${query}`);
                return info;
            });
        });
    }

    export async function retrieveYoutubeInfo(urls: string[]): Promise<TrackInfo> {
        for (const url of urls) {
            const basicInfo = await ytdl.getBasicInfo(url);
            if (basicInfo.formats.length > 0) {
                return {
                    id: basicInfo.videoDetails.videoId,
                    description: basicInfo.videoDetails.category,
                    length: +basicInfo.videoDetails.lengthSeconds,
                    title: basicInfo.videoDetails.title,
                    url: url,
                    artist: basicInfo.videoDetails.ownerChannelName,
                    thumbnailURL: basicInfo.thumbnail_url,
                };
            } else {
                Logger.w(TAG, `${basicInfo.videoDetails.title} does not have supported formats, trying next track`);
            }
        }
        return Promise.reject('Could not find a playable video (Possibly region locked)');
    }

    export function searchPlaylist(playlistURL: string): Promise<TrackInfo[]> {
        return YoutubeSource.getTrackURLsFromPlaylistSearch(playlistURL);
    }
}

export interface TrackSource {
    getTrackURLFromSearch(query: string): Promise<SearchResult>;
    getTrackURLsFromPlaylistSearch(playlistURL: string): Promise<TrackInfo[]>;
}

export interface SearchResult {
    result: ResultInfo;
    metadata: SearchMetaData;
}

export interface ResultInfo {
    urls: string[];
}

export interface SearchMetaData {
    mode: string; // single, playlist
}
