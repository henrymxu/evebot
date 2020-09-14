import {MessageEmbed} from "discord.js"
import YoutubeTrack from "../music/tracks/YoutubeTrack"
import {Track} from "../music/tracks/Track"
import {MessageGenerator} from "./MessageGenerator"

namespace TrackMessageGenerator {
    export function createSongTrackNowPlayingEmbed(track: YoutubeTrack): MessageEmbed {
        return MessageGenerator.getBaseEmbed()
            .setTitle('Now Playing')
            .setDescription(`[${track.info.title}](${track.info.url}) [<@${track.metaData.requesterId}>]`)
            .setThumbnail(track.info.thumbnailURL)
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
            return TrackMessageGenerator.createLinkTrackCurrentlyPlayingEmbed(track, track.info.url)
        }
    }

    export function createTrackNewlyQueuedEmbed(track: Track): MessageEmbed {
        if (track instanceof YoutubeTrack) {
            return TrackMessageGenerator.createLinkTrackNewlyQueuedEmbed(track, track.info.url)
        }
    }
}