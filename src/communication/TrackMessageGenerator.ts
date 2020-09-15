import {MessageEmbed} from "discord.js"
import YoutubeTrack from "../music/tracks/YoutubeTrack"
import {Track} from "../music/tracks/Track"
import {MessageGenerator} from "./MessageGenerator"
import {TableGenerator} from "./TableGenerator"
import {GuildContext} from "../guild/Context"

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

    export function createQueuedTracksMessage(context: GuildContext, tracks: Track[]): string {
        const tableHeaders = ['Track Name', 'Artist', 'Requester', 'Length']
        const tableData = []
        tracks.forEach((track) => {
            tableData.push([track.getTitle(), track.getArtist(), track.getRequester(context), track.getLength()])
        })
        return TableGenerator.createTable(tableHeaders, tableData)
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
        return TrackMessageGenerator.createQueuedTracksMessage(context, tracks)
    }
}