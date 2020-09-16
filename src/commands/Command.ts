import {GuildContext} from "../guild/Context"
import {Guild, Message, User} from "discord.js"

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
            console.log(`Executing command ${args.get('keyword')}`)
            this.execute(context, source, args, message)
        }).catch(err => {
            console.log(`Did not execute command ${args.get('keyword')}, execute failed ${err}`)
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
    example?: string
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
    string,
    integer,
    number,
    user,
    flag
}