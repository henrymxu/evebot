import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, Command, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {GeniusLyrics} from '../../music/lyrics/Genius';
import {MessageGenerator} from '../../communication/MessageGenerator';
import {Acknowledgement} from '../../communication/Responder';

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
                type: ArgumentType.STRING,
            },
            {
                key: 'artist',
                flag: 'a',
                description: 'Artist of song',
                required: false,
                type: ArgumentType.STRING,
            },
        ],
        examples: ['lyrics', 'lyrics Wildest Dreams'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const query = args.get('query') || context.getProvider().getDJ().getCurrentTrack()?.getTitle();
        if (!query) {
            throw new CommandExecutionError('There is no song playing! Provide a song name for some lyrics');
        }
        return GeniusLyrics.get(query, args.get('artist'))
            .then(result => {
                const embed = MessageGenerator.getBaseEmbed();
                embed.setImage(result.albumArt);
                embed.setTitle(query);
                embed.setURL(result.url);
                return {
                    content: result.lyrics,
                    message: message,
                    options: {code: 'Markdown', embed: embed},
                };
            })
            .catch(err => {
                throw new CommandExecutionError(
                    `Error retrieving lyrics for ${query}, reason: ${err}`,
                    Acknowledgement.NEGATIVE
                );
            });
    }
}
