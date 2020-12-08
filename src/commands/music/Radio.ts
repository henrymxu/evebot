import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, CommandOptions} from '../Command'
import {Radio, RadioContext, RadioMode} from '../../music/radio/Radio'
import {TrackMessageFactory} from '../../communication/TrackMessageGenerator'

export default class RadioCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Radio',
        keywords: ['radio'],
        group: 'music',
        descriptions: ['Start a radio with some parameters'],
        arguments: [
            {
                key: 'artist',
                flag: 'a',
                description: 'Artist name (Radio will use this to determine what artists to choose from)',
                required: false,
                type: ArgumentType.STRING
            },
            {
                key: 'genre',
                flag: 'g',
                description: 'Genre (Radio will use this to determine what genres to choose from)',
                required: false,
                type: ArgumentType.STRING
            },
            {
                key: 'track',
                flag: 't',
                description: 'Track name (Radio will use this to choose from similar tracks)',
                required: false,
                type: ArgumentType.STRING
            },
            {
                key: 'mode',
                flag: 'm',
                description: 'Radio mode (artist, top10, related). Artist is only for the provided artists songs, ' +
                    'Top10 is for artists top10 current song, Related is for any songs related to provided arguments',
                required: false,
                type: ArgumentType.STRING,
                validate: (context: GuildContext, arg: any) => { return arg == 'artist' || arg == 'top10' || arg == 'related'}
            },
            {
                key: 'length',
                flag: 'l',
                description: 'Number of songs in the radio',
                required: false,
                default: 20,
                type: ArgumentType.NUMBER,
                validate: (context: GuildContext, arg: any) => parseInt(arg) > 0 && parseInt(arg) <= 100
            }
        ],
        examples: ['radio -a Taylor Swift -t Closer', 'radio -g pop', 'radio -a Taylor Swift -m top10']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (!args.get('artist') && !args.get('genre') && !args.get('track')) {
            const radioConfiguration = context.getProvider().getDJ().getRadio().getRadioConfiguration()
            if (radioConfiguration) {
                context.getProvider().getResponder().send(
                    {content: TrackMessageFactory.createRadioMessage(context, radioConfiguration),
                        message: message, options: {code: 'Markdown'}}, 30)
            } else {
                context.getProvider().getResponder()
                    .error(`There is no radio playing! Use ${context.getPrefix()}radio command to start one!`, message)
            }
            return
        }
        if (context.getProvider().getDJ().getCurrentSong()) {
            const errMsg = `Cannot start a radio while there are songs playing! Use ${context.getPrefix()}stop to clear the current queue and try again!`
            context.getProvider().getResponder().error(errMsg, message)
            return
        }
        const shouldGenerateSeed = args.get('artist') && args.get('genre') ||
            args.get('artist') && args.get('track') ||
            args.get('genre') && args.get('track')
        let mode = Radio.ConvertStringToRadioMode(args.get('mode'))
        mode = shouldGenerateSeed ? RadioMode.RELATED : mode
        if ((mode == RadioMode.TOP_10 || mode == RadioMode.ARTIST_ONLY) && !args.get('artist')) {
            context.getProvider().getResponder()
                .error(`Must provide an artist for this mode! Provide one using the -a flag!`, message)
            return
        }
        const radioContext: RadioContext = {
            artists: [args.get('artist')],
            genres: [args.get('genre')],
            tracks: [args.get('track')],
            length: args.get('length'),
            mode: mode
        }
        context.getProvider().getResponder().startTyping()
        context.getProvider().getDJ().getRadio().start(radioContext, message).then(() => {
            context.getProvider().getResponder().acknowledge(0, message)
        }).finally(() => {
            context.getProvider().getResponder().stopTyping()
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
