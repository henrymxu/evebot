import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import VoiceCommand from '../../voice/VoiceCommand'
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command'
import {CachedStream} from '../../voice/CachedStream'
import {Acknowledgement} from '../../communication/Responder'

export default class ReciteCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Recite',
        keywords: ['recite'],
        group: 'voice',
        descriptions: ['Recite what was just said!  If no user is provided, the whole channel is recited.'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to recite',
                required: false,
                type: ArgumentType.USER
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of recitation (seconds)',
                required: false,
                type: ArgumentType.INTEGER,
                default: 10,
                validate: (context: GuildContext, arg: any) => parseInt(arg) > 0 && parseInt(arg) <= 20
            },
            {
                key: 'transcribe',
                flag: 't',
                description: 'Transcribe as well',
                required: false,
                type: ArgumentType.FLAG,
            }
        ],
        examples: ['recite', 'recite @Eve -l 8']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let stream: CachedStream | undefined
        const user: User = args.get('user')
        if (user) {
            stream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
            if (!stream) {
                throw new CommandExecutionError(`No listening stream registered for user ${user}`)
            }
        } else {
            stream = context.getProvider().getVoiceConnectionHandler().getMergedVoiceStream()
        }
        const audioStream = stream.getCachedStream(args.get('length'))
        context.getProvider().getInterruptService().playRawStream(audioStream)
        if (user && args.get('transcribe')) {
            const speechRecognizer = context.getVoiceDependencyProvider().getSpeechRecognizer()
            if (!speechRecognizer) {
                throw new CommandExecutionError('No SpeechRecognizer Registered')
            }
            return speechRecognizer.recognizeTextFromSpeech(audioStream).then((transcribed) => {
                const transcribedMessage = `${user} said ${transcribed}`
                return [{content: transcribedMessage, message: message}, 'surveillance']
            })
        } else {
            return Promise.resolve(Acknowledgement.OK)
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
        return true
    }
}
