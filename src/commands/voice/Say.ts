import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import VoiceCommand from "../../voice/VoiceCommand"
import {ArgumentType, CommandOptions} from "../Command"

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
                type: ArgumentType.string,
            },
            {
                key: 'voice',
                flag: 'v',
                description: 'Voice the bot should use. Microsoft: (https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices)',
                required: false,
                type: ArgumentType.string,
                validate: val => true
            }
        ],
        example: 'say hello my name is eve -v en-IN-Heera-Apollo'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        context.getVoiceDependencyProvider().getSpeechGenerator().asyncGenerateSpeechFromText(args.get('message'), args.get('voice')).then((stream) => {
            context.getProvider().getInterruptService().playTTSStream(stream)
            context.getProvider().getResponder().acknowledge(0, message)
        })
    }

    botMustBeAlreadyInVoiceChannel(): boolean {
        return false;
    }

    botMustBeInSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }
}
