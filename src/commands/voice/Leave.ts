import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {CommandOptions} from '../Command'
import {GuildContext} from '../../guild/Context'
import {Acknowledgement} from '../../communication/Responder'

export default class LeaveCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'Leave',
        keywords: ['leave'],
        group: 'voice',
        descriptions: ['Leave voice channel'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        context.getProvider().getVoiceConnectionHandler().disconnect().then(() => {
            context.getProvider().getResponder().acknowledge(Acknowledgement.OK, message)
        })
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

    botShouldNotJoinVoiceChannelIfNotReady(): boolean {
        return true
    }
}
