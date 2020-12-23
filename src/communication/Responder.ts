import {GuildContext} from '../guild/Context';
import {Message, MessageEmbed, MessageOptions, MessageReaction, TextChannel, User} from 'discord.js';
import {Communicator} from './Communicator';
import {MessageGenerator} from './MessageGenerator';
import {GlobalContext} from '../GlobalContext';
import {GuildUtils} from '../utils/GuildUtils';

export default class Responder {
    private readonly context: GuildContext;
    private messageCache: Map<string, Message[]> = new Map();
    private messageDeleteTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private typingStatus: Set<string> = new Set();
    constructor(context: GuildContext) {
        this.context = context;
    }

    error(error: string | Error, message?: Message) {
        const embed = MessageGenerator.createErrorEmbed(error instanceof Error ? error.message : error);
        this.send({content: embed, message: message, removeAfter: 30});
    }

    acknowledge(type: Acknowledgement, message: Message | undefined) {
        const emojiID = this.context.getConfig().getEmoji(type) || GlobalContext.getDefaultConfig().getEmoji(type);
        const emoji =
            GuildUtils.parseEmojiFromEmojiID(this.context, emojiID) || GlobalContext.getDefaultConfig().getEmoji(type);
        Communicator.acknowledge(emoji, message);
    }

    send(message: BotMessage): Promise<Message[]> {
        if (message.id && this.messageCache.has(message.id)) {
            this.delete(message.id);
        }
        const options = message.options || {};
        options.split = true;
        const textChannel = message.message ? (message.message.channel as TextChannel) : this.context.getTextChannel();
        if (!textChannel) {
            throw new Error('TextChannel is undefined');
        }
        return Communicator.send(message.content, options, textChannel)
            .then(result => {
                const results: Message[] = result instanceof Message ? [result] : result;
                if (message.id) {
                    this.messageCache.set(message.id, results);
                }
                results.forEach(messageResult => {
                    if (message.id && this.typingStatus.has(message.id)) {
                        this.stopTyping(message.message);
                        this.typingStatus.delete(message.id);
                    }
                    if (message.removeAfter) {
                        this.delete(messageResult, message.removeAfter);
                    }
                    if (message.action) {
                        this.registerMessageAction(messageResult, message);
                    }
                });
                return results;
            })
            .catch(err => {
                throw new Error(`Sending message failed ${err.toString}`);
            });
    }

    delete(source: Message | string, delay = 0) {
        const messages = !(source instanceof Message) ? this.messageCache.get(source) : [source];
        if (messages) {
            messages.forEach(message => {
                this.setNewDeleteTimeout(
                    message.id,
                    () => {
                        if (!message.deleted) {
                            message.delete();
                        }
                    },
                    delay * 1000
                );
            });
        }
    }

    reply() {}

    startTyping(source?: Message, id?: string) {
        const textChannel = source ? (source.channel as TextChannel) : this.context.getTextChannel();
        Communicator.startTyping(textChannel);
        if (id) {
            this.typingStatus.add(id);
        }
    }

    stopTyping(source?: Message) {
        const textChannel = source ? (source.channel as TextChannel) : this.context.getTextChannel();
        Communicator.stopTyping(textChannel);
    }

    private registerMessageAction(message: Message, botMessage: BotMessage) {
        const action = botMessage.action!;
        action.options.forEach(emoji => {
            message.react(emoji);
        });
        const reactionFilter = (reaction: MessageReaction, user: User) => {
            if (user.bot || (action.senderOnly && message.author.id !== user.id)) {
                return false;
            }
            return action.options.has(reaction.emoji.toString());
        };
        const collector = message.createReactionCollector(reactionFilter);
        collector.on('collect', reaction => {
            const response = action.handler(reaction.emoji.name);
            if (response.newMessage) {
                if (response.isEdit) {
                    message.edit(response.newMessage, {
                        embed: botMessage.options?.embed,
                        code: botMessage.options?.code,
                        allowedMentions: botMessage.options?.allowedMentions,
                    });
                } else {
                    this.send(response.newMessage as BotMessage);
                }
            }
            if (botMessage.removeAfter) {
                this.delete(message, botMessage.removeAfter);
            }
        });
    }

    private setNewDeleteTimeout(id: string, handler: () => void, delay: number) {
        const oldTimeout = this.messageDeleteTimeouts.get(id);
        if (oldTimeout) {
            clearTimeout(oldTimeout);
            this.messageDeleteTimeouts.delete(id);
        }
        const timeout = setTimeout(handler, delay);
        this.messageDeleteTimeouts.set(id, timeout);
    }
}

export interface BotMessage {
    content: string | MessageEmbed;
    id?: string;
    message?: Message;
    options?: MessageOptions;
    removeAfter?: number;
    action?: MessageAction;
}

export interface MessageAction {
    handler: (emoji: string) => MessageActionResponse;
    options: Set<string>;
    senderOnly?: boolean;
}

export interface MessageActionResponse {
    newMessage?: BotMessage | string;
    isEdit?: boolean;
}

export enum Acknowledgement {
    OK = 'ok',
    NEGATIVE = 'negative',
    MISSING_PRIVILEGES = 'no privileges',
    USER_THROTTLED = 'throttled',
    UNNECESSARY = 'unnecessary',
    MUSIC = 'music',
    SURVEILLANCE = 'surveillance',
    UPDATED = 'updated',
}
