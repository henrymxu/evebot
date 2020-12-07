import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, CommandOptions} from '../Command'
import {TableGenerator} from '../../communication/TableGenerator'
import {Radio, RadioConfiguration, RadioContext, RadioMode} from '../../music/radio/Radio'

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
                    {content: createRadioMessage(radioConfiguration),
                        message: message, options: {code: 'Markdown'}}, 30)
            } else {
                context.getProvider().getResponder()
                    .error(`There is no radio playing! Use ${context.getPrefix()}radio command to start one!`, message)
            }
            return
        }
        if (context.getProvider().getDJ().getCurrentSong()) {
            context.getProvider().getResponder()
                .error(`Cannot start a radio while there are songs playing! 
                Use ${context.getPrefix()}stop to clear the current queue and try again!`, message)
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
        context.getProvider().getDJ().getRadio().start(radioContext, message)
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

function createRadioMessage(radioConfiguration: RadioConfiguration): string {
    let response = ''
    const tableHeaders = ['Artist', 'Genre', 'Track']
    const source = radioConfiguration.context
    const artists = source.artists ? source.artists.toString() : ' - '
    const genres = source.genres ? source.genres.toString() : ' - '
    const tracks = source.tracks ? source.tracks.toString() : ' - '
    const tableData = [[artists, genres, tracks]]
    response += `${TableGenerator.createTable(tableHeaders, tableData)}\n`

    const tableHeaders2 = ['Previous Track', 'Current Track', 'Next Track']
    const tableData2 = [[radioConfiguration.playedTracks[0],
        radioConfiguration.currentTrack, radioConfiguration.recommendedTracks[0]]]
    response += `${TableGenerator.createTable(tableHeaders2, tableData2)}\n`

    const tableHeaders3 = ['Tracks Played', 'Tracks Remaining']
    const tableData3 = [[radioConfiguration.playedTracks.length.toString(),
        radioConfiguration.recommendedTracks.length.toString()]]
    response += `${TableGenerator.createTable(tableHeaders3, tableData3)}`
    return response
}