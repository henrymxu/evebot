import {GuildContext} from "../guild/Context"
import {ArgumentType, Command} from "./Command"

import parser from "yargs-parser"
import {User} from "discord.js"

export namespace CommandParser {
    export function parseKeyword(context: GuildContext, message: string): string {
        // TODO: parse message to see if a command exists
        const regexString = `(?<=^\\${context.getPrefix()})[^\\s]*`
        const regex = new RegExp(regexString, 'i')
        const keyword = message.match(regex)
        return keyword ? keyword[0] : ""
    }

    export function parseArguments(context: GuildContext, command: Command, keyword: string, message: string): ParserResult {
        const messageArgs: {} = parser(message)
        messageArgs['_'].shift()
        messageArgs['_'] = messageArgs['_'].join(' ')
        const args: Map<string, any> = new Map()
        const invalidArgs: Map<string, Error> = new Map()
        let helpCommand = false
        for (let argument of command.options.arguments) {
            const flag = argument.flag ? argument.flag : '_'
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
                if (argument.validate && !argument.validate(parsedValue)) {
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
        return context.getUserFromUserID(id)
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