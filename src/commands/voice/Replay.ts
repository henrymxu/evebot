import {Message, MessageAttachment, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import VoiceCommand from '../../voice/VoiceCommand'
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions, FileType} from '../Command'
import {FileUtils} from '../../utils/FileUtils'
import {AudioUtils} from '../../utils/AudioUtils'
import {Acknowledgement} from '../../communication/Responder'

export default class ReplayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Replay',
        keywords: ['replay'],
        group: 'voice',
        descriptions: ['Replay from an uploaded file or url'],
        arguments: [
            {
                key: 'url',
                description: 'URL of file you would like to replay',
                required: false,
                type: ArgumentType.STRING
            },
        ],
        file: FileType.AUDIO,
        examples: ['replay']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let url = ''
        if (args.get('file')) {
            const messageAttachment: MessageAttachment = args.get('file')
            url = messageAttachment.url
        } else if (args.get('url')) {
            url = args.get('url')
        } else {
            throw new CommandExecutionError('No file provided for replay')
        }
        return FileUtils.downloadFile(url).then((result) => {
            // TODO: check file types?
            if (url.endsWith('mp3')) {
                context.getProvider().getInterruptService().playOpusStream(AudioUtils.convertMp3StreamToOpusStream(result))
            } else {
                context.getProvider().getInterruptService().playUnknownStream(result)
            }
            return Acknowledgement.OK
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
