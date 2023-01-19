import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import VoiceCommand from '../../voice/VoiceCommand';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Logger} from '../../Logger';
import {LanguageMap} from '../../LanguageDictionary';

export default class TranslateCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Translate',
        keywords: ['translate'],
        group: 'speech',
        descriptions: ['Translate a message'],
        arguments: [
            {
                key: 'message',
                description: 'Message the bot should translate (must be less than 500 characters)',
                required: true,
                type: ArgumentType.STRING,
                validate: (context, arg) => {
                    return arg.length < 500;
                },
            },
        ],
        throttleRate: {count: 3, seconds: 60},
        examples: ['translate how was your day?'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const textGenerator = context.getSynthesisDependencyProvider().getTextGenerator();
        if (!textGenerator) {
            throw new CommandExecutionError('No Conversation Generator Registered');
        }
        const language = LanguageMap.get(context.getConfig().getUserVoiceLanguage(source.id))!;
        const prompt = `Translate this into ${language.language}: ${args.get('message')}`;
        return textGenerator.asyncGenerateReplyFromMessage(prompt, undefined, undefined, false).then(result => {
            Logger.d('Translated Response', result.message.trim(), context);
            const speechGenerator = context.getVoiceDependencyProvider().getSpeechGenerator();
            if (!speechGenerator) {
                throw new CommandExecutionError('No SpeechGenerator Registered');
            }
            return speechGenerator.asyncGenerateSpeechFromText(result.message, language.voice).then(speech => {
                context.getProvider().getInterruptService().playOpusStream(speech.stream);
                return Promise.resolve({
                    content: `${args.get('message')} => ${result.message.trim()}`,
                    message: message,
                    removeAfter: 0,
                });
            });
        });
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return false;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return false;
    }
}
