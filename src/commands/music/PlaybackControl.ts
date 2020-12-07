import VoiceCommand from '../../voice/VoiceCommand'
import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {CommandOptions} from '../Command'

export default class PlaybackControlCommand extends VoiceCommand {
    readonly options: CommandOptions = {
        name: 'PlaybackControl',
        keywords: ['resume', 'pause', 'stop'],
        group: 'music',
        descriptions: ['Resume playback', 'Pause playback', 'Stop playback'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        let result: boolean = false
        switch(args.get('keyword')) {
            case 'resume':
                result = context.getProvider().getDJ().resume()
                break
            case 'pause':
                result = context.getProvider().getDJ().pause()
                break
            case 'stop':
                result = context.getProvider().getDJ().stop()
                break
        }
        if (result) {
            context.getProvider().getResponder().acknowledge(0, message)
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
