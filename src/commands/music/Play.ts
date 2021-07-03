import VoiceCommand from '../../voice/VoiceCommand';
import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {QueryMode} from '../../music/DJ';
import {Acknowledgement} from '../../communication/Responder';
import {RadioMode} from '../../music/radio/Radio';

export default class PlayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Play',
        keywords: ['play', 'album', 'playlist'],
        group: 'music',
        descriptions: [
            'Search and play a song or use a link from Youtube / Spotify',
            'Search and play an album',
            'Search and play a playlist',
        ],
        arguments: [
            {
                key: 'query',
                description: 'Name of song / album / playlist or link from Youtube / Spotify',
                required: true,
                type: ArgumentType.STRING,
            },
            {
                key: 'radio',
                flag: 'radio',
                description: 'Request a radio to start after current queue is completed is using the track as a seed!',
                required: false,
                type: ArgumentType.FLAG,
            },
            {
                key: 'shuffle',
                flag: 's',
                description:
                    'Shuffle the playlist / album being queued.  Use the shuffle command to shuffle the current queue',
                required: false,
                type: ArgumentType.FLAG,
            },
        ],
        examples: ['play Blank Space', 'play Wildest Dreams -radio', 'album 1989 -s', 'playlist christmas songs'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let mode: QueryMode = QueryMode.Play;
        mode = args.get('keyword') ? (args.get('keyword') as string as QueryMode) : mode;
        context.getProvider().getResponder().startTyping(message);
        return context
            .getProvider()
            .getDJ()
            .request(mode, args.get('query'), args.get('shuffle'), source.id, message)
            .then(() => {
                if (args.get('radio') && args.get('keyword') === 'play') {
                    context
                        .getProvider()
                        .getDJ()
                        .requestRadio(
                            {
                                artists: [],
                                genres: [],
                                tracks: [args.get('query')],
                                length: 10,
                                mode: RadioMode.RELATED,
                            },
                            message
                        )
                        .catch(err => {
                            this.onExecutedFailed(context, new CommandExecutionError(err.message));
                        });
                }
                return Acknowledgement.MUSIC;
            })
            .catch((err: Error) => {
                throw new CommandExecutionError(err.message, Acknowledgement.NEGATIVE);
            })
            .finally(() => {
                context.getProvider().getResponder().stopTyping(message);
            });
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
