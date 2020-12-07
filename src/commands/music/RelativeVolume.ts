import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {Command, CommandOptions} from '../Command'

export default class RelativeVolumeCommand extends Command {
    readonly options: CommandOptions = {
        name: 'RelativeVolume',
        keywords: ['higher', 'lower'],
        group: 'music',
        descriptions: ['Raise volume by 50%', 'Lower volume by 50%'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const adjustment = args.get('keyword') === 'higher' ? 2 : 0.5
        context.getProvider().getDJ().volume(adjustment, true)
        context.getProvider().getResponder().acknowledge(0, message)
    }
}
