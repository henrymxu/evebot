import {Message, MessageEmbed, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import VoiceCommand from '../../voice/VoiceCommand';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {CachingStream} from '../../utils/CachingStream';
import {Acknowledgement} from '../../communication/Responder';
import {MessageGenerator} from '../../communication/MessageGenerator';

export default class ReciteCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Recite',
        keywords: ['recite'],
        group: 'surveillance',
        descriptions: ['Recite what was just said!  If no user is provided, the whole channel is recited.'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to recite',
                required: false,
                type: ArgumentType.USER,
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of recitation (seconds)',
                required: false,
                type: ArgumentType.INTEGER,
                default: 10,
                validate: (context: GuildContext, arg: any) => parseInt(arg) > 0 && parseInt(arg) <= 20,
            },
            {
                key: 'transcribe',
                flag: 't',
                description: 'Transcribe as well',
                required: false,
                type: ArgumentType.FLAG,
            },
        ],
        examples: ['recite', 'recite @Eve -l 8'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let stream: CachingStream | undefined;
        const user: User = args.get('user');
        if (user) {
            stream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user);
            if (!stream) {
                throw new CommandExecutionError(`No listening stream registered for ${user.tag}`);
            }
        } else {
            stream = context.getProvider().getVoiceConnectionHandler().getMergedVoiceStream();
        }
        const audioStream = stream.getCachedStream(args.get('length'));
        context.getProvider().getInterruptService().playRawStream(audioStream);
        if (user && args.get('transcribe')) {
            const speechRecognizer = context.getVoiceDependencyProvider().getSpeechRecognizer();
            if (!speechRecognizer) {
                throw new CommandExecutionError('No SpeechRecognizer Registered', Acknowledgement.NEGATIVE);
            }
            return speechRecognizer.recognizeTextFromSpeech(audioStream).then(transcribed => {
                const transcribedMessage = createTranscriptionEmbed(user, transcribed);
                return [{content: transcribedMessage, message: message}, Acknowledgement.SURVEILLANCE];
            });
        } else {
            return Promise.resolve(Acknowledgement.OK);
        }
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return false;
    }

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true;
    }
}

function createTranscriptionEmbed(user: User, message: string): MessageEmbed {
    const embed = MessageGenerator.getBaseEmbed();
    embed.author = {
        name: user.tag,
        iconURL: user.avatarURL() || user.defaultAvatarURL,
    };
    embed.timestamp = Date.now();
    embed.description = `\`\`\`${message}\`\`\``;
    return embed;
}
