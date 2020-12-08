import {Message, MessageEmbed, User} from 'discord.js'
import {GuildContext} from '../../guild/Context'
import {ArgumentType, Command, CommandOptions} from '../Command'
import {GlobalContext} from '../../GlobalContext'
import {GuildUtils} from '../../utils/GuildUtils'
import {MessageGenerator} from '../../communication/MessageGenerator'
import {Emojis} from '../../guild/Config'
import {Acknowledgement} from '../../communication/Responder'

export default class EmojisCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Emojis',
        keywords: ['emojis'],
        group: 'admin',
        descriptions: ['Modify acknowledgement emojis'],
        arguments: [
            {
                key: 'ack',
                description: 'Acknowledgement type',
                required: false,
                type: ArgumentType.STRING,
                validate: (context, arg) => { return context.getConfig().getEmojis().has(arg) }
            },
            {
                key: 'emoji',
                flag: 'e',
                description: 'The new emoji for the specified acknowledgement',
                required: false,
                type: ArgumentType.STRING,
                validate: (context, arg) => { return GuildUtils.getEmojiFromID(context, arg) !== undefined }
            },
            {
                key: 'default',
                flag: 'd',
                description: 'Set the emoji for specified acknowledgement back to default',
                required: false,
                type: ArgumentType.FLAG,
            },
        ],
        permissions: ['MANAGE_GUILD'],
        examples: ['emoji okay -e 305818615712579584', 'aliases negative -e 🤡']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const emojis = context.getConfig().getEmojis()
        if (!args.get('ack')) {
            context.getProvider().getResponder()
                .send({content: createEmojiListEmbed(emojis),
                    message: message, id: 'emojis', options: {code: 'Markdown'}}, 30)
            return
        }
        if (args.get('ack') && !args.get('emoji') && !args.get('default')) {
            const resolvedEmoji = GuildUtils.getEmojiFromID(context, context.getConfig().getEmoji(args.get('ack')))
            context.getProvider().getResponder().send({
                content: `Emoji for ${args.get('ack')} is ${resolvedEmoji}`, id: 'emojis', message: message }, 30)
            return
        }
        let emoji = !args.get('default') ? args.get('emoji') : GlobalContext.getDefaultConfig().getEmoji(args.get('ack'))
        if (Array.from(emojis.values()).includes(emoji)) {
            const errMsg = `Duplicate emoji provided, each emoji must be unique`
            context.getProvider().getResponder().error(errMsg, message)
            return
        }
        context.getConfig().setEmoji(args.get('ack'), emoji)
        context.getProvider().getResponder().acknowledge(Acknowledgement.OK, message)
    }
}

function createEmojiListEmbed(emojis: Emojis): MessageEmbed {
    const embed = MessageGenerator.getBaseEmbed()
    emojis.forEach((value, key) => {
        embed.addField(key, value)
    })
    return embed
}
