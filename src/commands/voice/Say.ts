import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import VoiceCommand, {Status} from "../../voice/VoiceCommand"
import {ArgumentType, CommandOptions} from "../Command"
import {Logger} from "../../Logger"

export default class SayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Say',
        keywords: ['say'],
        group: 'voice',
        descriptions: ['Say something with the bot'],
        arguments: [
            {
                key: 'message',
                description: 'Message the bot should say',
                required: true,
                type: ArgumentType.STRING,
            },
            {
                key: 'voice',
                flag: 'v',
                description: 'Voice the bot should use. Microsoft: ' +
                    '(https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices)',
                required: false,
                type: ArgumentType.STRING
            }
        ],
        throttleRate: {count: 3, seconds: 60},
        examples: ['say hello my name is eve -v en-IN-Heera-Apollo']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const speechGenerator = context.getVoiceDependencyProvider().getSpeechGenerator()
        if (!speechGenerator) {
            Logger.e(SayCommand.name, 'No SpeechGenerator Registered', context)
            return
        }
        context.getVoiceDependencyProvider().getSpeechGenerator()!.asyncGenerateSpeechFromText(args.get('message'), args.get('voice'))
            .then((result) => {
                context.getProvider().getInterruptService().playOpusStream(result.stream)
                context.getProvider().getResponder().acknowledge(0, message)
            })
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
