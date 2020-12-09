import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, Command, CommandAck, CommandOptions} from '../Command'
import {Acknowledgement} from '../../communication/Responder'

export default class VolumeCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Volume',
        keywords: ['volume'],
        group: 'music',
        descriptions: ['Set the volume of the bot'],
        arguments: [
            {
                key: 'volume',
                description: 'The desired volume of the bot (0 - 100)',
                required: true,
                type: ArgumentType.INTEGER,
                validate: (context: GuildContext, arg: any) => { return arg >= 0 && arg <= 100 }
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        context.getProvider().getDJ().volume(args.get('volume'))
        return Promise.resolve(Acknowledgement.OK)
    }
}
