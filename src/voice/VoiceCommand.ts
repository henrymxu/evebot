import {Command} from "../commands/Command"
import {Message, VoiceChannel} from "discord.js"
import {GuildContext} from "../guild/Context"
import {Logger} from "../Logger"

export default abstract class VoiceCommand extends Command {
    abstract botMustBeInTheSameVoiceChannel(): boolean

    abstract botMustAlreadyBeInVoiceChannel(): boolean

    abstract userMustBeInVoiceChannel(): boolean

    protected botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return false
    }

    protected preExecute(context: GuildContext, message?: Message): Promise<void> {
        const status = this.checkBotVoiceChannelStatus(context, message)
        if (status == Status.READY) {
            return Promise.resolve()
        }
        if (status == Status.NEEDS_JOIN) {
            if (this.botShouldNotJoinVoiceChannelIfNotReady()) {
                return Promise.reject('Bot needs to be in the voice channel before this command is called')
            } else {
                return this.joinVoiceChannel(context, message)
            }
        }
        return Promise.reject('Bot is not ready to perform this command')
    }

    protected checkBotVoiceChannelStatus(context: GuildContext, message?: Message): Status {
        if (!message) {
            return Status.READY // Implies already in a voice channel
        }
        const guildID = message.guild?.id
        if (!guildID) {
            return Status.INVALID
        }
        const userVoiceChannel = message.member?.voice.channel || undefined
        const botVoiceChannel = message.client?.voice?.connections.get(guildID)?.channel
        if (this.userMustBeInVoiceChannel() && !userVoiceChannel) {
            Logger.w(VoiceCommand.name, `${message.member?.user.tag} was not in voice channel`, context)
            return Status.INVALID
        }
        if (this.botMustAlreadyBeInVoiceChannel() && !botVoiceChannel) {
            Logger.w(VoiceCommand.name, `Bot was not already in voice channel`, context)
            return Status.INVALID
        }
        if (this.botMustBeInTheSameVoiceChannel()) {
            if (!userVoiceChannel || !botVoiceChannel || userVoiceChannel.id != botVoiceChannel.id) {
                Logger.w(VoiceCommand.name,
                    `Bot [${botVoiceChannel?.name}] was not in same voice channel as User [${userVoiceChannel?.name}]`, context)
                return Status.INVALID
            }
        }
        if (isAlreadyInVoiceChannel(context, userVoiceChannel)) {
            return Status.READY
        }
        return Status.NEEDS_JOIN
    }

    protected async joinVoiceChannel(context: GuildContext, message?: Message): Promise<void> {
        try {
            await context.getProvider().getVoiceConnectionHandler().joinVoiceChannel(message?.member?.voice?.channel)
        } catch {
            return Promise.reject('Error joining voice channel')
        }
        return Promise.resolve()
    }
}

export enum Status {
    READY,
    NEEDS_JOIN,
    INVALID
}

function isAlreadyInVoiceChannel(context: GuildContext, voiceChannel: VoiceChannel | undefined): boolean {
    return voiceChannel !== undefined && voiceChannel?.id === context.getVoiceConnection()?.channel?.id
}