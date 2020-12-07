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

    abstract start(context: RadioContext, message?: Message): void

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
}

export interface RadioContext {
    artists: string[],
    tracks: string[],
    genres: string[],
    length: number
}

export interface RadioConfiguration {
    context: RadioContext
    currentTrack: string,
    playedTracks: string[]
    recommendedTracks: string[]
    message?: Message
}
