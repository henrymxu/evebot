import {Message, MessageEmbed, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {GuildUtils} from "../../utils/GuildUtils"
import {MessageGenerator} from "../../communication/MessageGenerator"

export default class DefaultTextChannelCommand extends Command {
    readonly options: CommandOptions = {
        name: 'DefaultTextChannel',
        keywords: ['textchannel'],
        group: 'admin',
        descriptions: ['Modify default text channel for this server'],
        arguments: [
            {
                key: 'channel',
                description: 'Default Text Channel',
                required: false,
                type: ArgumentType.string,
                validate: (context, arg) => GuildUtils.findTextChannelByName(context, arg) != null
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (!args.get('channel')) {
            context.getProvider().getResponder().send(
                {content: createCurrentDefaultTextChannelEmbed(context), message: message}, 20)
            return
        }
        const textChannel = GuildUtils.findTextChannelByName(context, args.get('channel'))
        context.getConfig().setDefaultTextChannel(textChannel.id)
        console.log(`Succesfully set DefaultTextChannel to ${textChannel.name} | ${textChannel.id}`)
        context.getProvider().getResponder().acknowledge(0, message)
    }
}

function createCurrentDefaultTextChannelEmbed(context: GuildContext): MessageEmbed {
    const currentTextChannel = GuildUtils.findTextChannelByID(context, context.getConfig().getDefaultTextChannel())
    const message = currentTextChannel ? `${currentTextChannel.name} | ${currentTextChannel.id}` : 'No Text Channel set'
    const embed = MessageGenerator.createBasicEmbed(message)
    embed.setTitle('Current Default Text Channel')
    return embed
}
