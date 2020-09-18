import requireAll from "require-all"
import {Command} from "./Command"
import {Utils} from "../utils/Utils"
import {GuildContext} from "../guild/Context"

const commands: Map<string, Command> = new Map()
const groups: Set<string> = new Set()

export namespace CommandRegistry {
    export function getCommand(context: GuildContext, keyword: string) {
        let command = commands.get(keyword.toLowerCase())
        if (!command) {
            command = commands.get(context.getConfig().getCommandNameForAlias(keyword.toLowerCase()))
        }
        return command
    }

    export function getCommands(): Map<string, Command> {
        return commands
    }

    export function getCommandGroup(group: string): Map<string, Command> {
        const commandGroup = new Map<string, Command>()
        commands.forEach((command, keyword) => {
            if (command.options.group == group) {
                commandGroup.set(keyword, command)
            }
        })
        return commandGroup
    }

    export function getCommandsByGroup(): Map<string, Map<string, Command>> {
        const result: Map<string, Map<string, Command>> = new Map()
        groups.forEach((group) => {
            result.set(group, getCommandGroup(group))
        })
        return result
    }

    export function registerCommandsIn(path: string) {
        const modules = requireAll({
            dirname: path,
            filter: /^([^.].*)\.(ts|js)(on)?$/
        })

        function getLeafNodes(nodes: object, result = []): any[] {
            Object.values(nodes).forEach((node) => {
                if (node.default) {
                    result.push(node)
                    return
                } else if (typeof node == "object") {
                    result = getLeafNodes(node, result)
                }
            })
            return result
        }

        Object.values(getLeafNodes(modules)).forEach((command: any) => {
            if (isCommand(command)) {
                const instance: Command = new command.default()
                if (validateCommand(instance)) {
                    instance.options.keywords.forEach(keyword => {
                        commands.set(keyword, instance)
                    })
                    groups.add(instance.options.group)
                }
            }
        })
    }
}

function isCommand(obj: any): boolean {
    return obj.default.prototype instanceof Command
}

function validateCommand(command: Command): boolean {
    const options = command.options
    const firstCharacter = options.name[0]
    if (firstCharacter === firstCharacter.toLowerCase() && firstCharacter !== firstCharacter.toUpperCase()) {
        throw(`${options.name} command name does not start with uppercase letter`)
    }
    if (options.keywords.length == 0) {
        throw(`${options.name} command does not have any keywords`)
    }
    if (options.keywords.length != options.descriptions.length) {
        throw(`${options.name} command is missing / has to many descriptions (number of descriptions should match number of keywords)`)
    }
    options.keywords.forEach(keyword => {
        if (!Utils.isLowercaseString(keyword)) {
            throw(`${options.name} has non complete lowercase keyword ${keyword}`)
        }
    })
    commands.forEach(registeredCommand => {
        if (registeredCommand.options.name == options.name) {
            throw(`Multiple commands registered with name ${options.name}`)
        }
        const overlap = registeredCommand.options.keywords.filter(x => options.keywords.includes(x))
        if (overlap.length > 0) {
            throw(`Multiple commands registered with keyword ${overlap}`)
        }
    })
    const argKeys = new Set<string>()
    const argFlags = new Set<string>()
    for (let argument of options.arguments) {
        if (argument.key == 'keyword') {
            throw(`${options.name} command, ${argument.key} cannot use key 'keyword'`)
        }
        if (argument.required && argument.default) {
            throw(`${options.name} command, ${argument.key} is required but has default value`)
        }
        if (argument.flag == '_' || argument.flag == 'h') {
            throw(`${options.name} command, ${argument.key} cannot use flag '_' or 'h'. These are reserved for default and help options`)
        }
        const parsedFlag = argument.flag || '_'
        if (argKeys.has(argument.key)) {
            throw(`${options.name} command, has multiple arguments with ${argument.key} key`)
        }
        if (argFlags.has(parsedFlag)) {
            throw(`${options.name} command, has multiple arguments with ${parsedFlag} flag`)
        }
        argKeys.add(argument.key)
        argFlags.add(parsedFlag)
    }
    return true
}
