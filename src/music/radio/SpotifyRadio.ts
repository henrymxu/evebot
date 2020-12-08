import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {Spotify} from '../sources/Spotify/Spotify'
import {Radio, RadioContext, RadioPlay} from './Radio'
import {Logger} from '../../Logger'
import {ExternalTrackInfo} from '../tracks/ExternalTrack'

const TAG = 'SpotifyRadio'

export default class SpotifyRadio extends Radio {
    constructor(context: GuildContext, play: RadioPlay) {
        super(context, play)
    }

    protected startTop10Radio(context: RadioContext, message?: Message): Promise<void> {
        return Spotify.getTop10TracksNamesFromArtistName(context.artists[0]).then((tracks) => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: tracks,
                message: message
            }
            this.resume()
        })
    }

    protected startArtistRadio(context: RadioContext, message?: Message): Promise<void> {
        return Spotify.getRandomizedTrackNamesFromArtistName(context.artists[0]).then((tracks) => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: tracks,
                message: message
            }
            this.resume()
        })
    }

    protected startRelatedRadio(context: RadioContext, message?: Message): Promise<void> {
        const promises = []
        promises.push(context.artists ? Spotify.getArtistIDFromArtistName(context.artists[0]) : Promise.resolve(''))
        promises.push(context.genres.length !== 0 ? Spotify.verifyGenreExists(context.genres[0]) : Promise.resolve(''))
        promises.push(context.tracks.length !== 0 ? Spotify.getTrackIDFromTrackName(context.tracks[0]) : Promise.resolve(''))
        return Promise.all(promises).then(results => {
            const seeds: SpotifySeeds = { artists: [results[0]], genres: [results[1]], tracks: [results[2]] }
            return Spotify.getTrackNamesFromSeeds(seeds.artists, seeds.genres, seeds.tracks, context.length)
        }).then((tracks) => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: tracks,
                message: message
            }
            this.resume()
        })
    }
}

interface SpotifySeeds {
    artists: string[],
    genres: string[],
    tracks: string[]
}
