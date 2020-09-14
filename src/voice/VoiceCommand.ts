import {Command} from "../commands/Command"
import {Message, VoiceChannel} from "discord.js"
import {GuildContext} from "../guild/Context"

export default abstract class VoiceCommand extends Command {
    abstract botMustBeInSameVoiceChannel(): boolean

    abstract botMustBeAlreadyInVoiceChannel(): boolean

    abstract userMustBeInVoiceChannel(): boolean

    protected botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return false
    }

    protected preExecute(context: GuildContext, message?: Message): Promise<any> {
        const status = this.checkBotVoiceChannelStatus(context, message)
        if (status == Status.READY) {
            return Promise.resolve()
        }
        if (status == Status.NEEDS_JOIN) {
            if (this.botShouldNotJoinVoiceChannelIfNotReady()) {
                return Promise.reject()
            } else {
                return this.joinVoiceChannel(context, message)
            }
        }
        return Promise.reject()
    }

    protected checkBotVoiceChannelStatus(context: GuildContext, message?: Message): Status {
        if (!message) {
            return Status.READY // Implies already in a voice channel
        }
        const userVoiceChannel = message.member.voice.channel
        const botVoiceChannel = message.client.voice.connections.has(message.guild.id) ?
            message.client.voice.connections.get(message.guild.id).channel : null
        if (this.userMustBeInVoiceChannel() && !userVoiceChannel) {
            console.log(`${message.member.displayName} is not in voice channel`)
            return Status.INVALID
        }
        if (this.botMustBeAlreadyInVoiceChannel() && !botVoiceChannel) {
            console.log(`Bot is not already in voice channel`)
            return Status.INVALID
        }
        if (this.botMustBeInSameVoiceChannel() && userVoiceChannel.id != botVoiceChannel.id) {
            console.log(`Bot is not in same voice channel ${userVoiceChannel.id} != ${botVoiceChannel.id}`)
            return Status.INVALID
        }
        if (isAlreadyInVoiceChannel(context, userVoiceChannel)) {
            return Status.READY
        }
        return Status.NEEDS_JOIN
    }

    protected async joinVoiceChannel(context: GuildContext, message?: Message): Promise<any> {
        try {
            await context.getProvider().getVoiceConnectionHandler().joinVoiceChannel(message.member.voice.channel)
        } catch {
            return Promise.reject()
        }
        return Promise.resolve()
    }
}

export enum Status {
    READY,
    NEEDS_JOIN,
    INVALID
}

function isAlreadyInVoiceChannel(context: GuildContext, voiceChannel: VoiceChannel): boolean {
    return voiceChannel.id == context.getVoiceConnection()?.channel?.id
}