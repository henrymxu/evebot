import {Guild, TextChannel, User, VoiceConnection} from "discord.js"
import {Config, GuildConfig} from "../Config"
import {VoiceDependencyProvider, VoiceDependencyProviderBuilder} from "../voice/DependencyProvider"
import GuildProvider from "./Provider"
import {GuildUtils} from "../utils/GuildUtils"

export class GuildContext {
    private voiceConnection: VoiceConnection
    private textChannel: TextChannel

    private readonly voiceDependencyProvider: VoiceDependencyProvider
    private readonly guildProvider: GuildProvider

    private readonly id: string

    private readonly config: Config

    constructor(id: string) {
        this.id = id
        this.voiceDependencyProvider = VoiceDependencyProviderBuilder.build(null)
        this.guildProvider = new GuildProvider(this)
        this.config = GuildConfig.loadConfig(id)
    }

    setVoiceConnection(voiceConnection: VoiceConnection) {
        this.voiceConnection = voiceConnection
    }

    setTextChannel(textChannel: TextChannel) {
        this.textChannel = textChannel
    }

    getVoiceConnection(): VoiceConnection {
        return this.voiceConnection
    }

    getTextChannel(): TextChannel {
        return this.textChannel ? this.textChannel : findDefaultTextChannel(this)
    }

    getPrefix(): string {
        return this.getConfig().getPrefix()
    }

    getConfig(): Config {
        return this.config
    }

    getGuild(): Guild {
        return this.textChannel ? this.textChannel.guild : this.voiceConnection.channel.guild
    }

    getVoiceDependencyProvider(): VoiceDependencyProvider {
        return this.voiceDependencyProvider
    }

    getProvider(): GuildProvider {
        return this.guildProvider
    }
}

export function findDefaultTextChannel(context: GuildContext): TextChannel {
    const desiredChannelId = context.getConfig()["defaultTextChannel"]
    let textChannel = GuildUtils.findTextChannelByID(context, desiredChannelId)
    if (!textChannel) {
        // @ts-ignore
        textChannel = guild.channels.cache.filter(channel => channel.type === 'text').first()
    }
    if (!textChannel) {
        console.log(`No text channel found for ${context.getGuild().name}`)
    }
    return textChannel
}