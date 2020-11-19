import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {GeniusLyrics} from "../../music/lyrics/Genius"
import {MessageGenerator} from "../../communication/MessageGenerator"
import {Logger} from "../../Logger"

export default class LyricsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Lyrics',
        keywords: ['lyrics'],
        group: 'music',
        descriptions: ['Find lyrics of a song'],
        arguments: [
            {
                key: 'query',
                description: 'Name of song (if none is provided, currently playing song is used)',
                required: false,
                type: ArgumentType.STRING
            },
            {
                key: 'artist',
                flag: 'a',
                description: 'Artist of song',
                required: false,
                type: ArgumentType.STRING
            }
        ],
        examples: ['lyrics', 'lyrics Wildest Dreams']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const query = args.get('query') || context.getProvider().getDJ().getCurrentSong().getTitle()
        if (!query) {
            context.getProvider().getResponder().error(`There is no song playing! Provide a song name for some lyrics`, message)
        }
        GeniusLyrics.get(query, args.get('artist')).then((result) => {
            const embed = MessageGenerator.getBaseEmbed()
            embed.setImage(result.albumArt)
            embed.setTitle(query)
            embed.setURL(result.url)
            context.getProvider().getResponder().send(
                {content: result.lyrics,
                    message: message, options: {code: 'Markdown', embed: embed}})
        }).catch(err => {
            Logger.e(context, LyricsCommand.name, `Error retrieving lyrics for ${query}, reason: ${err}`)
            context.getProvider().getResponder().acknowledge(1, message)
        })
    }
}
