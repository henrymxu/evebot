import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import VoiceCommand from "../../voice/VoiceCommand"
import {ArgumentType, CommandOptions} from "../Command"
import {MessageGenerator} from "../../communication/MessageGenerator"

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
                type: ArgumentType.user
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of replay (seconds)',
                required: false,
                type: ArgumentType.integer,
                default: 10,
                validate: val => parseInt(val) > 0 && parseInt(val) <= 20
            },
        ],
        example: 'clip @Eve -l 8'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user: User = args.get('user')
        const voiceStream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
        if (!voiceStream) {
            console.log(`No audioStream for ${user.tag}`)
            context.getProvider().getResponder().send({content: MessageGenerator.createErrorEmbed('No listening stream registered for user'), message: message})
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
