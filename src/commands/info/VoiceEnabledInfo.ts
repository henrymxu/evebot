import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {Command, CommandAck, CommandOptions} from '../Command';

export default class VoiceEnabledInfo extends Command {
    readonly options: CommandOptions = {
        name: 'VoiceEnabledInfo',
        keywords: ['voiceinfo'],
        group: 'info',
        descriptions: ["Show info about EVE's Voice Enabled feature"],
        arguments: [],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const response =
            'Say Alexa to trigger the bot, after you say alexa, you will here a ding, ' +
            'then you have 4 seconds to complete your command, ' +
            'the bot will ding again to indicate it has finished listening to your command';
        return Promise.resolve({
            content: response,
            id: 'voiceinfo',
            message: message,
            removeAfter: 30,
        });
    }
}
