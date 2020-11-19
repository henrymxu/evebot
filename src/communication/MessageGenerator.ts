import { MessageAttachment, MessageEmbed } from 'discord.js'

export namespace MessageGenerator {
    export function getBaseEmbed(): MessageEmbed {
        return new MessageEmbed().setColor([46, 115, 189])
    }

    export function createBasicEmbed(
        message: string,
        title: string = ''
    ): MessageEmbed {
        const embed = getBaseEmbed().setDescription(`${message}`)
        if (title) {
            embed.setTitle(title)
        }
        return embed
    }

    export function createBlockEmbed(message: string): MessageEmbed {
        return getBaseEmbed().setDescription(`\`\`\`${message}\`\`\``)
    }

    export function createErrorEmbed(message: string): MessageEmbed {
        return createBlockEmbed(message)
    }

    export function attachFileToEmbed(
        message: MessageEmbed,
        file: string | Buffer,
        caption: string
    ): MessageEmbed {
        const messageAttachment: MessageAttachment = new MessageAttachment(
            file,
            caption
        )
        return message.attachFiles([messageAttachment])
    }
}
