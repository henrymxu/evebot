import {Message, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {Command, CommandAck, CommandOptions} from '../Command'
import {Acknowledgement} from '../../communication/Responder'

export default class VoiceOptionsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'VoiceOptions',
        keywords: ['voiceoptout', 'voiceoptin'],
        group: 'admin',
        descriptions: ['Opt out of E.V.E voice related features (commands / clipping / reciting)',
            'Opt in to E.V.E voice related features (commands / clipping / reciting)'],
        arguments: [],
        examples: ['voiceoptout', 'voiceoptin']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        switch(args.get('keyword')) {
            case 'voiceoptout':
                context.getConfig().setUserVoiceOptOut(source.id, true)
                context.getProvider().getVoiceConnectionHandler().deleteVoiceStreamForUser(source)
                break
            case 'voiceoptin':
                context.getConfig().setUserVoiceOptOut(source.id, false)
                context.getProvider().getVoiceConnectionHandler().addVoiceStreamForUser(source)
        }
        return Promise.resolve(Acknowledgement.UPDATED)
    }
}
