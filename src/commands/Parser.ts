import { GuildContext } from '../guild/Context'
import { ArgumentType, Command } from './Command'

import parser from 'yargs-parser'
import { GuildUtils } from '../utils/GuildUtils'
import { Logger } from '../Logger'

const TAG = 'CommandParser'

export namespace CommandParser {
    export function parseKeyword(
        context: GuildContext,
        message: string
    ): KeywordResult {
        let array = []
        context
            .getPrefix()
            .split('')
            .forEach((char) => {
                if (
                    [
                        '[',
                        '\\',
                        '^',
                        '$',
                        '.',
                        '|',
                        '?',
                        '*',
                        '+',
                        '(',
                        ')',
                    ].includes(char)
                ) {
                    char = '\\' + char
                }
                array.push(char)
            })
        const regexString = `(?<=^${array.join('')})[^\\s]*`
        const regex = new RegExp(regexString, 'i')
        const keyword = message.match(regex)
        const parsedMessage = message.replace(
            `${context.getPrefix()}${keyword}`,
            ''
        )
        return {
            keyword: keyword?.[0],
            parsedCommandString: parsedMessage.trim(),
        }
    }

    export function parseArguments(
        context: GuildContext,
        command: Command,
        keyword: string,
        message: string
    ): ParserResult {
        const allFlags = []
        command.options.arguments.forEach((arg) => {
            allFlags.push(arg.flag || '_')
        })
        const messageArgs: {} = parser(message, {
            array: allFlags,
            configuration: { 'short-option-groups': false },
        })
        // Join all non array types, remove empty array types
        command.options.arguments.forEach((arg) => {
            const flag = arg.flag || '_'
            if (!arg.array) {
                messageArgs[flag] = messageArgs[flag]?.join(' ')
            } else if (messageArgs[flag]) {
                messageArgs[flag] =
                    messageArgs[flag].length > 0 ? messageArgs[flag] : undefined
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
                invalidArgs.set(
                    key,
                    new Error(`Missing required value for ${key}`)
                )
                continue
            }
            let parsedValue: any
            if (value) {
                // If a value was provided, validate it
                parsedValue = parseType(context, value, argument.type)
                if (!parsedValue) {
                    invalidArgs.set(
                        key,
                        new Error(`Invalid type provided for ${key}: ${value}`)
                    )
                    continue
                }
                if (
                    argument.validate &&
                    !argument.validate(context, parsedValue)
                ) {
                    invalidArgs.set(
                        key,
                        new Error(
                            `Invalid value provided for ${key}: ${parsedValue}`
                        )
                    )
                    continue
                }
            } else {
                // Resort to the default value (if exists)
                parsedValue = argument.default
            }
            if (argument.type === ArgumentType.FLAG) {
                parsedValue = value !== undefined
            }
            args.set(key, parsedValue)
        }
        if (invalidArgs.size != 0) {
            invalidArgs.forEach((error) => {
                Logger.w(context, TAG, `Invalid argument, reason: ${error}`)
            })
            return { args: null, error: new Error('Something wrong with args') }
        }
        args.set('keyword', keyword.toLowerCase())
        return { args: args, error: null, help: helpCommand }
    }

    export interface KeywordResult {
        keyword: string
        parsedCommandString: string
    }

    export interface ParserResult {
        error: Error
        args: Map<string, any>
        help?: boolean
    }
}

function parseType(
    context: GuildContext,
    input: string,
    type: ArgumentType
): any {
    switch (type) {
        case ArgumentType.INTEGER:
            return parseInteger(input)
        case ArgumentType.NUMBER:
            return parseNumber(input)
        case ArgumentType.USER:
            return GuildUtils.parseUserFromString(context, input)
        default:
            return input
    }
}

function parseInteger(input: string): number {
    return parseInt(input)
}

function parseNumber(input: string): number {
    return parseFloat(input)
}
