import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import VoiceCommand from '../../voice/VoiceCommand'
import {ArgumentType, CommandOptions} from '../Command'
import {Logger} from '../../Logger'
import {GuildUtils} from '../../utils/GuildUtils'
import {CachedStream} from '../../voice/CachedStream'

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

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        let stream: CachedStream | undefined
        const user: User = args.get('user')
        if (user) {
            stream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
            if (!stream) {
                Logger.w(ReciteCommand.name, `No audioStream for ${user.tag} [${user.id}]`, context)
                context.getProvider().getResponder().error('No listening stream registered for user', message)
                return
            }
        } else {
            stream = context.getProvider().getVoiceConnectionHandler().getMergedVoiceStream()
        }
        const audioStream = stream.getCachedStream(args.get('length'))
        context.getProvider().getInterruptService().playRawStream(audioStream)
        if (user && args.get('transcribe')) {
            const speechRecognizer = context.getVoiceDependencyProvider().getSpeechRecognizer()
            if (!speechRecognizer) {
                Logger.e(ReciteCommand.name, 'No SpeechRecognizer Registered', context)
                return
            }
            speechRecognizer.recognizeTextFromSpeech(audioStream).then((transcribed) => {
                const transcribedMessage = `${user} said ${transcribed}`
                context.getProvider().getResponder().send({content: transcribedMessage, message: message})
            })
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
