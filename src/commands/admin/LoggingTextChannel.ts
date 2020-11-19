import {ArgumentType, Command, CommandOptions} from "../Command"
import {GuildUtils} from "../../utils/GuildUtils"
import {GuildContext} from "../../guild/Context"
import {Message, MessageEmbed, User} from "discord.js"
import {Logger} from "../../Logger"
import {MessageGenerator} from "../../communication/MessageGenerator"

export default class LoggingTextChannelCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Logging',
        keywords: ['logging'],
        group: 'admin',
        descriptions: ['Modify logging text channel for this server'],
        arguments: [
            {
                key: 'channel',
                description: 'Logging text channel',
                required: false,
                type: ArgumentType.STRING,
                validate: (context, arg) => GuildUtils.findTextChannelByName(context, arg) != null
            }
        ],
        permissions: ['MANAGE_CHANNELS'],
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (!args.get('channel')) {
            context.getProvider().getResponder().send(
                {content: createCurrentLoggingTextChannelEmbed(context), message: message}, 20)
            return
        }
        const textChannel = GuildUtils.findTextChannelByName(context, args.get('channel'))
        context.getConfig().setLoggingTextChannel(textChannel.id)
        Logger.i(context, LoggingTextChannelCommand.name, `Successfully set LoggingTextChannel to ${textChannel.name} | ${textChannel.id}`)
        context.getProvider().getResponder().acknowledge(0, message)
    }
}

function createCurrentLoggingTextChannelEmbed(context: GuildContext): MessageEmbed {
    const currentTextChannel = GuildUtils.findTextChannelByID(context, context.getConfig().getLoggingTextChannel())
    const message = currentTextChannel ? `${currentTextChannel.name} | ${currentTextChannel.id}` : 'No Logging Text Channel set'
    const embed = MessageGenerator.createBasicEmbed(message)
    embed.setTitle('Current Logging Text Channel')
    return embed
}