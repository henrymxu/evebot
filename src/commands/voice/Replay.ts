import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import VoiceCommand from "../../voice/VoiceCommand"
import {ArgumentType, CommandOptions} from "../Command"

export default class ReplayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Replay',
        keywords: ['replay'],
        group: 'voice',
        descriptions: ['Replay what a user has said'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to replay',
                required: true,
                type: ArgumentType.USER
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of replay (seconds)',
                required: false,
                type: ArgumentType.INTEGER,
                default: 10,
                validate: (context, arg) => parseInt(arg) > 0 && parseInt(arg) <= 20
            },
        ],
        examples: 'clip @Eve -l 8'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user: User = args.get('user')
        const voiceStream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
        if (!voiceStream) {
            console.log(`No audioStream for ${user.tag}`)
            context.getProvider().getResponder().error('No listening stream registered for user', message)
            return
        }
        context.getProvider().getInterruptService().playVoiceStream(voiceStream.getRecordedStream(args.get('length')))
    }

    botMustBeAlreadyInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return false;
    }

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
