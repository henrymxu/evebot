import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {CommandOptions} from '../Command'
import {GuildContext} from '../../guild/Context'

export default class JoinCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Join',
        keywords: ['join'],
        group: 'voice',
        descriptions: ['Join voice channel'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        context.getProvider().getResponder().acknowledge(0, message)
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
