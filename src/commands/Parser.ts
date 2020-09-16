import {GuildContext} from "../guild/Context"
import {ArgumentType, Command} from "./Command"

import parser from "yargs-parser"
import {User} from "discord.js"
import {GuildUtils} from "../utils/GuildUtils"

export namespace CommandParser {
    export function parseKeyword(context: GuildContext, message: string): string {
        // TODO: parse message to see if a command exists
        const regexString = `(?<=^\\${context.getPrefix()})[^\\s]*`
        const regex = new RegExp(regexString, 'i')
        const keyword = message.match(regex)
        return keyword ? keyword[0] : ""
    }

    export function parseArguments(context: GuildContext, command: Command, keyword: string, message: string): ParserResult {
        const allFlags = []
        command.options.arguments.forEach(arg => { allFlags.push(arg.flag || '_') })
        const messageArgs: {} = parser(message, {array: allFlags, configuration: {"short-option-groups": true}})
        // filter out the command keyword, if the guild uses - as the prefix, there may be some issues
        messageArgs['_'].shift()
        // Join all non array types, remove empty array types
        command.options.arguments.forEach(arg => {
            const flag = arg.flag || '_'
            if (!arg.array) {
                messageArgs[flag] = messageArgs[flag] ? messageArgs[flag].join(' ') : undefined
            } else if (messageArgs[flag]) {
                messageArgs[flag] = messageArgs[flag].length > 0 ? messageArgs[flag] : undefined
            }
        })
        const args: Map<string, any> = new Map()
        const invalidArgs: Map<string, Error> = new Map()
        let helpCommand = false
        for (let argument of command.options.arguments) {
            const flag = argument.flag || '_'
            const value = messageArgs[flag]
            const key = argument.key
            if (argument.flag == 'h') {
                helpCommand = true
                break
            }
            if (argument.required && !value) {
                invalidArgs.set(key, new Error(`Missing required value for ${key}`))
                continue
            }
            let parsedValue: any
            if (value) { // If a value was provided, validate it
                parsedValue = parseType(context, value, argument.type)
                if (!parsedValue) {
                    invalidArgs.set(key, new Error(`Invalid type provided for ${key}: ${value}`))
                    continue
                }
                if (argument.validate && !argument.validate(context, parsedValue)) {
                    invalidArgs.set(key, new Error(`Invalid value provided for ${key}: ${parsedValue}`))
                    continue
                }
            } else { // Resort to the default value (if exists)
                parsedValue = argument.default
            }
            args.set(key, parsedValue)
        }
        if (invalidArgs.size != 0) {
            invalidArgs.forEach(error => {
                console.log(`Invalid arg: ${error}`)
            })
            return {args: null, error: new Error('Something wrong with args')}
        }
        args.set('keyword', keyword)
        return {args: args, error: null, help: helpCommand}
    }

    export interface ParserResult {
        error: Error
        args: Map<string, any>
        help?: boolean
    }
}

function parseType(context: GuildContext, input: string, type: ArgumentType): any {
    switch(type) {
        case ArgumentType.integer: return parseInteger(input)
        case ArgumentType.number: return parseNumber(input)
        case ArgumentType.user: return parseUser(context, input)
        default: return input
    }
}

function parseInteger(input: string): number {
    return parseInt(input)
}

function parseNumber(input: string): number {
    return parseFloat(input)
}

function parseUser(context: GuildContext, input: string): User {
    const id = parseIdFromMention(input)
    if (id) {
        return GuildUtils.getUserFromUserID(context, id)
    }
    const memberFromTag = context.getGuild().members.cache.filter((member) => {
        return compareCaseInsensitive(member.user.tag, input)
    }).first()
    if (memberFromTag) {
        return memberFromTag.user
    }
    const memberFromDisplayName = context.getGuild().members.cache.filter((member) => {
        return compareCaseInsensitive(member.displayName, input)
    }).first()
    return memberFromDisplayName ? memberFromDisplayName.user : null
}

function parseIdFromMention(input: string): string {
    const parsedId = input.match(/^<@!?(\d+)>$/)
    return parsedId ? parsedId[1] : null
}

function compareCaseInsensitive(input1: string, input2: string): boolean {
    return input1.localeCompare(input2, undefined, {sensitivity: 'base'}) === 0
}