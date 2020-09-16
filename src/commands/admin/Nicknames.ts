import {Message, MessageEmbed, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {MessageGenerator} from "../../communication/MessageGenerator"
import {Nicknames} from "../../Config"

export default class NicknamesCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Nicknames',
        keywords: ['nicknames'],
        group: 'admin',
        descriptions: ['Modify nicknames for users'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like modify nicknames for',
                required: true,
                type: ArgumentType.user
            },
            {
                key: 'add',
                flag: 'a',
                description: 'Nicknames you would like to add',
                required: false,
                type: ArgumentType.string,
                array: true
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Nicknames you would like to remove',
                required: false,
                type: ArgumentType.string,
                array: true
            },
            {
                key: 'list',
                flag: 'l',
                description: 'List nicknames for the user',
                required: false,
                type: ArgumentType.flag
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user = args.get('user')
        if (args.get('list') || (!args.get('add') && !args.get('remove'))) {
            const embed = createNicknamesListForUserEmbed(context, user)
            context.getProvider().getResponder().send({content: embed, message: message}, 20)
            return
        }
        let result: boolean = false
        if (args.get('add')) {
            result = context.getConfig().addNicknames(user.id, args.get('add'))
        } else if (args.get('remove')) {
            result = context.getConfig().removeNicknames(user.id, args.get('remove'))
        }
        context.getProvider().getResponder().acknowledge(result ? 0 : 1, message)
    }
}

function createNicknamesListForUserEmbed(context: GuildContext, user: User): MessageEmbed {
    const embed = MessageGenerator.getBaseEmbed()
    embed.setTitle(user.tag)
    const nicknames: Nicknames = context.getConfig().getNicknames(user.id)
    let description = ''
    if (!nicknames || nicknames.size === 0) {
        description = 'No nicknames'
    } else {
        nicknames.forEach((nickname) => {
            description += `${nickname}\n`
        })
    }
    embed.setDescription(description.trimRight())
    return embed
}