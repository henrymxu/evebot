import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {CommandOptions} from '../Command'
import {Acknowledgement} from '../../communication/Responder'

export default class SkipCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Skip',
        keywords: ['skip'],
        group: 'music',
        descriptions: ['Skip the current song'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (context.getProvider().getDJ().skip()) {
            context.getProvider().getResponder().acknowledge(Acknowledgement.OK, message)
        }
    }

    botMustAlreadyBeInVoiceChannel(): boolean {
        return true;
    }

    botMustBeInTheSameVoiceChannel(): boolean {
        return true;
    }

    userMustBeInVoiceChannel(): boolean {
        return true;
    }

    protected botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
