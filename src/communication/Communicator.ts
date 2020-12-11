import {Emoji, Message, MessageEmbed, MessageOptions, TextChannel} from 'discord.js'

export namespace Communicator {
    export function acknowledge(emoji: string | Emoji, message?: Message) {
        message?.react(typeof emoji === 'string' ? emoji : emoji.id!)
    }

    export function send(message: string | MessageEmbed, options: MessageOptions,
                         textChannel: TextChannel): Promise<Message | Array<Message>> {
        let opts: MessageOptions | undefined = options
        if (message instanceof MessageEmbed) {
            opts = undefined
        }
        return opts ? textChannel.send(message, opts) : textChannel.send(message)
    }

    export function startTyping(textChannel?: TextChannel) {
        textChannel?.startTyping()
    }

    export function stopTyping(textChannel?: TextChannel) {
        textChannel?.stopTyping()
    }
}