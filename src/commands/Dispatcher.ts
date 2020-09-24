import {Client, DMChannel, Message, Permissions, TextChannel, User} from "discord.js"
import {CommandParser} from "./Parser"
import {GlobalContext} from "../GlobalContext"
import {GuildContext} from "../guild/Context"
import {CommandRegistry} from "./Registry"
import {Logger} from "../Logger"
import {Command} from "./Command"

const TAG = "CommandDispatcher"

export namespace CommandDispatcher {
    export function register(client: Client) {
        client.on('message', (message) => {
            if (message.author.bot) {
                return
            }
            if (message.channel instanceof TextChannel) {
                handleTextChannelMessage(message)
            } else if (message.channel instanceof DMChannel) {
                handleDMChannelMessage(message)
            }
        })
    }

    // Assumes that the command does not include the prefix
    export function handleExplicitCommand(context: GuildContext, user: User, message: string) {
        const prefix = context.getPrefix()
        // Check Voice Command Permissions
        handleGuildCommand(context, `${prefix}${message}`, user)
    }
}

function handleGuildCommand(context: GuildContext, commandString: string, source: User, message?: Message) {
    const keywordResult = CommandParser.parseKeyword(context, commandString)
    if (!keywordResult.keyword) {
        return
    }
    const command = CommandRegistry.getCommand(context, keywordResult.keyword)
    if (!command) {
        Logger.w(context, TAG,`No command found for ${keywordResult.keyword}`)
        return
    }
    const result = CommandParser.parseArguments(context, command, keywordResult.keyword, keywordResult.parsedCommandString)
    if (result.error) {
        Logger.w(context, TAG, `Could not parse arguments for ${commandString}, reason ${result.error}`)
        return
    }
    if (result.help) {
        // TODO: send help command instead of executing
    }
    if (!checkPermissions(context, source, command)) {
        Logger.w(context, command.options.name, `${source.username} does not have permissions to execute ${keywordResult.keyword}`)
        return
    }
    if (!checkPrivileges(context, source, keywordResult.keyword)) {
        Logger.w(context, command.options.name, `${source.username} does not have privileges to execute ${keywordResult.keyword}`)
        return
    }
    command.run(context, source, result.args, message)
}

function handleTextChannelMessage(message: Message) {
    GlobalContext.get(message.guild.id).then(context => {
        context.setTextChannel(message.channel as TextChannel)
        handleGuildCommand(context, message.content, message.author, message)
    })
}

function handleDMChannelMessage(message: Message) {

}

function checkPermissions(context: GuildContext, user: User, command: Command): boolean {
    const permission = command.options.permissions
    if (!permission) {
        return true
    }
    // @ts-ignore
    return context.getGuild().member(user).permissions.has(new Permissions(permission))
}

function checkPrivileges(context: GuildContext, user: User, keyword: string): boolean {
    if (context.getGuild().member(user).permissions.has('ADMINISTRATOR')) {
        return true
    }
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