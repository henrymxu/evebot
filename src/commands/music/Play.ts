import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, CommandAck, CommandOptions} from '../Command'
import {QueryMode} from '../../music/DJ'
import {Acknowledgement} from '../../communication/Responder'
import {RadioMode} from '../../music/radio/Radio'

export default class PlayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Play',
        keywords: ['play', 'album'],
        group: 'music',
        descriptions: ['Play a song or playlist', 'Play an album'],
        arguments: [
            {
                key: 'query',
                description: 'Song: Name or url of song | Album: Spotify url',
                required: true,
                type: ArgumentType.STRING
            },
            {
                key: 'radio',
                flag: 'radio',
                description: 'Request a radio to start after current queue is completed is using the track as a seed!',
                required: false,
                type: ArgumentType.FLAG
            }
        ],
        examples: ['play Blank Space', 'play Wildest Dreams -radio']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let mode: QueryMode = QueryMode.Play
        if (args.get('keyword') === 'album') {
            mode = QueryMode.Album
        }
        context.getProvider().getResponder().startTyping(message)
        return context.getProvider().getDJ().request(mode, args.get('query'), source.id, message).then(() => {
            if (args.get('radio') && args.get('keyword') === 'play') {
                context.getProvider().getDJ().requestRadio({
                    artists: [],
                    genres: [],
                    tracks: [args.get('query')],
                    length: 10,
                    mode: RadioMode.RELATED
                }, message)
            }
            return Acknowledgement.MUSIC
        }).finally(() => {
            context.getProvider().getResponder().stopTyping(message)
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
