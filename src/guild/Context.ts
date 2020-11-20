import {Guild, TextChannel, VoiceConnection} from "discord.js"
import {Config} from "./Config"
import {VoiceDependencyProvider, VoiceDependencyProviderBuilder} from "../voice/DependencyProvider"
import GuildProvider from "./Provider"
import {GuildUtils} from "../utils/GuildUtils"
import {GlobalContext} from "../GlobalContext"
import {Logger} from "../Logger"

export class GuildContext {
    private voiceConnection: VoiceConnection | undefined
    private textChannel: TextChannel | undefined

    private readonly voiceDependencyProvider: VoiceDependencyProvider
    private readonly guildProvider: GuildProvider

    private readonly id: string
    private readonly config: Config

    constructor(id: string) {
        this.id = id
        this.guildProvider = new GuildProvider(this)
        this.config = new Config(id)
        this.voiceDependencyProvider = VoiceDependencyProviderBuilder.build(this.config)
    }

    async initialize() {
        await this.config.load()
    }

    setVoiceConnection(voiceConnection: VoiceConnection | undefined) {
        this.voiceConnection = voiceConnection
    }

    setTextChannel(textChannel: TextChannel) {
        this.textChannel = textChannel
    }

    getVoiceConnection(): VoiceConnection | undefined {
        return this.voiceConnection
    }

    getTextChannel(): TextChannel | undefined {
        return this.textChannel ? this.textChannel : findDefaultTextChannel(this)
    }

    getPrefix(): string {
        return this.getConfig().getPrefix()
    }

    getConfig(): Config {
        return this.config
    }

    getGuild(): Guild {
        return GlobalContext.getClient().guilds.resolve(this.id)!
    }

    getVoiceDependencyProvider(): VoiceDependencyProvider {
        return this.voiceDependencyProvider
    }

    getProvider(): GuildProvider {
        return this.guildProvider
    }
}

export function findDefaultTextChannel(context: GuildContext): TextChannel | undefined {
    const desiredChannelId = context.getConfig().getDefaultTextChannel()
    let textChannel = GuildUtils.findTextChannelByID(context, desiredChannelId)
    if (!textChannel) {
        // @ts-ignore
        textChannel = guild.channels.cache.filter(channel => channel.type === 'text').first()
    }
    if (!textChannel) {
        Logger.w("FindDefaultTextChannel", `${context.getGuild()?.name} does not have defaultTextChannel`, context)
    }
    return textChannel
}