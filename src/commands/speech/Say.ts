import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import VoiceCommand from '../../voice/VoiceCommand';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Acknowledgement} from '../../communication/Responder';

export default class SayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Say',
        keywords: ['say'],
        group: 'speech',
        descriptions: ['Say something with the bot'],
        arguments: [
            {
                key: 'message',
                description: 'Message the bot should say (must be less than 500 characters)',
                required: true,
                type: ArgumentType.STRING,
                validate: (context, arg) => {
                    return arg.length < 500;
                },
            },
            {
                key: 'voice',
                flag: 'v',
                description:
                    'Voice the bot should use. Microsoft: ' +
                    '(https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices)',
                required: false,
                type: ArgumentType.STRING,
            },
        ],
        throttleRate: {count: 3, seconds: 60},
        examples: ['say hello my name is eve -v en-IN-Heera-Apollo'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const speechGenerator = context.getVoiceDependencyProvider().getSpeechGenerator();
        if (!speechGenerator) {
            throw new CommandExecutionError('No SpeechGenerator Registered');
        }
        return speechGenerator.asyncGenerateSpeechFromText(args.get('message'), args.get('voice')).then(result => {
            context.getProvider().getInterruptService().playOpusStream(result.stream);
            return Acknowledgement.OK;
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
