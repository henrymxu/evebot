import {GuildContext} from "./guild/Context"
import {TextChannel} from "discord.js"
import {MessageGenerator} from "./communication/MessageGenerator"
import {GlobalContext} from "./GlobalContext"

export namespace Logger {
    export function i(context: GuildContext, tag: string, log: string) {
        console.info(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, 'i', tag, log)
    }

    export function e(context: GuildContext, tag: string, log: string) {
        console.error(`${tag}: ${log}`)
        if (context) {
            context.getProvider().getResponder().error(`${tag}: ${log}`)
        }
        sendMessageToLoggingChannel(context, 'e', tag, log)
    }

    export function d(context: GuildContext, tag: string, log: string) {
        console.debug(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, 'd', tag, log)
    }

    export function w(context: GuildContext, tag: string, log: string) {
        console.warn(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, 'w', tag, log)
    }

    function sendMessageToLoggingChannel(context: GuildContext, level: string, tag: string, log: string) {
        if (!context) {
            return
        }
        const message = MessageGenerator.createBasicEmbed(`${tag}: ${log}`, levelToString(level))
        const logging = context.getConfig().getLogging()
        if (!logging.channelID || appropriateLevel(level, logging.flag)) {
            return
        }
        const channel = context.getGuild().channels.resolve(logging.channelID) as TextChannel
        if (channel.permissionsFor(GlobalContext.getClient().user.id).has('SEND_MESSAGES')) {
            channel.send(message)
        }
    }
}

// TODO: Probably a way to clean this up using bitfields
function appropriateLevel(level: string, flag: string): boolean {
    if (flag == 'e') {
        return true
    } else if (flag == 'w' && (level == 'w' || level == 'e')) {
        return true
    } else if (flag == 'd' && (level != 'i')) {
        return true
    } else if (flag == 'i' && level == 'i') {
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