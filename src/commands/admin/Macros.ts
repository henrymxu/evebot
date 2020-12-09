import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, Command, CommandAck, CommandOptions} from '../Command'
import {TableGenerator} from '../../communication/TableGenerator'
import {GuildUtils} from '../../utils/GuildUtils'

export default class MacrosCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Macros',
        keywords: ['macros'],
        group: 'admin',
        descriptions: ['Modify channel macros'],
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
                description: 'Command you would like to create a macro for',
                required: false,
                type: ArgumentType.STRING,
            },
            {
                key: 'delete',
                flag: 'd',
                description: 'Name of the macro you would like to delete',
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
        examples: ['macros closer -c play closer', 'macros clipThat -c recite @Eve']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        if (!args.get('list') && (args.get('create') || args.get('delete'))) {
            if (args.get('create')) {
                context.getConfig().addMacro(args.get('macro'), {command: args.get('create'), creator: source.id})
            } else if (args.get('delete')) {
                context.getConfig().removeMacro(args.get('macro'))
            }
        }
        const tableHeaders = ['Name', 'Command', 'Creator']
        const tableData: string[][] = []
        context.getConfig().getMacros().forEach((command, key) => {
            tableData.push([key, command.command, GuildUtils.parseUserFromUserID(context, command.creator)!.username])
        })
        const content = TableGenerator.createTable(tableHeaders, tableData)
        return Promise.resolve({content: content, message: message, options: {code: true}, removeAfter: 20})
    }
}
