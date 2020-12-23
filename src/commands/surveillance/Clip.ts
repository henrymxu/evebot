import {Message, User} from 'discord.js';
import {AudioUtils} from '../../utils/AudioUtils';
import VoiceCommand from '../../voice/VoiceCommand';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {MessageGenerator} from '../../communication/MessageGenerator';
import {CachingStream} from '../../utils/CachingStream';
import {Acknowledgement} from '../../communication/Responder';

export default class ClipCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Clip',
        keywords: ['clip'],
        group: 'surveillance',
        descriptions: ['Create a clip of what was just said!  If no user is provided, the whole channel is clipped.'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to clip',
                required: false,
                type: ArgumentType.USER,
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Length of clip (seconds)',
                required: false,
                type: ArgumentType.INTEGER,
                default: 10,
                validate: (context: GuildContext, arg: any) => parseInt(arg) > 0 && parseInt(arg) <= 20,
            },
            {
                key: 'caption',
                flag: 'c',
                description: 'Title of clip',
                required: false,
                type: ArgumentType.STRING,
            },
        ],
        examples: ['clip', 'clip @Eve -l 5 -c Eve Funny Clip'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let stream: CachingStream | undefined;
        let author: string;
        let embedMessageContents: string;
        const user: User = args.get('user');
        if (user) {
            author = user.tag;
            embedMessageContents = `Recording from [${user}]`;
            stream = context.getProvider().getVoiceConnectionHandler().getVoiceStreamForUser(user);
            if (!stream) {
                throw new CommandExecutionError(
                    `No listening stream registered for ${user.tag}}`,
                    Acknowledgement.NEGATIVE
                );
            }
        } else {
            author = context.getGuild().name;
            embedMessageContents = `Recording from ${context.getVoiceConnection()?.channel?.name}`;
            if (context.getProvider().getVoiceConnectionHandler().getVoiceStreams().size === 0) {
                const channelName = context.getVoiceConnection()?.channel.name;
                throw new CommandExecutionError(
                    `No listening streams registered in ${channelName}`,
                    Acknowledgement.NEGATIVE
                );
            }
            stream = context.getProvider().getVoiceConnectionHandler().getMergedVoiceStream();
        }
        const caption = args.get('caption') || `Clip From ${author}`;
        context.getProvider().getResponder().startTyping(message);
        return AudioUtils.convertBufferToMp3Buffer(stream.getCachedBuffer(args.get('length')), caption, author)
            .then(buffer => {
                const embedMessage = MessageGenerator.createBasicEmbed(embedMessageContents);
                const embed = MessageGenerator.attachFileToEmbed(embedMessage, buffer, `${caption}.mp3`);
                context.getProvider().getResponder().stopTyping(message);
                return [{content: embed, message: message}, Acknowledgement.SURVEILLANCE];
            })
            .catch(err => {
                throw new CommandExecutionError(
                    `There was an error converting Wav Buffer to MP3 Buffer, reason: ${err.toString()}`
                );
            })
            .finally(() => {
                context.getProvider().getResponder().stopTyping(message);
            });
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

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true;
    }
}
