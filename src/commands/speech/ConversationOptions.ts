import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, Command, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Acknowledgement} from '../../communication/Responder';
import {LanguageMap} from '../../LanguageDictionary';

export default class ConversationOptionsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Enable Conversation Mode',
        keywords: ['conversemode', 'chat', 'muted'],
        group: 'speech',
        descriptions: [
            'Conversation mode options. Enabling Conversation Mode will make E.V.E bot respond to your voice commands in a conversation format instead of a command. Conversation prompts must be spoken in the same language as the language set by the user (language)',
            'Shortcut for enabling converse mode with your previous language',
            'Shortcut for disabling converse mode',
        ],
        arguments: [
            {
                key: 'language',
                description: 'Language you wish to converse in (must be in region code format)',
                required: false,
                type: ArgumentType.STRING,
                validate: (context, arg) => {
                    return LanguageMap.has(arg);
                },
            },
            {
                key: 'disable',
                flag: 'd',
                description: 'Disable conversation mode. Voice commands will now trigger actual commands again',
                required: false,
                type: ArgumentType.FLAG,
            },
            {
                key: 'list',
                flag: 'l',
                description: 'List your current conversation language',
                required: false,
                type: ArgumentType.FLAG,
            },
        ],
        examples: ['conversemode ja-JP', 'conversemode -d', 'conversemode -l', 'chat', 'muted'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        if (context.getConfig().isUserVoiceOptedOut(source.id)) {
            throw new CommandExecutionError('Must be opted into voice for this feature to work! (voiceoptin)');
        }

        function disable() {
            context.getConfig().setUserInConversationMode(source.id, false);
        }

        function enable() {
            context.getConfig().setUserInConversationMode(source.id, true);
            if (args.get('language')) {
                context.getConfig().setUserVoiceLanguage(source.id, args.get('language'));
            } else {
                context.getConfig().setUserVoiceLanguage(source.id, context.getConfig().getLanguage());
            }
        }

        switch (args.get('keyword')) {
            case 'chat':
                enable();
                break;
            case 'muted':
                disable();
                break;
            case 'conversemode':
                if (args.get('list')) {
                    const language = context.getConfig().getUserVoiceLanguage(source.id);
                    return Promise.resolve({
                        content: `Conversation mode language is ${language}`,
                        message: message,
                        removeAfter: 20,
                    });
                } else if (args.get('disable')) {
                    disable();
                } else {
                    if (args.get('language')) {
                        enable();
                    } else {
                        throw new CommandExecutionError(
                            'conversemode requires a language to be provided (use `chat` if you want the default)'
                        );
                    }
                }
        }
        return Promise.resolve(Acknowledgement.UPDATED);
    }
}
