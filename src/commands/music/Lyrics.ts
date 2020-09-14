import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {GeniusLyrics} from "../../music/lyrics/Genius"
import {MessageGenerator} from "../../communication/MessageGenerator"

export default class LyricsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Lyrics',
        keywords: ['lyrics'],
        group: 'music',
        descriptions: ['Find lyrics of a song'],
        arguments: [
            {
                key: 'query',
                description: 'Name of song',
                required: true,
                type: ArgumentType.string
            },
            {
                key: 'artist',
                flag: 'a',
                description: 'Artist of song',
                required: false,
                type: ArgumentType.string
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        GeniusLyrics.get(args.get('query'), args.get('artist')).then((result) => {
            const embed = MessageGenerator.getBaseEmbed()
            embed.setImage(result.albumArt)
            embed.setTitle(args.get('query'))
            embed.setURL(result.url)
            context.getProvider().getResponder().send(
                {content: result.lyrics,
                    message: message, options: {code: 'Markdown', embed: embed}})
        }).catch(err => {
            console.log(`Error retrieving lyrics for ${args.get('query')}: ${err}`)
            context.getProvider().getResponder().acknowledge(1, message)
        })
    }
}
