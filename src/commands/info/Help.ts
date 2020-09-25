import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, Command, CommandOptions} from '../Command'
import {CommandRegistry} from '../Registry'
import {TableGenerator} from '../../communication/TableGenerator'
import {GuildUtils} from "../../utils/GuildUtils"

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

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const commands = CommandRegistry.getCommands()
        if (args.get('query')) {
            let response = null
            if (commands.has(args.get('query'))) {
                response = createSingleCommandHelpMessage(context, args.get('query'), commands.get(args.get('query')))
            } else {
                const group = CommandRegistry.getCommandGroup(args.get('query'))
                if (group.size > 0) {
                    const map: Map<string, Map<string, Command>> = new Map()
                    map.set(args.get('query'), group)
                    response = createMultipleCommandHelpMessage(context, map)[0]
                }
            }
            context.getProvider().getResponder().send({content: response, message: message, options: {code: 'Markdown'}}, 30)
        } else {
            const responses = createMultipleCommandHelpMessage(context, CommandRegistry.getCommandsByGroup())
            responses.forEach((response) => {
                context.getProvider().getResponder().send({content: response, message: message, options: {code: 'Markdown'}}, 30)
            })
        }
    }
}

function createMultipleCommandHelpMessage(context: GuildContext, commandsByGroup: Map<string, Map<string, Command>>): string[] {
    const descriptions: string[] = []
    let description = `Commands\n=========\n`
    description += `For more information on a single command or group, use <${context.getPrefix()}help keyword/group>\n`
    let commandHelpMessage = false
    commandsByGroup.forEach((commands) => {
        let table = createGroupCommandTable(commands)
        if (!commandHelpMessage) {
            table = description + table
            commandHelpMessage = true
        }
        descriptions.push(table)
    })
    return descriptions
}

function createGroupCommandTable(commands: Map<string, Command>): string {
    const tableData = []
    const tableHeaders = ['Group', 'Keyword', 'Description']
    commands.forEach((command, keyword) => {
        tableData.push([command.options.group, keyword, command.options.descriptions[command.options.keywords.indexOf(keyword)]])
    })
    return TableGenerator.createTable(tableHeaders, tableData)
}

function createSingleCommandHelpMessage(context: GuildContext, keyword: string, command: Command): string {
    let description = `${command.options.name}\n=========\n`
    const descriptionIndex = command.options.keywords.indexOf(keyword)
    description += `Description: ${command.options.descriptions[descriptionIndex]}\n`
    description += `Group: ${command.options.group}\n`
    const aliases = [...context.getConfig().getAliases(command.options.name)]
    const aliasesString = aliases.length > 0 ? aliases.reduce((result, alias) => `${result}, ${alias}`) : ''
    description += `Keyword: <${keyword}${aliasesString}>\n`
    if (command.options.arguments.length > 0) {
        const tableData = []
        const tableHeaders = ['Argument', 'Description', 'Flag', 'Required', 'Type', 'Default']
        command.options.arguments.forEach((argument) => {
            const flag = argument.flag != '_' ? argument.flag : ''
            const defaultValue = argument.default ? argument.default : ''
            const required =  argument.required ? 'yes': 'no'
            const type = `${ArgumentType[argument.type]}${argument.array ? ' [ Multiple ]' : ''}`
            tableData.push([argument.key, argument.description, flag , required, type, defaultValue])
        })
        description += TableGenerator.createTable(tableHeaders, tableData)
    } else {
        description += `Arguments: None\n`
    }
    if (command.options.examples) {
        description += `# Examples\n`
        command.options.examples.forEach(command => {
           description += `< ${command} >\n`
        })
    }
    if (command.options.permissions) {
        const permissionsString = command.options.permissions.reduce((result, permission) => `${result} ${permission}`)
        description += `<Permissions ${permissionsString}>\n`
    }
    if (command.options.throttleRate) {
        description += `<ThrottleRate ${command.options.throttleRate.count} every ${command.options.throttleRate.seconds} seconds>`
    }
    return description.trimRight()
}
