import {Message} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {Spotify} from '../sources/Spotify/Spotify'
import {Radio, RadioContext} from './Radio'
import {Logger} from '../../Logger'
import {ExternalTrackInfo} from '../tracks/ExternalTrack'

const TAG = 'SpotifyRadio'

export default class SpotifyRadio extends Radio {
    constructor(context: GuildContext, play: (query: string, requesterId: string, message?: Message) => void) {
        super(context, play)
    }

    protected startTop10Radio(context: RadioContext, message?: Message): void {
        Spotify.getTop10TracksNamesFromArtistName(context.artists[0]).then((tracks) => {
            this.radioConfiguration = {
                context: context,
                currentTrack: '',
                playedTracks: [],
                recommendedTracks: convertTracksToSearchableTrackNames(tracks),
                message: message
            }
            this.resume()
        }).catch(err => {
            Logger.e(TAG, err)
        })
    }

    protected startArtistRadio(context: RadioContext, message?: Message): void {
        Spotify.getRandomizedTrackNamesFromArtistName(context.artists[0]).then((tracks) => {
            this.radioConfiguration = {
                context: context,
                currentTrack: '',
                playedTracks: [],
                recommendedTracks: convertTracksToSearchableTrackNames(tracks),
                message: message
            }
            this.resume()
        }).catch(err => {
            Logger.e(TAG, err)
        })
    }

    protected startRelatedRadio(context: RadioContext, message?: Message) {
        const promises = []
        promises.push(context.artists ? Spotify.getArtistIDFromArtistName(context.artists[0]) : Promise.resolve(''))
        promises.push(context.genres.length !== 0 ? Spotify.verifyGenreExists(context.genres[0]) : Promise.resolve(''))
        promises.push(context.tracks.length !== 0 ? Spotify.getTrackIDFromTrackName(context.tracks[0]) : Promise.resolve(''))
        Promise.all(promises).then(results => {
            this.radioConfiguration = {
                context: context,
                currentTrack: '',
                playedTracks: [],
                recommendedTracks: [],
                message: message
            }
            const seeds: SpotifySeeds = {
                artists: [results[0]], genres: [results[1]], tracks: [results[2]]
            }
            Spotify.getTrackNamesFromSeeds(seeds.artists, seeds.genres, seeds.tracks, context.length)
                .then((tracks) => {
                    this.radioConfiguration?.recommendedTracks
                        .push(...convertTracksToSearchableTrackNames(tracks))
                    this.resume()
                })
        }).catch(err => {
            Logger.e(TAG, err)
        })
    }
}

function convertTracksToSearchableTrackNames(tracks: ExternalTrackInfo[]): string[] {
    return tracks.map(track => {
        const filteredName = track.name
        return `${track.artist} - ${filteredName} - (Official Audio)`
    })
}

interface SpotifySeeds {
    artists: string[],
    genres: string[],
    tracks: string[]
}
