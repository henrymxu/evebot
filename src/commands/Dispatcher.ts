import {Client, DMChannel, Message, MessageAttachment, Permissions, PermissionString, TextChannel, User} from 'discord.js'
import {CommandParser} from './Parser'
import {GlobalContext} from '../GlobalContext'
import {GuildContext} from '../guild/Context'
import {CommandRegistry} from './Registry'
import {Logger} from '../Logger'
import {Command, FileType} from './Command'

const TAG = 'CommandDispatcher'

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
    let keywordResult = CommandParser.parseKeyword(context, commandString)
    if (!keywordResult.keyword) {
        return
    }
    if (context.getConfig().getMacro(keywordResult.keyword)) {
        commandString = `${context.getPrefix()}${context.getConfig().getMacro(keywordResult.keyword).command}`
        keywordResult = CommandParser.parseKeyword(context, commandString)
        if (!keywordResult.keyword) {
            Logger.w(TAG, `${keywordResult.keyword} macro has an invalid keyword`, context)
            return
        }
    }
    const command = CommandRegistry.getCommand(context, keywordResult.keyword)
    if (!command) {
        Logger.w(TAG, `No command found for ${keywordResult.keyword}`, context)
        return
    }
    if (!checkPermissions(context, source, command)) {
        Logger.w(command.options.name, `${source.username} does not have permissions to execute ${keywordResult.keyword}`, context)
        context.getProvider().getResponder().acknowledge(1, message)
        return
    }
    if (!checkPrivileges(context, source, keywordResult.keyword)) {
        Logger.w(command.options.name, `${source.username} does not have privileges to execute ${keywordResult.keyword}`, context)
        context.getProvider().getResponder().acknowledge(1, message)
        return
    }
    if (context.getProvider().getThrottler().shouldThrottleCommand(source, command)) {
        Logger.w(command.options.name, `${source.username} is being throttled so they cannot execute ${keywordResult.keyword}`, context)
        context.getProvider().getResponder().acknowledge(1, message)
        return
    }
    const result = CommandParser.parseArguments(context, command, keywordResult.keyword, keywordResult.parsedCommandString)
    if (result.error) {
        Logger.w(TAG, `Could not parse arguments for ${commandString}, reason ${result.error}`, context)
        context.getProvider().getResponder().acknowledge(1, message)
        return
    }
    if (result.help) {
        // TODO: send help command instead of executing
    }
    if (!command.options.file) {
        const attachment = message?.attachments?.first()
        if (attachment && checkFileType(attachment, command.options.file)) {
            result.args.set('file', attachment)
        }
    }
    command.run(context, source, result.args, message)
}

function handleTextChannelMessage(message: Message) {
    if (!message.guild?.id) {
        return
    }
    GlobalContext.get(message.guild.id).then(context => {
        context.setTextChannel(message.channel as TextChannel)
        handleGuildCommand(context, message.content, message.author, message)
    })
}

function handleDMChannelMessage(message: Message) {
    // TODO: handle private messages
}

function checkPermissions(context: GuildContext, user: User, command: Command): boolean {
    const permissionsArray = command.options.permissions?.map(permission => permission as PermissionString)
    if (!permissionsArray) {
        return true
    }
    const permissions = context.getGuild().member(user)?.permissions
    return permissions ? permissions.has(new Permissions(permissionsArray)) : false
}

function checkPrivileges(context: GuildContext, user: User, keyword: string): boolean {
    if (context.getGuild()?.member(user)?.permissions.has('ADMINISTRATOR')) {
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
    const roles = context.getGuild().member(user)?.roles.cache
    if (!roles) {
        return false
    }
    for (let role of Object.keys(roles)) {
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

function checkFileType(attachment: MessageAttachment, type: FileType | undefined): boolean {
    if (attachment) {
        switch(type) {
            case FileType.AUDIO : {
                return attachment.url.endsWith('mp3') || attachment.url.endsWith('opus') ||
                    attachment.url.endsWith('ogg') || attachment.url.endsWith('wav')
            }
        }
    }
    return true
}
