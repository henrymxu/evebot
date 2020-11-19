import {ArgumentType, Command, CommandOptions} from "../Command"
import {GuildContext} from "../../guild/Context"
import {Message, User} from "discord.js"
import {GuildUtils} from "../../utils/GuildUtils"

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

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
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
        }
        const response = func(context, source, args.get('user'))
        context.getProvider().getResponder().send({content: response, id: 'disrespect', message: message}, 30)
    }
}

function respect(context: GuildContext, source: User, target: User): string {
    if (!target) {
        return `here\'s free 69 respects\n ${GuildUtils.createUserMentionString(source.id)} you have 69(free respects claimable in [right now]!`
    }
    return `${GuildUtils.createUserMentionString(source.id)} respected ${GuildUtils.createUserMentionString(target.id)}! (Total respect: 69)`
}

function disrespect(context: GuildContext, source: User, target: User): string {
    if (!target) {
        return 'You must choose someone to disrespect!'
    }
    return `${GuildUtils.createUserMentionString(source.id)} just spent 2 respects to disrespect ${GuildUtils.createUserMentionString(target.id)}! (Remaining respect: -9007199254740991)`
}