import {Message, MessageEmbed} from 'discord.js';
import {Track} from '../music/tracks/Track';
import {MessageGenerator} from './MessageGenerator';
import {DynamicTableGenerator, TableGenerator} from './TableGenerator';
import {GuildContext} from '../guild/Context';
import {Album} from '../music/tracks/Album';
import {Utils} from '../utils/Utils';
import {GuildUtils} from '../utils/GuildUtils';
import {RadioConfiguration} from '../music/radio/Radio';
import {BotMessage} from './Responder';

export namespace TrackMessageGenerator {
    export function createNowPlayingEmbed(track: Track): MessageEmbed {
        const userMentionString = GuildUtils.createUserMentionString(track.metaData.requesterId);
        const message = `[${track.getTitle()}](${track.getURL()}) [${userMentionString}]`;
        return MessageGenerator.getBaseEmbed()
            .setTitle('Now Playing')
            .setDescription(message)
            .setThumbnail(track.getThumbnailURL() || '');
    }

    export function createCurrentlyPlayingEmbed(track: Track): MessageEmbed {
        const message = `[${track.getTitle()}](${track.getURL()}) [${GuildUtils.createUserMentionString(
            track.metaData.requesterId
        )}]`;
        return MessageGenerator.getBaseEmbed().setDescription(message);
    }

    export function createTrackNewlyQueuedEmbed(track: Track): MessageEmbed {
        const message = `${GuildUtils.createUserMentionString(
            track.metaData.requesterId
        )} queued: [${track.getTitle()}](${track.getURL()})`;
        return MessageGenerator.getBaseEmbed().setDescription(message);
    }

    export function createDynamicQueuedTracksMessage(
        context: GuildContext,
        tracks: Track[],
        message?: Message
    ): BotMessage {
        const actionHandler = new DynamicTableGenerator(
            context,
            context.getProvider().getDJ().getQueue(),
            createQueuedTracksTable,
            10,
            createQueuedTracksAdditionalMessage
        );
        return {
            content: actionHandler.initialize(),
            id: 'queue',
            message: message,
            options: {code: 'Markdown'},
            removeAfter: 30,
            action: {
                handler: DynamicTableGenerator.getHandler(actionHandler),
                options: actionHandler.emojiOptions(),
            },
        };
    }

    export function createAlbumQueuedEmbed(album: Album): MessageEmbed {
        const embed = MessageGenerator.getBaseEmbed();
        embed.setTitle(album.name);
        embed.setDescription(album.artist);
        embed.setURL(album.metadata.externalURL);
        embed.setImage(album.metadata.imageURL);
        return embed;
    }

    export function createRadioMessage(context: GuildContext, radioConfiguration: RadioConfiguration): string {
        let response = '';
        const tableHeaders = ['Artist', 'Genre', 'Track', 'Tracks Remaining', 'Tracks Played'];
        const source = radioConfiguration.context;
        const artists = source.artists ? source.artists.toString() : ' - ';
        const genres = source.genres ? source.genres.toString() : ' - ';
        const tracks = source.tracks ? source.tracks.toString() : ' - ';
        const tracksRemaining = radioConfiguration.recommendedTracks.length.toString();
        const tracksPlayed = radioConfiguration.playedTracks.length.toString();
        const tableData = [[artists, genres, tracks, tracksRemaining, tracksPlayed]];
        response += TableGenerator.createTable(tableHeaders, tableData);
        const tableHeaders2 = ['Previous Track', 'Current Track', 'Next Track'];

        const previousTrackName = radioConfiguration.playedTracks[0]?.title || '';
        const nextTrackName = radioConfiguration.recommendedTracks[0]?.title || '';
        const trackNames = [previousTrackName, radioConfiguration.currentTrack?.title || '', nextTrackName];
        const previousTrackArtist = radioConfiguration.playedTracks[0]?.artist || '';
        const nextTrackArtist = radioConfiguration.recommendedTracks[0]?.artist || '';
        const trackArtists = [previousTrackArtist, radioConfiguration.currentTrack?.artist || '', nextTrackArtist];
        const tableData2 = [trackNames, trackArtists];
        response += TableGenerator.createTable(tableHeaders2, tableData2);
        if (context.getProvider().getDJ().getRadio().isPlaying()) {
            const currentTrack = context.getProvider().getDJ().getCurrentTrack();
            if (currentTrack) {
                response += `${createTrackProgressBar(currentTrack)}`;
            }
        }
        return response;
    }
}

function createQueuedTracksTable(context: GuildContext, tracks: Track[]): string {
    const tableHeaders = ['Track Name', 'Artist', 'Requester', 'Length'];
    const tableData: string[][] = [];
    let totalLength = 0;
    let currentTrackProgress = '';
    tracks.forEach(track => {
        let title = Utils.truncate(track.getTitle(), 25);
        title = track.isPlaying() || track.isPaused() ? `< ${title} > ` : title;
        const length = Utils.convertSecondsToTimeString(track.getLength());
        tableData.push([title, track.getArtist(), track.getRequester(context) || '', length]);
        totalLength += track.getLength();
        if (track.isPlaying() || track.isPaused()) {
            currentTrackProgress = createTrackProgressBar(track);
        }
    });
    return `${TableGenerator.createTable(tableHeaders, tableData)}`;
}

function createQueuedTracksAdditionalMessage(context: GuildContext, tracks: Track[]): string {
    let response = '';
    const currentTrack = context.getProvider().getDJ().getCurrentTrack();
    if (currentTrack) {
        response += `${createTrackProgressBar(currentTrack)}\n`;
    }
    const totalLength = tracks.map(track => track.getLength()).reduce((totalLength, track) => totalLength + track);
    response += `# Total Queue Time: ${Utils.convertSecondsToTimeString(totalLength)}\n`;
    if (context.getProvider().getDJ().getRadio().isQueued()) {
        const msg = `A radio has been queued to start after all songs have finished\nUse ${context.getPrefix()}radio for details`;
        response += msg;
    }
    return response;
}

function createTrackProgressBar(track: Track): string {
    const barLength = 25;
    const filledLength = Math.floor(barLength * (track.getElapsedTimeInSeconds() / track.getLength()));
    const numberOfBrackets = filledLength > 2 ? 1 : 0; // Open and close brackets
    const numberOfFilled = filledLength > 2 ? filledLength - 2 : filledLength;
    const bar =
        '<'.repeat(numberOfBrackets) +
        '='.repeat(numberOfFilled) +
        '>'.repeat(numberOfBrackets) +
        '-'.repeat(barLength - (numberOfFilled + 2 * numberOfBrackets));
    const elapsedTimeString = Utils.convertSecondsToTimeString(track.getElapsedTimeInSeconds());
    const totalTimeString = Utils.convertSecondsToTimeString(track.getLength());
    return `[${bar}] < ${elapsedTimeString} > / ${totalTimeString}`;
}
