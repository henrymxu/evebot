import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {CommandRegistry} from "../Registry"
import {TableGenerator} from "../../communication/TableGenerator"

export default class HelpCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Help',
        keywords: ['help'],
        group: 'admin',
        descriptions: ['Show help'],
        arguments: [
            {
                key: 'query',
                description: 'Group or specific command',
                required: false,
                type: ArgumentType.string
            }
        ]
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
    const tableHeaders = ["Group", "Keyword", "Description"]
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
    const aliases = ""
    description += `Keyword: <${keyword}${aliases ? aliases : ""}>\n`
    if (command.options.arguments.length > 0) {
        const tableData = []
        const tableHeaders = ["Argument", "Description", "Flag", "Required", "Type"]
        command.options.arguments.forEach((argument) => {
            const flag = argument.flag != "_" ? argument.flag : ""
            tableData.push([argument.key, argument.description, flag , argument.required ? "yes": "no", ArgumentType[argument.type]])
        })
        description += TableGenerator.createTable(tableHeaders, tableData)
    } else {
        description += `Arguments: None\n`
    }
    if (command.options.example) {
        description += `Example: <${context.getPrefix()}${command.options.example}>`
    }
    return description
}
