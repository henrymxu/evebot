import {GuildContext} from '../guild/Context'
import {Message, MessageEmbed, MessageOptions, TextChannel} from 'discord.js'
import {Communicator} from './Communicator'
import {MessageGenerator} from './MessageGenerator'
import {Logger} from '../Logger'
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

    acknowledge(type: Acknowledgement | string, message: Message | undefined) {
        const typeString = (typeof type === 'string') ? type : convertAcknowledgementTypeToString(type)
        const emojiID = this.context.getConfig().getEmoji(typeString) || GlobalContext.getDefaultConfig().getEmoji(typeString)
        const emoji = GuildUtils.parseEmojiFromEmojiID(this.context, emojiID) || GlobalContext.getDefaultConfig().getEmoji(typeString)
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

function convertAcknowledgementTypeToString(type: Acknowledgement): string {
    switch(type) {
        case Acknowledgement.OK:
            return "ok"
        case Acknowledgement.NEGATIVE:
            return "negative"
        case Acknowledgement.MISSING_PRIVILEGES:
            return 'no privileges'
        case Acknowledgement.USER_THROTTLED:
            return 'throttled'
        case Acknowledgement.UNNECESSARY:
            return 'unnecessary'
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
    OK,
    NEGATIVE,
    MISSING_PRIVILEGES,
    USER_THROTTLED,
    UNNECESSARY
}