import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {Aliases} from "../../guild/Config"
import {TableGenerator} from "../../communication/TableGenerator"
import {CommandRegistry} from "../Registry"
import {GuildUtils} from "../../utils/GuildUtils"

export default class MacrosCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Macros',
        keywords: ['macros'],
        group: 'admin',
        descriptions: ['Modify macros for commands'],
        arguments: [
            {
                key: 'macro',
                description: 'Macro name',
                required: false,
                type: ArgumentType.STRING,
            },
            {
                key: 'create',
                flag: 'c',
                description: 'Macro of the command you would like to add',
                required: false,
                type: ArgumentType.STRING,
            },
            {
                key: 'delete',
                flag: 'd',
                description: 'Name of macro you would like to delete',
                required: false,
                type: ArgumentType.FLAG,
            },
            {
                key: 'list',
                flag: 'l',
                description: 'List of available macros',
                required: false,
                type: ArgumentType.FLAG
            }
        ],
        permissions: ['MANAGE_GUILD'],
        examples: ['macros play closer', 'macros replay @Eve']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (!args.get('list') && (args.get('create') || args.get('delete'))) {
            if (args.get('create')) {
                context.getConfig().addMacro(args.get('macro'), {command: args.get('create'), creator: source.id})
            } else if (args.get('delete')) {
                context.getConfig().removeMacro(args.get('macro'))
            }
        }
        const tableHeaders = ['Name', 'Command', 'Creator']
        const tableData = []
        context.getConfig().getMacros().forEach((command, key) => {
            tableData.push([key, command.command, GuildUtils.parseUserFromUserID(context, command.creator).username])
        })
        const content = TableGenerator.createTable(tableHeaders, tableData)
        context.getProvider().getResponder().send({content: content, message: message, options: {code: 'markdown'}}, 20)
    }
}
