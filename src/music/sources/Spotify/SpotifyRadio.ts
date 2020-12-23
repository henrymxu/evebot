import {Message} from 'discord.js';
import {Spotify} from './Spotify';
import {GuildContext} from '../../../guild/Context';
import {Radio, RadioContext, RadioPlay} from '../../radio/Radio';

export default class SpotifyRadio extends Radio {
    constructor(context: GuildContext, play: RadioPlay) {
        super(context, play);
    }

    protected startTop10Radio(context: RadioContext, message?: Message): Promise<void> {
        return Spotify.getTop10TracksInfosFromArtistName(context.artists[0]).then(tracks => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: tracks,
                message: message,
            };
        });
    }

    protected startArtistRadio(context: RadioContext, message?: Message): Promise<void> {
        return Spotify.getRandomizedTrackInfosFromArtistName(context.artists[0]).then(tracks => {
            this.radioConfiguration = {
                context: context,
                currentTrack: undefined,
                playedTracks: [],
                recommendedTracks: tracks,
                message: message,
            };
        });
    }

    protected startRelatedRadio(context: RadioContext, message?: Message): Promise<void> {
        const promises = [];
        promises.push(context.artists ? Spotify.getArtistIDFromArtistName(context.artists[0]) : Promise.resolve(''));
        promises.push(context.genres.length !== 0 ? Spotify.verifyGenreExists(context.genres[0]) : Promise.resolve(''));
        promises.push(
            context.tracks.length !== 0 ? Spotify.getTrackIDFromTrackName(context.tracks[0]) : Promise.resolve('')
        );
        return Promise.all(promises)
            .then(results => {
                const seeds: SpotifySeeds = {
                    artists: [results[0]],
                    genres: [results[1]],
                    tracks: [results[2]],
                };
                return Spotify.getTrackInfosFromSeeds(seeds.artists, seeds.genres, seeds.tracks, context.length);
            })
            .then(tracks => {
                this.radioConfiguration = {
                    context: context,
                    currentTrack: undefined,
                    playedTracks: [],
                    recommendedTracks: tracks,
                    message: message,
                };
                return;
            });
    }
}

interface SpotifySeeds {
    artists: string[];
    genres: string[];
    tracks: string[];
}
