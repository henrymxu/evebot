import VoiceCommand from "../../voice/VoiceCommand"
import {Message, User} from "discord.js"
import {CommandOptions} from "../Command"
import {GuildContext} from "../../guild/Context"

export default class ReconnectCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Reconnect',
        keywords: ['reconnect'],
        group: 'voice',
        descriptions: ['Reconnect to current voice channel'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const currentVoiceChannel = context.getVoiceConnection()?.channel
        context.getProvider().getVoiceConnectionHandler().disconnect().then(() => {
            setTimeout(() => {
                context.getProvider().getVoiceConnectionHandler().joinVoiceChannel(currentVoiceChannel).then(() => {
                    context.getProvider().getResponder().acknowledge(0, message)
                })
            }, 2500)
        })
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return true;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
