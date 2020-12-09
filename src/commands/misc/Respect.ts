import {ArgumentType, Command, CommandAck, CommandOptions} from '../Command'
import {GuildContext} from '../../guild/Context'
import {Message, User} from 'discord.js'

export class RespectCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Respect',
        keywords: ['respect', 'disrespect'],
        group: 'misc',
        descriptions: ['Respect someone!', 'Disrespect someone!'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like respect or disrespect',
                required: false,
                type: ArgumentType.USER
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let func: (context: GuildContext, source: User, target: User) => string
        switch(args.get('keyword')) {
            case 'respect': {
                func = respect
                break
            }
            case 'disrespect': {
                func = disrespect
                break
            }
            default: {
                func = respect
            }
        }
        const response = func(context, source, args.get('user'))
        return Promise.resolve({content: response, id: 'disrespect', message: message, removeAfter: 30})
    }
}

function respect(context: GuildContext, source: User, target: User): string {
    if (!target) {
        return `here's free 69 respects\n ${source} you have 69(free respects claimable in [right now]!`
    }
    return `${source} respected ${target}! (Total respect: 69)`
}

function disrespect(context: GuildContext, source: User, target: User): string {
    if (!target) {
        return 'You must choose someone to disrespect!'
    }
    return `${source} just spent 2 respects to disrespect ${target}! (Remaining respect: -9007199254740991)`
}