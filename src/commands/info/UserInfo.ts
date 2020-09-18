import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {MessageGenerator} from "../../communication/MessageGenerator"

export default class UserInfoCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Userinfo',
        keywords: ['userinfo'],
        group: 'info',
        descriptions: ['Show info about a user'],
        arguments: [
            {
                key: 'user',
                description: 'User you would like to show info about',
                required: true,
                type: ArgumentType.USER
            }
        ],
        examples: ['userinfo @George']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const user: User = args.get('user')
        const embed = MessageGenerator.createBasicEmbed(user.tag)
        embed.addField('Username', user.username)
        embed.addField('ID', user.id)
        embed.addField('Created', user.createdAt.toDateString())
        embed.addField('Joined Server', context.getGuild().member(user).joinedAt.toDateString())
        embed.addField('Status', user.presence.status)
        embed.setThumbnail(user.avatarURL())
        context.getProvider().getResponder().send({content: embed, id: user.id, message: message}, 30)
    }
}