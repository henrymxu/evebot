import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, CommandAck, CommandExecutionError, CommandOptions} from '../Command'
import {Radio, RadioContext, RadioMode} from '../../music/radio/Radio'
import {TrackMessageFactory} from '../../communication/TrackMessageGenerator'
import {Acknowledgement} from '../../communication/Responder'

export default class RadioCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Radio',
        keywords: ['radio'],
        group: 'music',
        descriptions: ['Start a radio with some parameters.  Use the different modes to change the song list!'],
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
                key: 'masters',
                flag: 'm',
                description: 'Sets radio mode to play all songs from artist\'s masters',
                required: false,
                type: ArgumentType.FLAG,
            },
            {
                key: 'popular',
                flag: 'p',
                description: 'Sets radio mode to play artists top 10 current songs',
                required: false,
                type: ArgumentType.FLAG,
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
        examples: ['radio -a Taylor Swift -t Closer', 'radio -g pop', 'radio -a Taylor Swift -m']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        if (!args.get('artist') && !args.get('genre') && !args.get('track')) {
            const radioConfiguration = context.getProvider().getDJ().getRadio().getRadioConfiguration()
            if (radioConfiguration) {
                return Promise.resolve({content: TrackMessageFactory.createRadioMessage(context, radioConfiguration),
                        message: message, options: {code: 'Markdown'}, removeAfter: 30})
            } else {
                throw new CommandExecutionError(`There is no radio playing! Use ${context.getPrefix()}radio command to start one!`)
            }
        }
        if (context.getProvider().getDJ().isPlaying()) {
            const errMsg = `Cannot start a radio while there are songs playing! Use ${context.getPrefix()}stop to clear the current queue and try again!`
            throw new CommandExecutionError(errMsg)
        }
        const shouldGenerateSeed = args.get('artist') && args.get('genre') ||
            args.get('artist') && args.get('track') ||
            args.get('genre') && args.get('track')
        let mode: RadioMode = RadioMode.RELATED
        if (args.get('masters')) {
            mode = RadioMode.ARTIST_ONLY
        } else if (args.get('popular')) {
            mode = RadioMode.TOP_10
        }
        mode = shouldGenerateSeed ? RadioMode.RELATED : mode
        if ((mode == RadioMode.TOP_10 || mode == RadioMode.ARTIST_ONLY) && !args.get('artist')) {
            throw new CommandExecutionError(`Must provide an artist for this mode! Provide one using the -a flag!`)
        }
        const radioContext: RadioContext = {
            artists: [args.get('artist')],
            genres: [args.get('genre')],
            tracks: [args.get('track')],
            length: args.get('length'),
            mode: mode
        }
        context.getProvider().getResponder().startTyping()
        return context.getProvider().getDJ().getRadio().start(radioContext, message).then(() => {
            return Acknowledgement.OK
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
