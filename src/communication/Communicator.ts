import {Message, MessageEmbed, MessageOptions, TextChannel} from "discord.js"

export namespace Communicator {
    export function acknowledge(emoji: string, message?: Message) {
        message?.react(emoji)
    }

    export function send(message: string | MessageEmbed, options: MessageOptions,
                         textChannel: TextChannel): Promise<Message | Array<Message>> {
        let opts: MessageOptions | undefined = options
        if (message instanceof MessageEmbed) {
            opts = undefined
        }
        return textChannel.send(message, opts)
    }

    export function startTyping(textChannel?: TextChannel) {
        textChannel?.startTyping()
    }

    export function stopTyping(textChannel?: TextChannel) {
        textChannel?.stopTyping()
    }
}