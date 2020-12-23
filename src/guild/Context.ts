import {Guild, TextChannel, VoiceConnection} from 'discord.js';
import {ConfigImplementation} from './ConfigImplementation';
import {VoiceDependencyProvider, VoiceDependencyProviderBuilder} from '../voice/DependencyProvider';
import GuildProvider from './Provider';
import {GuildUtils} from '../utils/GuildUtils';
import {GlobalContext} from '../GlobalContext';
import {Logger} from '../Logger';
import {Config} from './Config';

export class GuildContext {
    private voiceConnection: VoiceConnection | undefined;
    private textChannel: TextChannel | undefined;

    private readonly voiceDependencyProvider: VoiceDependencyProvider;
    private readonly guildProvider: GuildProvider;

    private readonly id: string;
    private readonly config: Config;

    constructor(id: string) {
        this.id = id;
        this.guildProvider = new GuildProvider(this);
        this.config = new ConfigImplementation(id);
        this.voiceDependencyProvider = VoiceDependencyProviderBuilder.build(this.config);
    }

    async initialize() {
        await this.config.load();
    }

    setVoiceConnection(voiceConnection: VoiceConnection | undefined) {
        this.voiceConnection = voiceConnection;
    }

    setTextChannel(textChannel: TextChannel) {
        this.textChannel = textChannel;
    }

    getVoiceConnection(): VoiceConnection | undefined {
        return this.voiceConnection;
    }

    getTextChannel(): TextChannel | undefined {
        return this.textChannel ? this.textChannel : findDefaultTextChannel(this);
    }

    getPrefix(): string {
        return this.getConfig().getPrefix();
    }

    getConfig(): Config {
        return this.config;
    }

    getGuild(): Guild {
        // TODO: Check if this is actually okay (i.e when bot is added to a new guild, does this still work?)
        return GlobalContext.getClient().guilds.resolve(this.id)!;
    }

    getVoiceDependencyProvider(): VoiceDependencyProvider {
        return this.voiceDependencyProvider;
    }

    getProvider(): GuildProvider {
        return this.guildProvider;
    }
}

export function findDefaultTextChannel(context: GuildContext): TextChannel | undefined {
    const desiredChannelId = context.getConfig().getDefaultTextChannel();
    let textChannel = GuildUtils.findTextChannelByID(context, desiredChannelId);
    if (!textChannel) {
        textChannel = context
            .getGuild()
            .channels.cache.filter(channel => channel.type === 'text')
            .first() as TextChannel;
    }
    if (!textChannel) {
        Logger.w('FindDefaultTextChannel', `${context.getGuild()?.name} does not have defaultTextChannel`, context);
    }
    return textChannel;
}
