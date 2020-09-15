import {MessageEmbed} from "discord.js"
import YoutubeTrack from "../music/tracks/YoutubeTrack"
import {Track} from "../music/tracks/Track"
import {MessageGenerator} from "./MessageGenerator"
import {TableGenerator} from "./TableGenerator"
import {GuildContext} from "../guild/Context"
import {Album} from "../music/tracks/Album"
import {Utils} from "../utils/Utils"

namespace TrackMessageGenerator {
    export function createSongTrackNowPlayingEmbed(track: YoutubeTrack): MessageEmbed {
        return MessageGenerator.getBaseEmbed()
            .setTitle('Now Playing')
            .setDescription(`[${track.getYoutubeTrackInfo().title}](${track.getYoutubeTrackInfo().url}) [<@${track.metaData.requesterId}>]`)
            .setThumbnail(track.getYoutubeTrackInfo().thumbnailURL)
    }

    export function createLinkTrackCurrentlyPlayingEmbed(track: Track, url: string): MessageEmbed {
        return MessageGenerator.getBaseEmbed()
            .setDescription(`[${track.getTitle()}](${url}) [<@${track.metaData.requesterId}>]`)
    }

    export function createLinkTrackNewlyQueuedEmbed(track: Track, url: string): MessageEmbed {
        return MessageGenerator.getBaseEmbed()
            .setDescription(`<@${track.metaData.requesterId}> queued: [${track.getTitle()}](${url})`)
    }
}

export namespace TrackMessageFactory {
    export function createNowPlayingEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createSongTrackNowPlayingEmbed(track)
        }
    }

    export function createCurrentlyPlayingEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createLinkTrackCurrentlyPlayingEmbed(track, track.getYoutubeTrackInfo().url)
        }
    }

    export function createTrackNewlyQueuedEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createLinkTrackNewlyQueuedEmbed(track, track.getYoutubeTrackInfo().url)
        }
    }

    export function createQueuedTracksMessage(context: GuildContext, tracks: Track[]): string {
        const tableHeaders = ['Track Name', 'Artist', 'Requester', 'Length']
        const tableData = []
        let totalLength = 0
        tracks.forEach((track) => {
            const title = track.isPlaying() ? `< ${track.getTitle()} > `: track.getTitle()
            const length = Utils.convertSecondsToTimeString(track.getLength())
            tableData.push([title, track.getArtist(), track.getRequester(context), length])
            totalLength += track.getLength()
        })
        let response = TableGenerator.createTable(tableHeaders, tableData)
        response += `\n# Total Queue Time: ${Utils.convertSecondsToTimeString(totalLength)}`
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
}