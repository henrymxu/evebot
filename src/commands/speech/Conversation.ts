import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import VoiceCommand from '../../voice/VoiceCommand';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Acknowledgement} from '../../communication/Responder';
import {Logger} from '../../Logger';
import {LanguageMap} from '../../LanguageDictionary';

export default class ConverseCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Converse',
        keywords: ['converse'],
        group: 'speech',
        descriptions: ['Converse with the bot. The prompt must be in your chosen language (conversemode)'],
        arguments: [
            {
                key: 'prompt',
                description:
                    'Message the bot should reply to (must be in your chosen language) (must be between than 5 and 500 characters)',
                required: true,
                type: ArgumentType.STRING,
                validate: (context, arg) => {
                    return arg.length < 500 && arg.length >= 5;
                },
            },
        ],
        throttleRate: {count: 3, seconds: 60},
        examples: ['converse how was your day?', 'converse お元気ですか'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const textGenerator = context.getSynthesisDependencyProvider().getTextGenerator();
        if (!textGenerator) {
            throw new CommandExecutionError('No Conversation Generator Registered');
        }
        const prompt = `${args.get('prompt')}`;
        return textGenerator.asyncGenerateReplyFromMessage(prompt).then(result => {
            Logger.d('Generated Conversation Response', result.message.trim(), context);
            const speechGenerator = context.getVoiceDependencyProvider().getSpeechGenerator();
            if (!speechGenerator) {
                throw new CommandExecutionError('No SpeechGenerator Registered');
            }
            const voice = LanguageMap.get(context.getConfig().getUserVoiceLanguage(source.id))!.voice;
            return speechGenerator.asyncGenerateSpeechFromText(result.message, voice).then(result => {
                context.getProvider().getInterruptService().playOpusStream(result.stream);
                return Acknowledgement.OK;
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
        return true;
    }
}
