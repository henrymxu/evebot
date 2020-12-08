import {Command, CommandOptions} from '../Command'
import {GuildContext} from '../../guild/Context'
import {Message, MessageEmbed, User} from 'discord.js'
import {Track} from '../../music/tracks/Track'
import {MessageGenerator} from '../../communication/MessageGenerator'
import {TrackMessageFactory} from '../../communication/TrackMessageGenerator'

export default class QueueCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Queue',
        keywords: ['queue', 'song'],
        group: 'music',
        descriptions: ['Display entire queue', 'Display current song'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        switch(args.get('keyword')) {
            case 'queue': {
                const response = createQueueMessage(context, context.getProvider().getDJ().getQueue())
                let options = undefined
                if (!(response instanceof MessageEmbed)) {
                    options = {code: 'Markdown'}
                }
                context.getProvider().getResponder()
                    .send({content: response, id: 'queue', message: message, options: options}, 30)
                return
            }
            case 'song': {
                const embed = createSongMessage(context, context.getProvider().getDJ().getCurrentSong())
                context.getProvider().getResponder().send({content: embed, id: 'song', message: message})
                return
            }
        }
    }
}

function createQueueMessage(context: GuildContext, tracks: Track[]): MessageEmbed | string {
    if (tracks.length === 0) {
        return createErrorMessage(context)
    } else if (context.getProvider().getDJ().getRadio().isPlaying()) {
        return TrackMessageFactory
            .createRadioMessage(context, context.getProvider().getDJ().getRadio().getRadioConfiguration()!)
    }
    return TrackMessageFactory.createQueuedTracksMessage(context, tracks)
}

function createSongMessage(context: GuildContext, track: Track | undefined): MessageEmbed {
    if (!track) {
        return createErrorMessage(context)
    }
    return TrackMessageFactory.createCurrentlyPlayingEmbed(track)
}

function createErrorMessage(context: GuildContext): MessageEmbed {
    return MessageGenerator.createErrorEmbed(`Queue is empty! Use ${context.getPrefix()}play command to queue some tracks!`)
}
