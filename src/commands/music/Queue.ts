import {Command, CommandAck, CommandExecutionError, CommandOptions} from '../Command'
import {GuildContext} from '../../guild/Context'
import {Message, User} from 'discord.js'
import {TrackMessageGenerator} from '../../communication/TrackMessageGenerator'

export default class QueueCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Queue',
        keywords: ['queue', 'song'],
        group: 'music',
        descriptions: ['Display entire queue', 'Display current song'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        switch(args.get('keyword')) {
            case 'queue': {
                if (context.getProvider().getDJ().getQueue().length === 0) {
                    throw new CommandExecutionError(`Queue is empty! Use ${context.getPrefix()}play command to queue some tracks!`)
                }
                if (context.getProvider().getDJ().getRadio().isPlaying()) {
                    const embed = TrackMessageGenerator.createRadioMessage(context,
                        context.getProvider().getDJ().getRadio().getRadioConfiguration()!)
                    return Promise.resolve({ content: embed, id: 'queue', message: message, removeAfter: 30 })
                }
                return Promise.resolve(TrackMessageGenerator.createDynamicQueuedTracksMessage(context,
                    context.getProvider().getDJ().getQueue(), message))
            }
            case 'song': {
                const track = context.getProvider().getDJ().getCurrentSong()
                if (!track) {
                    throw new CommandExecutionError(`No song playing! Use ${context.getPrefix()}play command to play one!`)
                }
                const embed = TrackMessageGenerator.createCurrentlyPlayingEmbed(track)
                return Promise.resolve({ content: embed, id: 'song', message: message, removeAfter: 30 })
            }
            default: {
                throw new CommandExecutionError('Command was executed with incorrect keywords')
            }
        }
    }
}
