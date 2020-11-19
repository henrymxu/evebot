import { Message } from 'discord.js'
import { GuildContext } from '../../guild/Context'
import { GlobalContext } from '../../GlobalContext'

export abstract class Radio {
    protected readonly play: (
        query: string,
        requesterId: string,
        message?: Message
    ) => void
    protected context: GuildContext
    protected radioConfiguration: RadioConfiguration = null

    protected constructor(
        context: GuildContext,
        play: (query: string, requesterId: string, message?: Message) => void
    ) {
        this.context = context
        this.play = play
    }

    abstract start(context: RadioContext, message?: Message)

    isPlaying(): boolean {
        return this.radioConfiguration !== null
    }

    getRadioConfiguration(): RadioConfiguration {
        return this.radioConfiguration
    }

    next() {
        this.radioConfiguration.playedTracks.unshift(
            this.radioConfiguration.currentTrack
        )
    }

    resume() {
        while (
            this.radioConfiguration.playedTracks.length > 0 &&
            this.radioConfiguration.playedTracks.indexOf(
                this.radioConfiguration.recommendedTracks[0]
            ) !== -1
        ) {
            this.radioConfiguration.recommendedTracks.shift()
        }
        if (this.radioConfiguration.recommendedTracks.length == 0) {
            // TODO retrieve more songs?
            return
        }
        let songToPlay = this.radioConfiguration.recommendedTracks.shift()
        this.radioConfiguration.recommendedTracks.push()
        this.radioConfiguration.currentTrack = songToPlay
        this.play(
            this.radioConfiguration.currentTrack,
            GlobalContext.getClient().user.id,
            this.radioConfiguration.message
        )
    }

    stop() {
        if (this.radioConfiguration) {
            this.context.getProvider().getAudioPlayer().stop()
            this.radioConfiguration = null
        }
    }
}

export interface RadioContext {
    artists: string[]
    tracks: string[]
    genres: string[]
    length: number
}

export interface RadioConfiguration {
    context: RadioContext
    currentTrack: string
    playedTracks: string[]
    recommendedTracks: string[]
    message?: Message
}
