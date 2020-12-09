import {GuildContext} from '../guild/Context'
import {Message, MessageEmbed, MessageOptions, TextChannel} from 'discord.js'
import {Communicator} from './Communicator'
import {MessageGenerator} from './MessageGenerator'
import {GlobalContext} from '../GlobalContext'
import {GuildUtils} from '../utils/GuildUtils'

const TAG = 'Responder'

export default class Responder {
    private readonly context: GuildContext
    private messageCache: Map<string, Message[]> = new Map()
    private typingStatus: Set<string> = new Set()
    constructor(context: GuildContext) {
        this.context = context
    }

    error(error: string | Error, message?: Message) {
        const embed = MessageGenerator.createErrorEmbed(error instanceof Error ? error.message : error)
        this.send({content: embed, message: message, removeAfter: 30})
    }

    acknowledge(type: Acknowledgement, message: Message | undefined) {
        const emojiID = this.context.getConfig().getEmoji(type) || GlobalContext.getDefaultConfig().getEmoji(type)
        const emoji = GuildUtils.parseEmojiFromEmojiID(this.context, emojiID) || GlobalContext.getDefaultConfig().getEmoji(type)
        Communicator.acknowledge(emoji, message)
    }

    send(message: BotMessage): Promise<Message[]> {
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
                if (message.removeAfter) {
                    this.delete(messageResult, message.removeAfter)
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
                message.delete({ timeout: delay * 1000 }).catch(err => {
                    // Ignore error
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

export interface BotMessage {
    content: string | MessageEmbed
    id?: string
    message?: Message
    options?: MessageOptions
    removeAfter?: number
}

export enum Acknowledgement {
    OK = 'ok',
    NEGATIVE = 'negative',
    MISSING_PRIVILEGES = 'no privileges',
    USER_THROTTLED = 'throttled',
    UNNECESSARY = 'unnecessary',
    MUSIC = 'music',
    SURVEILLANCE = 'surveillance',
    UPDATED = 'updated'
}