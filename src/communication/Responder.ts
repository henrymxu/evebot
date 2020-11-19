import { GuildContext } from '../guild/Context'
import { Message, MessageEmbed, MessageOptions, TextChannel } from 'discord.js'
import { Communicator } from './Communicator'
import { MessageGenerator } from './MessageGenerator'

const DEFAULT_EMOJIS = {
    0: '👌',
    1: '👎',
}

export default class Responder {
    private context: GuildContext
    private messageCache: Map<string, Message[]> = new Map()
    private typingStatus: Set<string> = new Set()
    constructor(context: GuildContext) {
        this.context = context
    }

    error(error: string | Error, message?: Message) {
        const embed = MessageGenerator.createErrorEmbed(error instanceof Error ? error.message : error)
        this.send({ content: embed, message: message }, 30)
    }

    acknowledge(mode: number, message: Message) {
        if (!message) {
            return
        }
        Communicator.acknowledge(DEFAULT_EMOJIS[mode], message)
    }

    send(message: BotMessage, removeAfter?: number): Promise<Message[]> {
        if (this.messageCache.has(message.id)) {
            this.delete(message.id)
        }
        if (!message.options) {
            message.options = {}
        }
        message.options.split = true
        const textChannel: TextChannel = message.message
            ? (message.message.channel as TextChannel)
            : this.context.getTextChannel()
        return new Promise((res, rej) => {
            Communicator.send(message.content, message.options, textChannel)
                .then((result) => {
                    const results: Message[] = result instanceof Message ? [result] : result
                    if (message.id) {
                        this.messageCache.set(message.id, results)
                    }
                    results.forEach((messageResult) => {
                        if (this.typingStatus.has(message.id)) {
                            this.stopTyping(message.message)
                            this.typingStatus.delete(message.id)
                        }
                        if (removeAfter > 0) {
                            this.delete(messageResult, removeAfter)
                        }
                    })
                    res(results)
                })
                .catch((err) => {
                    rej(err)
                })
        })
    }

    delete(source: Message | string, delay?: number) {
        const messages = !(source instanceof Message) ? this.messageCache.get(source) : [source]
        if (messages) {
            messages.forEach((message) => {
                message
                    .delete({
                        timeout: delay * 1000,
                    })
                    .catch((err) => {})
            })
        }
    }

    reply() {}

    startTyping(source?: Message, id?: string) {
        const textChannel: TextChannel = source ? (source.channel as TextChannel) : this.context.getTextChannel()
        Communicator.startTyping(textChannel)
        this.typingStatus.add(id)
    }

    stopTyping(source?: Message) {
        const textChannel: TextChannel = source ? (source.channel as TextChannel) : this.context.getTextChannel()
        Communicator.stopTyping(textChannel)
    }
}

interface BotMessage {
    content: string | MessageEmbed
    id?: string
    message?: Message
    options?: MessageOptions
}
