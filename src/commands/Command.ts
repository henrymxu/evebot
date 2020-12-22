import {GuildContext} from '../guild/Context';
import {Message, User} from 'discord.js';
import {Logger} from '../Logger';
import {Acknowledgement, BotMessage} from '../communication/Responder';

export abstract class Command {
    abstract readonly options: CommandOptions;
    protected abstract execute(
        context: GuildContext,
        source: User,
        args: Map<string, any>,
        message?: Message
    ): Promise<CommandAck>;

    protected onExecuteSucceeded(context: GuildContext, acknowledge: CommandAck, message?: Message) {
        if (acknowledge === undefined) {
            return;
        }
        const acks = Array.isArray(acknowledge) ? acknowledge : [acknowledge];
        acks.forEach(ack => {
            if (Object.prototype.hasOwnProperty.call(ack, 'content')) {
                context
                    .getProvider()
                    .getResponder()
                    .send(ack as BotMessage);
            } else {
                context
                    .getProvider()
                    .getResponder()
                    .acknowledge(ack as Acknowledgement, message);
            }
        });
    }

    protected onExecutedFailed(context: GuildContext, error: CommandExecutionError, message?: Message) {
        if (error.emoji) {
            context.getProvider().getResponder().acknowledge(error.emoji, message);
        }
        if (error.msg) {
            context.getProvider().getResponder().error(error.msg, message);
        }
    }

    protected preExecute(context: GuildContext, message?: Message): Promise<void> {
        // Implemented by child classes
        return Promise.resolve();
    }

    public run(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const argString = createArgsString(args);
        this.preExecute(context, message)
            .then(() => {
                Logger.d(Command.name, `Executing command ${args.get('keyword')} with args ${argString}`, context);
                return this.execute(context, source, args, message);
            })
            .then(result => {
                this.onExecuteSucceeded(context, result, message);
            })
            .catch((err: CommandExecutionError) => {
                Logger.w(
                    Command.name,
                    `Execution failed for command ${args.get('keyword')} with args ${argString}\nReason: ${err.msg}`,
                    context
                );
                this.onExecutedFailed(context, err, message);
            });
    }
}

function createArgsString(args: Map<string, any>): string {
    const jsonObject: any = {};
    args.forEach((value, key) => {
        jsonObject[key] = value?.toString() || value;
    });
    return JSON.stringify(jsonObject);
}

export type CommandAck = (Acknowledgement | BotMessage) | (Acknowledgement | BotMessage)[] | void;

export class CommandExecutionError extends Error {
    readonly emoji?: Acknowledgement;
    readonly msg?: string;
    constructor(msg?: string, emoji?: Acknowledgement) {
        super(msg);
        this.msg = msg;
        this.emoji = emoji;
    }
}

export interface CommandOptions {
    name: string;
    keywords: string[];
    group: string;
    descriptions: string[];
    arguments: CommandArgument[];
    permissions?: string[];
    throttleRate?: {count: number; seconds: number};
    file?: FileType;
    examples?: string[];
}

export interface CommandArgument {
    key: string;
    flag?: string;
    description: string;
    required: boolean;
    type: ArgumentType;
    default?: any;
    array?: boolean;
    validate?: (context: GuildContext, arg: any) => boolean;
}

export enum ArgumentType {
    STRING,
    INTEGER,
    NUMBER,
    USER,
    FLAG,
}

export enum FileType {
    AUDIO,
}
