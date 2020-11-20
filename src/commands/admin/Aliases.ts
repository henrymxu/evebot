import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {Aliases} from "../../guild/Config"
import {TableGenerator} from "../../communication/TableGenerator"
import {CommandRegistry} from "../Registry"
import {GuildUtils} from "../../utils/GuildUtils"

export default class AliasesCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Aliases',
        keywords: ['aliases'],
        group: 'admin',
        descriptions: ['Modify aliases for commands'],
        arguments: [
            {
                key: 'command',
                description: 'Command you would like to add aliases for',
                required: true,
                type: ArgumentType.STRING,
                validate: GuildUtils.isStringACommand
            },
            {
                key: 'add',
                flag: 'a',
                description: 'Aliases you would like to add',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Aliases you would like to remove',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'list',
                flag: 'l',
                description: 'List aliases for this command',
                required: false,
                type: ArgumentType.FLAG
            }
        ],
        permissions: ['MANAGE_GUILD'],
        examples: ['aliases play -a sing', 'aliases play -l']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const command = CommandRegistry.getCommand(context, args.get('command'))!
        if (!args.get('list') && (args.get('add') || args.get('remove'))) {
            context.getConfig().addAliases(command.options.name.toLowerCase(), args.get('add') || [])
            context.getConfig().removeAliases(command.options.name.toLowerCase(), args.get('remove') || [])
        }
        const embed = TableGenerator.createBasicListEmbed(command.options.name,
            context.getConfig().getAliases(command.options.name), 'Aliases')
        context.getProvider().getResponder().send({content: embed, message: message}, 20)
    }
}
