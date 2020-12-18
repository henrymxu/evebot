import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, CommandAck, CommandOptions} from '../Command'
import {Acknowledgement} from '../../communication/Responder'

export default class SkipCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Skip',
        keywords: ['skip'],
        group: 'music',
        descriptions: ['Skip the current song'],
        arguments: [
            {
                key: 'count',
                description: 'Number of songs to skip',
                required: false,
                default: 1,
                validate: ((context, arg) => arg > 0),
                type: ArgumentType.NUMBER
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        return Promise.resolve(context.getProvider().getDJ().skip(args.get('count') as number)
            ? Acknowledgement.OK : Acknowledgement.UNNECESSARY)
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return true;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }

    protected botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
