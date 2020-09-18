import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {Nicknames} from "../../guild/Config"
import {TableGenerator} from "../../communication/TableGenerator"

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
                type: ArgumentType.USER
            },
            {
                key: 'add',
                flag: 'a',
                description: 'Nicknames you would like to add',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Nicknames you would like to remove',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'list',
                flag: 'l',
                description: 'List nicknames for the user',
                required: false,
                type: ArgumentType.FLAG
            }
        ],
        examples: ['nicknames @Jonathan -a Johnny John', 'nicknames @Jonathan -l']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user = args.get('user')
        if (!args.get('list') && (args.get('add') || args.get('remove'))) {
            context.getConfig().addNicknames(user.id, args.get('add') || [])
            context.getConfig().removeNicknames(user.id, args.get('remove') || [])
        }
        const embed = TableGenerator.createBasicListEmbed(user.tag, context.getConfig().getNicknames(user.id), 'Nicknames')
        context.getProvider().getResponder().send({content: embed, message: message}, 20)
    }
}
