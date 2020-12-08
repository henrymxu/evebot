import {GuildContext} from '../guild/Context'
import {Message, MessageEmbed, MessageOptions, TextChannel} from 'discord.js'
import {Communicator} from './Communicator'
import {MessageGenerator} from './MessageGenerator'
import {Logger} from '../Logger'

const TAG = 'Responder'
const DEFAULT_EMOJIS = ['👌', '👎', '⏲️', '🤡']

export default class Responder {
    private context: GuildContext
    private messageCache: Map<string, Message[]> = new Map()
    private typingStatus: Set<string> = new Set()
    constructor(context: GuildContext) {
        this.context = context
    }

    error(error: string | Error, message?: Message) {
        const embed = MessageGenerator.createErrorEmbed(error instanceof Error ? error.message : error)
        this.send({content: embed, message: message}, 30)
    }

    acknowledge(mode: number, message?: Message) {
        Communicator.acknowledge(DEFAULT_EMOJIS[mode], message)
    }

    send(message: BotMessage, removeAfter: number = 0): Promise<Message[]> {
        if (message.id && this.messageCache.has(message.id)) {
            this.delete(message.id)
        }
        const options = message.options || {}
        options.split = true
        const textChannel = message.message ? (message.message.channel as TextChannel) : this.context.getTextChannel()
        if (!textChannel) {
            throw new Error(`TextChannel is undefined`)
        }
        return Communicator.send(message.content, options, textChannel).then((result) => {
            const results: Message[] = result instanceof Message ? [result] : result
            if (message.id) {
                this.messageCache.set(message.id, results)
            }
            results.forEach((messageResult) => {
                if (message.id && this.typingStatus.has(message.id)) {
                    this.stopTyping(message.message)
                    this.typingStatus.delete(message.id)
                }
                if (removeAfter > 0) {
                    this.delete(messageResult, removeAfter)
                }
            })
            return results
        }).catch(err => {
            throw new Error(`Sending message failed ${err.toString}`)
        })
    }

    delete(source: Message | string, delay: number = 0) {
        const messages = !(source instanceof Message) ? this.messageCache.get(source) : [source]
        if (messages) {
            messages.forEach((message) => {
                message.delete({
                    timeout: delay * 1000
                }).catch(err => {
                    Logger.e(TAG, err)
                })
            })
        }
    }

    reply() {

    }

    startTyping(source?: Message, id?: string) {
        const textChannel = source ? source.channel as TextChannel : this.context.getTextChannel()
        Communicator.startTyping(textChannel)
        if (id) {
            this.typingStatus.add(id)
        }
    }

    stopTyping(source?: Message) {
        const textChannel = source ? source.channel as TextChannel : this.context.getTextChannel()
        Communicator.stopTyping(textChannel)
    }
}

interface BotMessage {
    content: string | MessageEmbed
    id?: string
    message?: Message
    options?: MessageOptions
}
