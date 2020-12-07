import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {GlobalContext} from '../../GlobalContext'

export abstract class Radio {
    protected readonly play: (query: string, requesterId: string, message?: Message) => void
    protected context: GuildContext
    protected radioConfiguration: RadioConfiguration | undefined

    protected constructor(context: GuildContext, play: (query: string, requesterId: string, message?: Message) => void) {
        this.context = context
        this.play = play
    }

    start(context: RadioContext, message?: Message) {
        this.stop()
        switch(context.mode) {
            case RadioMode.ARTIST_ONLY:
                this.startArtistRadio(context, message)
                break
            case RadioMode.TOP_10:
                this.startTop10Radio(context, message)
                break
            case RadioMode.RELATED:
                this.startRelatedRadio(context, message)
                break
        }
    }

    protected abstract startTop10Radio(context: RadioContext, message?: Message): void
    protected abstract startArtistRadio(context: RadioContext, message?: Message): void
    protected abstract startRelatedRadio(context: RadioContext, message?: Message): void

    isPlaying(): boolean {
        return this.radioConfiguration !== undefined
    }

    getRadioConfiguration(): RadioConfiguration | undefined {
        return this.radioConfiguration
    }

    next() {
        this.radioConfiguration?.playedTracks.unshift(this.radioConfiguration.currentTrack)
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

    stop() {
        if (this.radioConfiguration) {
            this.context.getProvider().getAudioPlayer().stop()
            this.radioConfiguration = undefined
        }
    }

    static ConvertStringToRadioMode(modeString: string): RadioMode {
        let mode: RadioMode
        switch(modeString) {
            case 'top10':
                mode = RadioMode.TOP_10
                break
            case 'artist':
                mode = RadioMode.ARTIST_ONLY
                break
            default:
                mode = RadioMode.RELATED
        }
        return mode
    }
}

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
    currentTrack: string,
    playedTracks: string[]
    recommendedTracks: string[]
    message?: Message
}
