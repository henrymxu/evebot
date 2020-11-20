import {ArgumentType, Command, CommandOptions} from "../Command"
import {GuildUtils} from "../../utils/GuildUtils"
import {GuildContext} from "../../guild/Context"
import {Message, MessageEmbed, User} from "discord.js"
import {Logger} from "../../Logger"
import {MessageGenerator} from "../../communication/MessageGenerator"

export default class LoggingCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Logging',
        keywords: ['logging'],
        group: 'admin',
        descriptions: ['Modify bot logging for this server'],
        arguments: [
            {
                key: 'channel',
                description: 'Logging text channel',
                required: false,
                type: ArgumentType.STRING,
                validate: (context: GuildContext, arg: any) => GuildUtils.findTextChannelByName(context, arg) != null
            },
            {
                key: 'level',
                flag: 'l',
                description: 'Logging level (i = info, d = debug, w = warning, e = error)',
                required: false,
                type: ArgumentType.STRING,
                validate: (context: GuildContext, arg: any) => {
                    return (arg == 'i' || arg == 'd' || arg == 'w' || arg == 'e')
                }
            }
        ],
        permissions: ['MANAGE_CHANNELS'],
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        // TODO: Implement way to modify / remove flags / channel
        if (!args.get('channel')) {
            context.getProvider().getResponder().send(
                {content: createCurrentLoggingTextChannelEmbed(context), message: message}, 20)
            return
        }
        const textChannel = GuildUtils.findTextChannelByName(context, args.get('channel'))
        const flag = args.get('flag') || 'e'
        context.getConfig().setLogging(textChannel.id, flag)
        Logger.i(context, LoggingCommand.name,
            `Successfully set LoggingTextChannel to ${textChannel.name} | ${textChannel.id}`)
        context.getProvider().getResponder().acknowledge(0, message)
    }
}

function createCurrentLoggingTextChannelEmbed(context: GuildContext): MessageEmbed {
    const logging = context.getConfig().getLogging()
    const currentTextChannel = GuildUtils.findTextChannelByID(context, logging.channelID)
    const message = currentTextChannel ? `${currentTextChannel.name} | ${currentTextChannel.id} | ${logging.flag}` :
        'No Logging Text Channel set'
    const embed = MessageGenerator.createBasicEmbed(message)
    embed.setTitle('Current Logging Text Channel')
    return embed
}