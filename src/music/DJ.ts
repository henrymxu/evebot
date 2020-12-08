import {Search} from './Search'
import {GuildContext} from '../guild/Context'
import {Message} from 'discord.js'
import {Track} from './tracks/Track'
import {TrackMessageFactory} from '../communication/TrackMessageGenerator'
import SpotifyRadio from './radio/SpotifyRadio'
import {Radio} from './radio/Radio'
import {Spotify} from './sources/Spotify/Spotify'
import {Album} from './tracks/Album'
import {Logger} from '../Logger'
import {ExternalTrackInfo} from './tracks/ExternalTrack'

export default class DJ {
    private readonly context: GuildContext
    private readonly radio: Radio

    constructor(context: GuildContext) {
        this.context = context
        this.radio = new SpotifyRadio(context, (info: ExternalTrackInfo, requesterId: string, message?: Message) => {
            this.playWithExternalTrackInfo(info, requesterId, message)
        })
    }

    volume(volume: number, relative: boolean = false) {
        this.context.getProvider().getAudioPlayer().setVolume(volume, relative)
    }

    request(mode: QueryMode, query: string, requesterId: string, message?: Message): Promise<void> {
        if (this.radio.isPlaying()) {
            this.radio.stop()
        }
        let playFunc: () => Promise<void>
        switch(mode) {
            case QueryMode.Album: {
                playFunc = () => { return this.playAlbum(query, requesterId, message) }
                break
            }
            default: {
                playFunc = () => { return this.play(query, requesterId, message) }
                break
            }
        }
        return this.executePlay(playFunc, query, message)
    }

    private executePlay(playFunc: () => Promise<void>, query: string, message?: Message): Promise<void> {
        return playFunc().catch((err: Error) => {
            Logger.e(DJ.name, `Error queuing ${query}, reason: ${err}`, this.context)
        })
    }

    private play(query: string, requesterId: string, message?: Message): Promise<void> {
        return Search.search(query).then((tracks) => {
            this.playTracks(tracks, requesterId, message)
        })
    }

    private playWithExternalTrackInfo(info: ExternalTrackInfo, requesterId: string, message?: Message): Promise<void> {
        const query = DJ.convertTrackToSearchableTrack(info)
        return Search.search(query, info).then((tracks) => {
            this.playTracks(tracks, requesterId, message)
        })
    }

    private playAlbum(query: string, requesterId: string, message?: Message): Promise<void> {
        return Spotify.getTrackNamesFromAlbumSearch(query).then((album) => {
            this.onAlbumQueued(album, message)
            Search.searchAlbum(album).then((tracks) => {
                this.playTracks(tracks, requesterId, message)
                this.onTracksQueued(tracks)
            })
        })
    }

    getRadio(): Radio {
        return this.radio
    }

    getQueue(): Track[]  {
        return this.context.getProvider().getAudioPlayer().getQueue()
    }

    getCurrentSong(): Track | undefined {
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
        this.radio.stop()
        return this.context.getProvider().getAudioPlayer().stop()
    }

    private playTracks(tracks: Track[], requesterId: string, message?: Message) {
        if (tracks.length === 1) {
            const track = tracks[0]
            track.metaData = {requesterId: requesterId, source: message}
            const isPlaying = this.context.getProvider().getAudioPlayer().queueTrack(track)
            if (!isPlaying) { this.onTrackQueued(track) }
        } else {
            tracks.forEach((track) => {
                track.metaData = {requesterId: requesterId, source: message}
                this.context.getProvider().getAudioPlayer().queueTrack(track)
            })
        }
    }

    private onAlbumQueued(album: Album, message?: Message) {
        const embed = TrackMessageFactory.createAlbumQueuedEmbed(album)
        this.context.getProvider().getResponder().send({content: embed, message: message})
    }

    private onTracksQueued(tracks: Track[]) {
        const message = TrackMessageFactory.createQueuedTracksMessage(this.context, tracks)
        this.context.getProvider().getResponder()
            .send({content: message, id: 'queue', message: tracks[0].metaData.source, options: {code: 'Markdown'}})
    }

    private onTrackQueued(track: Track) {
        const embed = TrackMessageFactory.createTrackNewlyQueuedEmbed(track)
        this.context.getProvider().getResponder().send({content: embed, id: track.id, message: track.metaData.source})
    }

    onTrackStarted(track: Track) {
        Logger.i(DJ.name, `Started playing: ${track.getTitle()}`, this.context)
        const embed = TrackMessageFactory.createNowPlayingEmbed(track)
        this.context.getProvider().getResponder().send({content: embed, id: track.id, message: track.metaData.source})
    }

    onTrackCompleted(track: Track, forceStop: boolean = false) {
        Logger.i(DJ.name, `Finished playing: ${track.getTitle()}`, this.context)
        this.context.getProvider().getResponder().delete(track.id)
        this.context.getProvider().getResponder().delete('queue')
        this.context.getProvider().getResponder().delete('song')

        if (!forceStop && this.radio.isPlaying()) {
            this.radio.next()
            this.radio.resume()
        }
    }

    private static convertTrackToSearchableTrack(info: ExternalTrackInfo): string {
        const filteredName = info.name
        return `${info.artist} - ${filteredName} - (Official Audio)`
    }
}

export enum QueryMode {
    Play,
    Album,
}
