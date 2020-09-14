import {Guild, TextChannel, User, VoiceConnection} from "discord.js"
import {GuildConfig} from "../Config"
import {VoiceDependencyProvider, VoiceDependencyProviderBuilder} from "../voice/DependencyProvider"
import GuildProvider from "./Provider"

export class GuildContext {
    private voiceConnection: VoiceConnection
    private textChannel: TextChannel

    private readonly voiceDependencyProvider: VoiceDependencyProvider
    private readonly guildProvider: GuildProvider

    private readonly id: string

    constructor(id: string) {
        this.id = id
        this.voiceDependencyProvider = VoiceDependencyProviderBuilder.build(null)
        this.guildProvider = new GuildProvider(this)
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
        return this.textChannel
    }

    getPrefix(): string {
        return '?'
    }

    getConfig(): object {
        return GuildConfig.getConfig(this.id)
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

    getUserFromUserID(userID: string): User {
        return this.getGuild().member(userID).user
    }

    static findTextChannel(guild: Guild): TextChannel {
        const desiredChannel = GuildConfig.getCurrentConfigParameter(guild, "defaultTextChannel") as unknown as string
        // @ts-ignore
        let textChannel: TextChannel = guild.channels.cache.filter(channel => channel.type === 'text')
            .find(channel => channel.name == desiredChannel)
        if (!textChannel) {
            // @ts-ignore
            textChannel = guild.channels.cache.filter(channel => channel.type === 'text').first()
        }
        if (!textChannel) {
            console.log(`No text channel found for ${guild.name}`)
        }
        return textChannel
    }
}