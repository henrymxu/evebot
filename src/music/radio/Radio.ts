import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {GlobalContext} from '../../GlobalContext'
import {ExternalTrackInfo} from '../tracks/ExternalTrack'

export abstract class Radio {
    protected readonly play: RadioPlay
    protected context: GuildContext
    protected radioConfiguration: RadioConfiguration | undefined

    protected constructor(context: GuildContext, play: RadioPlay) {
        this.context = context
        this.play = play
    }

    start(context: RadioContext, message?: Message): Promise<void> {
        this.stop()
        switch(context.mode) {
            case RadioMode.ARTIST_ONLY:
                return this.startArtistRadio(context, message)
            case RadioMode.TOP_10:
                return this.startTop10Radio(context, message)
            case RadioMode.RELATED:
                return this.startRelatedRadio(context, message)
        }
    }

    protected abstract startTop10Radio(context: RadioContext, message?: Message): Promise<void>
    protected abstract startArtistRadio(context: RadioContext, message?: Message): Promise<void>
    protected abstract startRelatedRadio(context: RadioContext, message?: Message): Promise<void>

    isPlaying(): boolean {
        return this.radioConfiguration !== undefined
    }

    getRadioConfiguration(): RadioConfiguration | undefined {
        return this.radioConfiguration
    }

    next() {
        if (this.radioConfiguration?.currentTrack) {
            this.radioConfiguration?.playedTracks.unshift(this.radioConfiguration.currentTrack)
        }
    }

    resume() {
        if (!this.radioConfiguration) {
            return
        }
        while(this.radioConfiguration.playedTracks.length > 0 &&
        this.radioConfiguration.playedTracks.indexOf(this.radioConfiguration.recommendedTracks[0]) !== -1) {
            this.radioConfiguration.recommendedTracks.shift()
        }
        const nextSongToPlay = this.radioConfiguration.recommendedTracks.shift()
        if (!nextSongToPlay) {
            // TODO retrieve more songs?
            return
        }
        this.radioConfiguration.recommendedTracks.push()
        this.radioConfiguration.currentTrack = nextSongToPlay
        this.play(this.radioConfiguration.currentTrack, GlobalContext.getBotID(), this.radioConfiguration.message)
    }

    stop(): boolean {
        if (this.radioConfiguration) {
            this.context.getProvider().getAudioPlayer().stop()
            this.radioConfiguration = undefined
        }
        return this.radioConfiguration !== undefined
    }
}

export type RadioPlay = (info: ExternalTrackInfo, requesterId: string, message?: Message) => void

export enum RadioMode {
    TOP_10,
    ARTIST_ONLY,
    RELATED
}

export interface RadioContext {
    artists: string[],
    tracks: string[],
    genres: string[],
    length: number
    mode: RadioMode
}

export interface RadioConfiguration {
    context: RadioContext
    currentTrack: ExternalTrackInfo | undefined,
    playedTracks: ExternalTrackInfo[]
    recommendedTracks: ExternalTrackInfo[]
    message?: Message
}
