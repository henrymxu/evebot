import {Message, User} from "discord.js"
import {AudioUtils} from "../../utils/AudioUtils"
import VoiceCommand from "../../voice/VoiceCommand"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, CommandOptions} from "../Command"
import {MessageGenerator} from "../../communication/MessageGenerator"
import {GuildUtils} from "../../utils/GuildUtils"
import {Logger} from "../../Logger"

export default class ClipCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Clip',
        keywords: ['clip'],
        group: 'voice',
        descriptions: ['Create a clip of what a user has said'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to clip',
                required: true,
                type: ArgumentType.USER
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of clip (seconds)',
                required: false,
                type: ArgumentType.INTEGER,
                default: 10,
                validate: (context: GuildContext, arg: any) => parseInt(arg) > 0 && parseInt(arg) <= 20
            },
            {
                key: 'caption',
                flag: 'c',
                description: 'Title of clip',
                required: false,
                type: ArgumentType.STRING,
                default: 'Clip'
            }
        ],
        examples: ['clip @Eve -l 5 -c Eve Funny Clip']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user: User = args.get('user')
        const voiceStream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
        if (!voiceStream) {
            Logger.w(ClipCommand.name, `No audioStream for ${user.tag} [${user.id}]`, context)
            context.getProvider().getResponder().error('No listening stream registered for user', message)
            return
        }
        context.getProvider().getResponder().startTyping(message)
        AudioUtils.convertBufferToMp3Buffer(voiceStream.getBuffer(args.get('length')), args.get('caption'), user.tag)
            .then((buffer) => {
                const embedMessage = MessageGenerator
                    .createBasicEmbed(`Recording from [${GuildUtils.createUserMentionString(user.id)}]`)
                const embed = MessageGenerator.attachFileToEmbed(embedMessage, buffer, `${args.get('caption')}.mp3`)
                context.getProvider().getResponder().send({content: embed, message: message}).then((results) => {
                    context.getProvider().getResponder().stopTyping(message)})
            }).catch((err) => {
                Logger.e(ClipCommand.name, `There was an error converting Wav Buffer to MP3 Buffer, reason: ${err.toString()}`, context)
            })
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return true
    }

    userMustBeInVoiceChannel(): boolean {
        return true
    }

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
