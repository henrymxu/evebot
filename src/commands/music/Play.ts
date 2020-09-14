import VoiceCommand from "../../voice/VoiceCommand"
import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, CommandOptions} from "../Command"

export default class PlayCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Play',
        keywords: ['play'],
        group: 'music',
        descriptions: ['Play a song or playlist'],
        arguments: [
            {
                key: 'query',
                description: 'Name or url of song',
                required: true,
                type: ArgumentType.string
            }
        ],
        example: 'play Blank Space'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        context.getProvider().getDJ().play(args.get('query'), source.id, message)
    }

    botMustBeAlreadyInVoiceChannel(): boolean {
        return false;
    }

    botMustBeInSameVoiceChannel(): boolean {
        return false;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }
}
