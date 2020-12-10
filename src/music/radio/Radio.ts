import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {GlobalContext} from '../../GlobalContext'
import {ExternalTrackInfo} from '../tracks/ExternalTrack'
import {Logger} from '../../Logger'

export abstract class Radio {
    protected readonly play: RadioPlay
    protected context: GuildContext
    protected radioConfiguration: RadioConfiguration | undefined
    protected isLive: boolean = false

    protected constructor(context: GuildContext, play: RadioPlay) {
        this.context = context
        this.play = play
    }

    protected abstract startTop10Radio(context: RadioContext, message?: Message): Promise<void>
    protected abstract startArtistRadio(context: RadioContext, message?: Message): Promise<void>
    protected abstract startRelatedRadio(context: RadioContext, message?: Message): Promise<void>

    request(context: RadioContext, message?: Message): Promise<void> {
        this.radioConfiguration = undefined
        let setupPromise: Promise<void>
        switch(context.mode) {
            case RadioMode.ARTIST_ONLY:
                setupPromise = this.startArtistRadio(context, message)
                break
            case RadioMode.TOP_10:
                setupPromise = this.startTop10Radio(context, message)
                break
            case RadioMode.RELATED:
                setupPromise = this.startRelatedRadio(context, message)
                break
        }
        return setupPromise
    }

    isPlaying(): boolean {
        return this.isLive
    }

    isQueued(): boolean {
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
        if (!this.isLive) {
            this.isLive = true
            Logger.d(Radio.name, `Starting queued radio`)
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
            Logger.d(Radio.name, `Stopping radio`)
            this.context.getProvider().getAudioPlayer().stop()
            this.radioConfiguration = undefined
        }
        this.isLive = false
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
