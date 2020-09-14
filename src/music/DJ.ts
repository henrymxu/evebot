import {Search} from "./Search"
import {GuildContext} from "../guild/Context"
import {Message, MessageEmbed} from "discord.js"
import {MessageGenerator} from "../communication/MessageGenerator"
import {Track} from "./tracks/Track"
import {TrackMessageFactory} from "../communication/TrackMessageGenerator"

export default class DJ {
    private context: GuildContext

    constructor(guildContext: GuildContext) {
        this.context = guildContext
    }

    volume(volume: number, relative: boolean = false) {
        this.context.getProvider().getAudioPlayer().setVolume(volume, relative)
    }

    play(query: string, requesterId: string, message?: Message) {
        this.context.getProvider().getResponder().startTyping(message)
        Search.search(query).then((tracks) => {
            tracks.forEach((track) => {
                track.metaData = {requesterId: requesterId, source: message}
                const isPlaying = this.context.getProvider().getAudioPlayer().queueTrack(track)
                if (!isPlaying) { this.onTrackQueued(track) }
                this.context.getProvider().getResponder().stopTyping(message)
            })
        }).catch(err => {
            console.log(`Error queuing ${query}: ${err}`)
            this.context.getProvider().getResponder().stopTyping(message)
        })
    }

    getQueueMessage(): Track[]  {
        return this.context.getProvider().getAudioPlayer().getQueue()
    }

    getCurrentSong(): Track {
        const trackInfos = this.context.getProvider().getAudioPlayer().getQueue()
        return trackInfos[0]
    }

    skip(): boolean {
        return this.context.getProvider().getAudioPlayer().skip()
    }

    pause(): boolean {
        return this.context.getProvider().getAudioPlayer().pause()
    }

    resume() {
        return this.context.getProvider().getAudioPlayer().resume()
    }

    stop() {
        return this.context.getProvider().getAudioPlayer().stop()
    }

    private onTrackQueued(track: Track) {
        const embed = TrackMessageFactory.createTrackNewlyQueuedEmbed(track)
        this.context.getProvider().getResponder().send({content: embed, id: track.id, message: track.metaData.source})
    }

    onTrackStarted(track: Track) {
        console.log(`Started playing: ${track.getTitle()} [${track.metaData.requesterId}]`)
        const embed = TrackMessageFactory.createNowPlayingEmbed(track)
        this.context.getProvider().getResponder().send({content: embed, id: track.id, message: track.metaData.source})
    }

    onTrackCompleted(track: Track) {
        console.log(`Finished playing: ${track.getTitle()}`)
        this.context.getProvider().getResponder().delete(track.id)
        this.context.getProvider().getResponder().delete('queue')
        this.context.getProvider().getResponder().delete('song')
    }
}
