import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {Command, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Acknowledgement} from '../../communication/Responder';

export default class VoiceOptionsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'VoiceOptions',
        keywords: ['voiceoptout', 'voiceoptin'],
        group: 'admin',
        descriptions: [
            'Opt out of E.V.E voice related features (commands / clipping / reciting)',
            'Opt in to E.V.E voice related features (commands / clipping / reciting)',
        ],
        arguments: [],
        examples: ['voiceoptout', 'voiceoptin'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        switch (args.get('keyword')) {
            case 'voiceoptout':
                if (context.getConfig().isUserVoiceOptedOut(source.id)) {
                    throw new CommandExecutionError(`${source.username} is already opted out!`);
                } else {
                    context.getConfig().setUserVoiceOptedOut(source.id, true);
                    context.getProvider().getVoiceConnectionHandler().deleteVoiceStreamForUser(source);
                }
                break;
            case 'voiceoptin':
                if (!context.getConfig().isUserVoiceOptedOut(source.id)) {
                    throw new CommandExecutionError(`${source.username} is already opted in!`);
                }
                context.getConfig().setUserVoiceOptedOut(source.id, false);
                context.getProvider().getVoiceConnectionHandler().addVoiceStreamForUser(source);
        }
        return Promise.resolve(Acknowledgement.UPDATED);
    }
}
