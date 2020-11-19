import {GuildContext} from "./guild/Context"
import {MessageEmbed, TextChannel} from "discord.js"
import {MessageGenerator} from "./communication/MessageGenerator"
import {GlobalContext} from "./GlobalContext"

export namespace Logger {
    export function i(context: GuildContext, tag: string, log: string) {
        console.info(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, MessageGenerator.createBasicEmbed(`${tag}: ${log}`, 'Info'))
    }

    export function e(context: GuildContext, tag: string, log: string) {
        console.error(`${tag}: ${log}`)
        if (context) {
            context.getProvider().getResponder().error(`${tag}: ${log}`)
        }
        sendMessageToLoggingChannel(context, MessageGenerator.createBasicEmbed(`${tag}: ${log}`, 'Error'))
    }

    export function d(context: GuildContext, tag: string, log: string) {
        console.debug(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, MessageGenerator.createBasicEmbed(`${tag}: ${log}`, 'Debug'))
    }

    export function w(context: GuildContext, tag: string, log: string) {
        console.warn(`${tag}: ${log}`)
        sendMessageToLoggingChannel(context, MessageGenerator.createBasicEmbed(`${tag}: ${log}`, 'Warning'))
    }

    function sendMessageToLoggingChannel(context: GuildContext, message: MessageEmbed) {
        if (!context) {
            return
        }
        const channelID = context.getConfig().getLoggingTextChannel()
        if (!channelID) {
            return
        }
        const channel = context.getGuild().channels.resolve(channelID) as TextChannel
        if (channel.permissionsFor(GlobalContext.getClient().user.id).has('SEND_MESSAGES')) {
            channel.send(message)
        }
    }
}