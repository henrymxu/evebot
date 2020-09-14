import {Message, User} from "discord.js"
import {AudioUtils} from "../../utils/AudioUtils"
import VoiceCommand from "../../voice/VoiceCommand"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, CommandOptions} from "../Command"
import {MessageGenerator} from "../../communication/MessageGenerator"

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
                type: ArgumentType.user
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of clip (seconds)',
                required: false,
                type: ArgumentType.integer,
                default: 10,
                validate: val => parseInt(val) > 0 && parseInt(val) <= 20
            },
            {
                key: 'caption',
                flag: 'c',
                description: 'Title of clip',
                required: false,
                type: ArgumentType.string,
                default: 'Clip'
            }
        ],
        example: 'clip @Eve -l 5 -c "Eve Funny Clip"'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user: User = args.get('user')
        const voiceStream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user)
        if (voiceStream == null) {
            console.log(`No audioStream for ${user.tag} / ${user.id}`)
            context.getProvider().getResponder().send({content: MessageGenerator.createErrorEmbed('No listening stream registered for user'), message: message})
            return
        }
        context.getProvider().getResponder().startTyping(message)
        AudioUtils.convertBufferToMp3Buffer(voiceStream.getBuffer(args.get('length')), args.get('caption'), user.tag).then((buffer) => {
            const embed = MessageGenerator.attachFileToEmbed(MessageGenerator.createBasicEmbed(`Recording from [<@${user.id}>]`),
                buffer, `${args.get('caption')}.mp3`)
            context.getProvider().getResponder().send({content: embed, message: message}).then((results) => {
                context.getProvider().getResponder().stopTyping(message)
            })
        }).catch((err) => {
            console.log(`There was an error converting Wav Buffer to MP3 Buffer: ${err.toString()}`)
        })
    }

    botMustBeAlreadyInVoiceChannel(): boolean {
        return true
    }

    botMustBeInSameVoiceChannel(): boolean {
        return true
    }

    userMustBeInVoiceChannel(): boolean {
        return true
    }

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
