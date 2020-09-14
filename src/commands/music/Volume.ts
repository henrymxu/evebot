import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"

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
                type: ArgumentType.integer,
                validate: (volume) => {
                    return volume >= 0 && volume <= 100
                }
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        context.getProvider().getDJ().volume(args.get('volume'))
        context.getProvider().getResponder().acknowledge(0, message)
    }
}
