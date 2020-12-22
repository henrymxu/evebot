import {GuildContext} from '../guild/Context';
import {Message} from 'discord.js';
import {Track, TrackInfo} from './tracks/Track';
import {TrackMessageGenerator} from '../communication/TrackMessageGenerator';
import SpotifyRadio from './sources/Spotify/SpotifyRadio';
import {Radio, RadioContext} from './radio/Radio';
import {Spotify} from './sources/Spotify/Spotify';
import {Album} from './tracks/Album';
import {Logger} from '../Logger';
import {Utils} from '../utils/Utils';
import {TrackRetriever} from './TrackRetriever';
import ExternalTrack from './tracks/ExternalTrack';

export default class DJ {
    private readonly context: GuildContext;
    private readonly radio: Radio;

    constructor(context: GuildContext) {
        this.context = context;
        this.radio = new SpotifyRadio(context, (info: TrackInfo, requesterId: string, message?: Message) => {
            const track = new ExternalTrack(info, true);
            this.playTracks([track], requesterId, message);
        });
    }

    getRadio(): Radio {
        return this.radio;
    }

    getQueue(): Track[] {
        return this.context.getProvider().getAudioPlayer().getQueue();
    }

    getCurrentTrack(): Track | undefined {
        const trackInfos = this.context.getProvider().getAudioPlayer().getQueue();
        return trackInfos[0];
    }

    isPlaying(): boolean {
        return this.getCurrentTrack() !== undefined;
    }

    skip(count: number): boolean {
        return this.context.getProvider().getAudioPlayer().skip(count);
    }

    pause(): boolean {
        return this.context.getProvider().getAudioPlayer().pause();
    }

    resume() {
        return this.context.getProvider().getAudioPlayer().resume();
    }

    stop() {
        return this.radio.stop() || this.context.getProvider().getAudioPlayer().stop();
    }

    shuffle() {
        return this.context.getProvider().getAudioPlayer().shuffle();
    }

    volume(volume: number, relative = false) {
        this.context.getProvider().getAudioPlayer().setVolume(volume, relative);
    }

    request(mode: QueryMode, query: string, shuffle: boolean, requesterId: string, message?: Message): Promise<void> {
        if (this.radio.isPlaying()) {
            this.radio.stop();
        }
        let playFunc: () => Promise<void>;
        switch (mode) {
            case QueryMode.Album: {
                playFunc = () => {
                    return this.playAlbum(query, shuffle, requesterId, message);
                };
                break;
            }
            case QueryMode.Playlist: {
                playFunc = () => {
                    return this.playPlaylist(query, shuffle, requesterId, message);
                };
                break;
            }
            default: {
                playFunc = () => {
                    return this.play(query, shuffle, requesterId, message);
                };
                break;
            }
        }
        return this.executePlay(playFunc, query, message);
    }

    requestRadio(radioContext: RadioContext, message?: Message): Promise<void> {
        return this.radio.request(radioContext, message).then(() => {
            if (!this.isPlaying()) {
                this.radio.resume();
            }
        });
    }

    private executePlay(playFunc: () => Promise<void>, query: string, message?: Message): Promise<void> {
        return playFunc().catch((err: Error) => {
            Logger.e(DJ.name, `Error queuing ${query}, reason: ${err}`, this.context);
            throw err;
        });
    }

    private play(query: string, shuffle: boolean, requesterId: string, message?: Message): Promise<void> {
        return TrackRetriever.retrieveTracks(query).then(tracks => {
            if (shuffle) {
                Utils.shuffleArray(tracks);
            }
            this.playTracks(tracks, requesterId, message);
        });
    }

    private playAlbum(query: string, shuffle: boolean, requesterId: string, message?: Message): Promise<void> {
        return Spotify.getTrackInfosFromAlbumSearch(query).then(album => {
            this.onAlbumQueued(album, message);
            if (shuffle) {
                Utils.shuffleArray(album.tracks);
            }
            const tracks = album.tracks.map(info => new ExternalTrack(info));
            this.playTracks(tracks, requesterId, message);
            this.onTracksQueued(tracks);
        });
    }

    private playPlaylist(query: string, shuffle: boolean, requesterId: string, message?: Message): Promise<void> {
        return Spotify.getTrackInfosFromPlaylistSearch(query).then(album => {
            this.onAlbumQueued(album, message);
            if (shuffle) {
                Utils.shuffleArray(album.tracks);
            }
            const tracks = album.tracks.map(info => new ExternalTrack(info));
            this.playTracks(tracks, requesterId, message);
            this.onTracksQueued(tracks);
        });
    }

    private playTracks(tracks: Track[], requesterId: string, message?: Message) {
        if (tracks.length === 1) {
            const track = tracks[0];
            track.metaData = {requesterId: requesterId, source: message};
            const isPlaying = this.context.getProvider().getAudioPlayer().queueTrack(track);
            if (!isPlaying) {
                this.onTrackQueued(track);
            }
        } else {
            tracks.forEach(track => {
                track.metaData = {requesterId: requesterId, source: message};
                this.context.getProvider().getAudioPlayer().queueTrack(track);
            });
            Logger.i(DJ.name, `Queued ${tracks.length} Tracks`);
        }
    }

    private onAlbumQueued(album: Album, message?: Message) {
        const embed = TrackMessageGenerator.createAlbumQueuedEmbed(album);
        this.context.getProvider().getResponder().send({content: embed, message: message});
    }

    private onTracksQueued(tracks: Track[]) {
        const message = TrackMessageGenerator.createDynamicQueuedTracksMessage(
            this.context,
            tracks,
            tracks[0].metaData.source
        );
        this.context.getProvider().getResponder().send(message);
    }

    private onTrackQueued(track: Track) {
        const embed = TrackMessageGenerator.createTrackNewlyQueuedEmbed(track);
        this.context.getProvider().getResponder().send({
            content: embed,
            id: track.id,
            message: track.metaData.source,
        });
    }

    onTrackStarted(track: Track) {
        Logger.i(DJ.name, `Started playing: ${track.getTitle()}`, this.context);
        const embed = TrackMessageGenerator.createNowPlayingEmbed(track);
        this.context.getProvider().getResponder().send({
            content: embed,
            id: track.id,
            message: track.metaData.source,
        });
    }

    onTrackCompleted(track: Track) {
        Logger.i(DJ.name, `Finished playing: ${track.getTitle()}`, this.context);
        this.context.getProvider().getResponder().delete(track.id);
        this.context.getProvider().getResponder().delete('queue');
        this.context.getProvider().getResponder().delete('song');
    }

    onAudioPlayerFinished(forceStop = false) {
        if (!forceStop && this.radio.isPlaying()) {
            this.radio.next();
            this.radio.resume();
        } else if (this.getQueue().length === 0) {
            // If there is no more songs in the queue, and radio was requested, start it
            this.radio.resume();
        }
    }
}

export enum QueryMode {
    Play = 'play',
    Album = 'album',
    Playlist = 'playlist',
}
