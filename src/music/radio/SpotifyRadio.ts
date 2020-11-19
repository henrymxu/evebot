import {Message} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {Spotify} from "../sources/Spotify/Spotify"
import {Radio, RadioContext} from "./Radio"
import {Logger} from "../../Logger"

const TAG = 'SpotifyRadio'

export default class SpotifyRadio extends Radio {
    constructor(context: GuildContext, play: (query: string, requesterId: string, message?: Message) => void) {
        super(context, play)
    }

    start(context: RadioContext, message?: Message) {
        this.stop()
        const promises = []
        promises.push(context.artists ? Spotify.searchArtist(context.artists[0]) : Promise.resolve())
        promises.push(context.genres.length !== 0 ? Spotify.searchGenre(context.genres[0]) : Promise.resolve())
        promises.push(context.tracks.length !== 0 ? Spotify.searchTrack(context.tracks[0]) : Promise.resolve())
        Promise.all(promises).then(results => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: [],
                message: message
            }
            const seeds: SpotifySeeds = {
                artists: [results[0]], genres: [results[1]], tracks: [results[2]]
            }
            Spotify.getTrackNamesFromSeeds(seeds.artists, seeds.genres, seeds.tracks, context.length)
                .then((trackNames) => {
                    this.radioConfiguration.recommendedTracks
                        .push(...trackNames.map(track => `${track.artist} - ${track.name}`))
                    this.resume()
                })
        }).catch(err => {
            Logger.e(null, TAG, err)
        })
    }
}

interface SpotifySeeds {
    artists: string[],
    genres: string[],
    tracks: string[]
}
