import VoiceCommand from '../../voice/VoiceCommand'
import { Message, User } from 'discord.js'
import { GuildContext } from '../../guild/Context'
import { ArgumentType, CommandOptions } from '../Command'
import { QueryMode } from '../../music/DJ'

export default class PlayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Play',
        keywords: ['play', 'album'],
        group: 'music',
        descriptions: ['Play a song or playlist', 'Play an album'],
        arguments: [
            {
                key: 'query',
                description: 'Name or url of song',
                required: true,
                type: ArgumentType.STRING,
            },
        ],
        examples: ['play Blank Space'],
    }

    execute(
        context: GuildContext,
        source: User,
        args: Map<string, any>,
        message?: Message
    ) {
        let mode: QueryMode = QueryMode.Play
        if (args.get('keyword') === 'album') {
            mode = QueryMode.Album
        }
        context
            .getProvider()
            .getDJ()
            .request(mode, args.get('query'), source.id, message)
    }

    botMustBeAlreadyInVoiceChannel(): boolean {
        return false
    }

    botMustBeInSameVoiceChannel(): boolean {
        return false
    }

    userMustBeInVoiceChannel(): boolean {
        return true
    }
}
