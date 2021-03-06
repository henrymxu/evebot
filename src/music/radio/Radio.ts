import {Message} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {GlobalContext} from '../../GlobalContext';
import {Logger} from '../../Logger';
import {TrackInfo} from '../tracks/Track';

export abstract class Radio {
    protected readonly play: RadioPlay;
    protected context: GuildContext;
    protected radioConfiguration: RadioConfiguration | undefined;
    protected isLive = false;

    protected constructor(context: GuildContext, play: RadioPlay) {
        this.context = context;
        this.play = play;
    }

    protected abstract startTop10Radio(context: RadioContext, message?: Message): Promise<void>;
    protected abstract startArtistRadio(context: RadioContext, message?: Message): Promise<void>;
    protected abstract startRelatedRadio(context: RadioContext, message?: Message): Promise<void>;

    request(context: RadioContext, message?: Message): Promise<void> {
        this.radioConfiguration = undefined;
        switch (context.mode) {
            case RadioMode.ARTIST_ONLY:
                return this.startArtistRadio(context, message);
            case RadioMode.TOP_10:
                return this.startTop10Radio(context, message);
            case RadioMode.RELATED:
                return this.startRelatedRadio(context, message);
        }
    }

    isPlaying(): boolean {
        return this.isLive;
    }

    isQueued(): boolean {
        return this.radioConfiguration !== undefined;
    }

    getRadioConfiguration(): RadioConfiguration | undefined {
        return this.radioConfiguration;
    }

    next() {
        if (this.radioConfiguration?.currentTrack) {
            this.radioConfiguration?.playedTracks.unshift(this.radioConfiguration.currentTrack);
        }
    }

    resume() {
        if (!this.radioConfiguration) {
            return;
        }
        if (!this.isLive) {
            this.isLive = true;
            Logger.d(Radio.name, 'Starting queued radio');
        }
        while (
            this.radioConfiguration.playedTracks.length > 0 &&
            this.radioConfiguration.playedTracks.indexOf(this.radioConfiguration.recommendedTracks[0]) !== -1
        ) {
            this.radioConfiguration.recommendedTracks.shift();
        }
        const nextSongToPlay = this.radioConfiguration.recommendedTracks.shift();
        if (!nextSongToPlay) {
            // TODO retrieve more songs?
            Logger.d(Radio.name, 'No more songs found');
            this.stop();
            return;
        }
        this.radioConfiguration.recommendedTracks.push();
        this.radioConfiguration.currentTrack = nextSongToPlay;
        this.play(this.radioConfiguration.currentTrack, GlobalContext.getBotID(), this.radioConfiguration.message);
    }

    stop() {
        if (this.radioConfiguration && this.isLive) {
            Logger.d(Radio.name, 'Stopping radio');
            this.radioConfiguration = undefined;
            this.isLive = false;
        } else if (this.radioConfiguration) {
            Logger.d(Radio.name, 'Clearing queued radio');
            this.radioConfiguration = undefined;
        }
    }
}

export type RadioPlay = (info: TrackInfo, requesterId: string, message?: Message) => void;

export enum RadioMode {
    TOP_10,
    ARTIST_ONLY,
    RELATED,
}

export interface RadioContext {
    artists: string[];
    tracks: string[];
    genres: string[];
    length: number;
    mode: RadioMode;
}

export interface RadioConfiguration {
    context: RadioContext;
    currentTrack: TrackInfo | undefined;
    playedTracks: TrackInfo[];
    recommendedTracks: TrackInfo[];
    message?: Message;
}
