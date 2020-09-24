import {GuildContext} from "../guild/Context"
import {Message, User} from "discord.js"
import {Logger} from "../Logger"

export abstract class Command {
    abstract readonly options: CommandOptions
    protected abstract execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message)
    protected preExecute(context: GuildContext, message?: Message): Promise<any> {
        // Implemented by child classes
        return Promise.resolve()
    }
    protected onPreExecuteFailed(context: GuildContext, message?: Message) {
        context.getProvider().getResponder().acknowledge(1, message)
    }

    public run(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        this.preExecute(context, message).then(() => {
            Logger.d(context, Command.name, `Executing command ${args.get('keyword')}`)
            this.execute(context, source, args, message)
        }).catch(err => {
            Logger.w(context, Command.name, `Execution failed for command ${args.get('keyword')}, reason ${err}`)
            this.onPreExecuteFailed(context, message)
        })
    }
}

export interface CommandOptions {
    name: string
    keywords: string[]
    group: string
    descriptions: string[]
    arguments: CommandArgument[]
    permissions?: string[]
    examples?: string[]
}

export interface CommandArgument {
    key: string
    flag?: string
    description: string
    required: boolean
    type: ArgumentType
    default?: any
    array?: boolean
    validate?: (context: GuildContext, arg: any) => boolean
}

export enum ArgumentType {
    STRING,
    INTEGER,
    NUMBER,
    USER,
    FLAG
}