import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, Command, CommandAck, CommandOptions, FileType} from '../Command'
import {CommandRegistry} from '../Registry'
import {DynamicTableGenerator, TableGenerator} from '../../communication/TableGenerator'
import {GuildUtils} from '../../utils/GuildUtils'

export default class HelpCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Help',
        keywords: ['help'],
        group: 'info',
        descriptions: ['Show help'],
        arguments: [
            {
                key: 'query',
                description: 'Group or specific command',
                required: false,
                type: ArgumentType.STRING,
                validate: GuildUtils.isStringACommandOrCommandGroup
            }
        ],
        examples: ['help voice']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let actionHandler: DynamicTableGenerator
        if (args.get('query')) {
            const command = CommandRegistry.getCommand(context, args.get('query'))
            if (command) {
                const response = createSingleCommandHelpMessage(context, args.get('query'), command)
                return Promise.resolve({ content: response, message: message,
                    options: {code: 'Markdown'}, removeAfter: 30 })
            } else {
                const group = CommandRegistry.getCommandGroup(args.get('query'))
                if (group.size > 0) {
                    actionHandler = new DynamicTableGenerator(context,
                        Array.from(group.keys()), generateCommandsHelpTable)
                }
            }
        } else {
            actionHandler = new DynamicTableGenerator(context,
                Array.from(CommandRegistry.getGroups()), generateGroupsCommandHelpTable)
        }
        return Promise.resolve({
            content: actionHandler!.initialize(),
            message: message,
            options: { code: 'Markdown' },
            removeAfter: 30,
            action: {
                handler: DynamicTableGenerator.getHandler(actionHandler!),
                options: actionHandler!.emojiOptions()
            }
        })
    }
}

function generateGroupsCommandHelpTable(context: GuildContext, groups: string[]): string {
    const tableHeaders = ['Group', '# of commands']
    const tableData = groups.map((group: string) => [group, CommandRegistry.getCommandGroup(group).size.toString()])
    return `Command Groups\n${TableGenerator.createTable(tableHeaders, tableData)}`
}

function generateCommandsHelpTable(context: GuildContext, commands: string[]): string {
    const tableHeaders = ['Group', 'Keyword', 'Description']
    const tableData = commands.map((commandName: string) => {
        const command = CommandRegistry.getCommand(context, commandName)!
        return [command.options.group, commandName,
            command.options.descriptions[command.options.keywords.indexOf(commandName)]]
    })
    return TableGenerator.createTable(tableHeaders, tableData)
}

function createSingleCommandHelpMessage(context: GuildContext, keyword: string, command: Command): string {
    keyword = context.getConfig().getCommandNameFromAlias(keyword) || keyword
    let description = `${command.options.name}\n=========\n`
    const descriptionIndex = command.options.keywords.indexOf(keyword)
    description += `Description: ${command.options.descriptions[descriptionIndex]}\n`
    description += `Group: ${command.options.group}\n`
    const aliases = [...context.getConfig().getAliases(command.options.name)]
    const aliasesString = aliases.length > 0 ? aliases.reduce((result, alias) => `${result}, ${alias}`) : ''
    description += `Keyword: <${keyword}>\n`
    description = aliasesString ? description + `Aliases: <${aliases}>\n` : description
    if (command.options.arguments.length > 0) {
        const tableData: string[][] = []
        const tableHeaders = ['Argument', 'Description', 'Flag', 'Required', 'Type', 'Default']
        command.options.arguments.forEach((argument) => {
            const flag = argument.flag !== '_' ? argument.flag : ''
            const defaultValue = argument.default ? argument.default : ''
            const required =  argument.required ? 'yes': 'no'
            const type = `${ArgumentType[argument.type]}${argument.array ? ' [ Multiple ]' : ''}`
            tableData.push([argument.key, argument.description, flag , required, type, defaultValue])
        })
        description += TableGenerator.createTable(tableHeaders, tableData)
    } else {
        description += `Arguments: None\n`
    }
    if (command.options.file) {
        description += `<File Attaching a ${FileType[command.options.file]} File is supported>`
    }
    if (command.options.throttleRate) {
        description +=
            `<ThrottleRate ${command.options.throttleRate.count} every ${command.options.throttleRate.seconds} seconds>`
    }
    if (command.options.permissions) {
        const permissionsString = command.options.permissions
            .reduce((result, permission) => `${result} ${permission}`)
        description += `<Permissions ${permissionsString}>\n`
    }
    if (command.options.examples) {
        description += `# Examples\n`
        command.options.examples.forEach(example => {
            description += `< ${context.getConfig().getPrefix()}${example} >\n`
        })
    }
    return description.trimRight()
}
