import {GuildContext} from "../guild/Context"
import {Message, User} from "discord.js"

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
        if (!checkPrivileges(context, source, args.get('keyword'))) {
            console.log(`${source.username} does not have privilege to execute ${args.get('keyword')}`)
            return
        }
        this.preExecute(context, message).then(() => {
            console.log(`Executing command ${args.get('keyword')}`)
            this.execute(context, source, args, message)
        }).catch(err => {
            console.log(`Did not execute command ${args.get('keyword')}, execute failed ${err}`)
            this.onPreExecuteFailed(context, message)
        })
    }
}

//TODO: also check user permissions
function checkPrivileges(context: GuildContext, user: User, keyword: string): boolean {
    const privilege = context.getConfig().getPrivilege(keyword)
    if (!privilege ||
        privilege.grantedRoles.size === 0 && privilege.grantedUsers.size === 0 &&
        privilege.deniedRoles.size === 0 && privilege.deniedUsers.size === 0) {
        return context.getConfig().getDefaultPrivilege()
    }
    if (privilege.grantedUsers.has(user.id)) {
        return true
    }
    if (privilege.deniedUsers.has(user.id)) {
        return false
    }
    for (let role of Object.keys(context.getGuild().member(user).roles.cache)) {
        if (privilege.grantedRoles.has(role)) {
            return true
        }
        if (privilege.deniedRoles.has(role)) {
            return false
        }
    }
    if (privilege.grantedRoles.size === 0 && privilege.grantedUsers.size === 0 &&
        privilege.deniedRoles.size !== 0 && privilege.deniedUsers.size !== 0) {
        return true
    }
    if (privilege.grantedRoles.size !== 0 && privilege.grantedUsers.size !== 0 &&
        privilege.deniedRoles.size === 0 && privilege.deniedUsers.size === 0) {
        return false
    }
    return false
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
    STRING,
    INTEGER,
    NUMBER,
    USER,
    FLAG
}