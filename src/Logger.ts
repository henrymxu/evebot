import {GuildContext} from './guild/Context'
import {TextChannel} from 'discord.js'
import {MessageGenerator} from './communication/MessageGenerator'
import {GlobalContext} from './GlobalContext'

export namespace Logger {
    export function i(tag: string, log: string, context?: GuildContext) {
        console.info(`${tag}: ${log}`)
        sendMessageToLoggingChannel('i', tag, log, context)
    }

    export function e(tag: string, log: string, context?: GuildContext) {
        console.error(`${tag}: ${log}`)
        if (context) {
            context.getProvider().getResponder().error(`${tag}: ${log}`)
        }
        sendMessageToLoggingChannel('e', tag, log, context)
    }

    export function d(tag: string, log: string, context?: GuildContext) {
        console.debug(`${tag}: ${log}`)
        sendMessageToLoggingChannel('d', tag, log, context)
    }

    export function w(tag: string, log: string, context?: GuildContext) {
        console.warn(`${tag}: ${log}`)
        sendMessageToLoggingChannel('w', tag, log, context)
    }
}

/**
 * Don't use responder to send logging message, this may create an infinite loop
 */
function sendMessageToLoggingChannel(level: string, tag: string, log: string, context?: GuildContext) {
    if (!context) {
        return
    }
    const message = MessageGenerator.createBasicEmbed(`${tag}: ${log}`, levelToString(level))
    const logging = context.getConfig().getLogging()
    if (!logging.channelID || !appropriateLevel(level, logging.flag)) {
        return
    }
    const channel = context.getGuild().channels.resolve(logging.channelID) as TextChannel
    if (channel?.permissionsFor(GlobalContext.getBotID())?.has('SEND_MESSAGES')) {
        channel.send(message)
    }
}

// TODO: Probably a way to clean this up using bitfields
function appropriateLevel(level: string, flag: string): boolean {
    if (flag === 'e') {
        return true
    } else if (flag === 'w' && (level === 'w' || level === 'e')) {
        return true
    } else if (flag === 'd' && (level !== 'i')) {
        return true
    } else if (flag === 'i' && level === 'i') {
        return true
    }
    return false
}

function levelToString(level: string): string {
    switch(level) {
        case 'i':
            return 'Info'
        case 'd':
            return 'Debug'
        case 'w':
            return 'Warning'
        default:
            return 'Error'
    }
}