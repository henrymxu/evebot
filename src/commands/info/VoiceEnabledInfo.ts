import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {Command, CommandOptions} from "../Command"

export default class VoiceEnabledInfo extends Command {
    readonly options: CommandOptions = {
        name: 'VoiceEnabledInfo',
        keywords: ['voiceinfo'],
        group: 'info',
        descriptions: ['Show info about EVE\'s Voice Enabled feature'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const response = 'Say Alexa to trigger the bot, after you say alexa, you will here a ding, ' +
            'then you have 4 seconds to complete your command, the bot will ding again to indicate it has finished listening to your command'
        context.getProvider().getResponder().send({content: response, id: 'voiceinfo', message: message}, 30)
    }
}