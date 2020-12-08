import {MessageEmbed} from 'discord.js'
import YoutubeTrack from '../music/tracks/YoutubeTrack'
import {Track} from '../music/tracks/Track'
import {MessageGenerator} from './MessageGenerator'
import {TableGenerator} from './TableGenerator'
import {GuildContext} from '../guild/Context'
import {Album} from '../music/tracks/Album'
import {Utils} from '../utils/Utils'
import {GuildUtils} from '../utils/GuildUtils'
import {RadioConfiguration} from '../music/radio/Radio'

namespace TrackMessageGenerator {
    export function createSongTrackNowPlayingEmbed(track: YoutubeTrack): MessageEmbed {
        const userMentionString = GuildUtils.createUserMentionString(track.metaData.requesterId)
        const message = `[${track.getYoutubeTrackInfo().title}](${track.getYoutubeTrackInfo().url}) [${userMentionString}]`
        return MessageGenerator.getBaseEmbed().setTitle('Now Playing').setDescription(message)
            .setThumbnail(track.getYoutubeTrackInfo().thumbnailURL)
    }

    export function createLinkTrackCurrentlyPlayingEmbed(track: Track, url: string): MessageEmbed {
        const message = `[${track.getTitle()}](${url}) [${GuildUtils.createUserMentionString(track.metaData.requesterId)}]`
        return MessageGenerator.getBaseEmbed().setDescription(message)
    }

    export function createLinkTrackNewlyQueuedEmbed(track: Track, url: string): MessageEmbed {
        const message = `${GuildUtils.createUserMentionString(track.metaData.requesterId)} queued: [${track.getTitle()}](${url})`
        return MessageGenerator.getBaseEmbed().setDescription(message)
    }
}

export namespace TrackMessageFactory {
    export function createNowPlayingEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createSongTrackNowPlayingEmbed(track)
        }
        throw new Error('Missing implementation for Track Embed')
    }

    export function createCurrentlyPlayingEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createLinkTrackCurrentlyPlayingEmbed(track, track.getYoutubeTrackInfo().url)
        }
        throw new Error('Missing implementation for Track Embed')
    }

    export function createTrackNewlyQueuedEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createLinkTrackNewlyQueuedEmbed(track, track.getYoutubeTrackInfo().url)
        }
        throw new Error('Missing implementation for Track Embed')
    }

    export function createQueuedTracksMessage(context: GuildContext, tracks: Track[]): string {
        const tableHeaders = ['Track Name', 'Artist', 'Requester', 'Length']
        const tableData: string[][] = []
        let totalLength = 0
        let currentTrackProgress: string = ''
        tracks.forEach((track) => {
            let title = Utils.truncate(track.getTitle(), 25)
            title = track.isPlaying() || track.isPaused() ? `< ${title} > `: title
            let length = Utils.convertSecondsToTimeString(track.getLength())
            tableData.push([title, track.getArtist(), track.getRequester(context) || '', length])
            totalLength += track.getLength()
            if (track.isPlaying() || track.isPaused()) {
                currentTrackProgress = createTrackProgressBar(track)
            }
        })
        let response = `${TableGenerator.createTable(tableHeaders, tableData)}\n`
        if (currentTrackProgress) {
            response += `${currentTrackProgress}\n`
        }
        response += `# Total Queue Time: ${Utils.convertSecondsToTimeString(totalLength)}`
        return response
    }

    export function createAlbumQueuedEmbed(album: Album): MessageEmbed {
        const embed = MessageGenerator.getBaseEmbed()
        embed.setTitle(album.name)
        embed.setDescription(album.artist)
        embed.setURL(album.metadata.externalURL)
        embed.setImage(album.metadata.imageURL)
        return embed
    }

    export function createRadioMessage(context: GuildContext, radioConfiguration: RadioConfiguration): string {
        let response = ''
        const tableHeaders = ['Artist', 'Genre', 'Track', 'Tracks Remaining']
        const source = radioConfiguration.context
        const artists = source.artists ? source.artists.toString() : ' - '
        const genres = source.genres ? source.genres.toString() : ' - '
        const tracks = source.tracks ? source.tracks.toString() : ' - '
        const tableData = [[artists, genres, tracks, radioConfiguration.recommendedTracks.length.toString()]]
        response += TableGenerator.createTable(tableHeaders, tableData)
        const tableHeaders2 = ['Previous Track', 'Current Track', 'Next Track']

        const previousTrackName = radioConfiguration.playedTracks[0]?.name || ''
        const nextTrackName = radioConfiguration.recommendedTracks[0]?.name || ''
        const trackNames = [previousTrackName, radioConfiguration.currentTrack!.name, nextTrackName]
        const previousTrackArtist = radioConfiguration.playedTracks[0]?.artist || ''
        const nextTrackArtist = radioConfiguration.recommendedTracks[0]?.artist || ''
        const trackArtists = [previousTrackArtist, radioConfiguration.currentTrack!.artist, nextTrackArtist]
        const tableData2 = [trackNames, trackArtists]
        response += TableGenerator.createTable(tableHeaders2, tableData2)
        const currentSong = context.getProvider().getDJ().getCurrentSong()
        if (currentSong) {
            response += `${createTrackProgressBar(currentSong)}`
        }
        return response
    }
}

function createTrackProgressBar(track: Track): string {
    const barLength = 25
    const filledLength = Math.floor(barLength * (track.getElapsedTimeInSeconds() / track.getLength()))
    const numberOfBrackets = filledLength > 2 ? 1 : 0 // Open and close brackets
    const numberOfFilled = filledLength > 2 ? filledLength - 2 : filledLength
    const bar = '<'.repeat(numberOfBrackets) + '='.repeat(numberOfFilled) +
        '>'.repeat(numberOfBrackets) + '-'.repeat(barLength - (numberOfFilled + 2 * numberOfBrackets))
    const elapsedTimeString = Utils.convertSecondsToTimeString(track.getElapsedTimeInSeconds())
    const totalTimeString = Utils.convertSecondsToTimeString(track.getLength())
    return `[${bar}] < ${elapsedTimeString} > / ${totalTimeString}`
}
