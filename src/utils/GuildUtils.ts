import { GuildChannel, Role, TextChannel, User } from 'discord.js'
import { GuildContext } from '../guild/Context'
import { CommandRegistry } from '../commands/Registry'

export namespace GuildUtils {
    export function parseUserFromUserID(context: GuildContext, userID: string): User {
        return context.getGuild().member(userID).user
    }

    export function parseRoleFromRoleID(context: GuildContext, roleID: string): Role {
        return context.getGuild().roles.resolve(roleID)
    }

    export function createUserMentionString(userID: string): string {
        return `<@${userID}>`
    }

    export function findTextChannelByName(context: GuildContext, name: string): TextChannel {
        let textChannel: GuildChannel = context
            .getGuild()
            .channels.cache.filter((channel) => channel.type === 'text')
            .find((channel) => channel.name == name)
        return textChannel as TextChannel
    }

    export function findTextChannelByID(context: GuildContext, id: string): TextChannel {
        let textChannel: GuildChannel = context
            .getGuild()
            .channels.cache.filter((channel) => channel.type === 'text')
            .find((channel) => channel.id == id)
        return textChannel as TextChannel
    }

    export function isStringACommand(context: GuildContext, input: string): boolean {
        return CommandRegistry.getCommand(context, input) != null
    }

    export function isStringACommandOrCommandGroup(context: GuildContext, input: string): boolean {
        let isCommand = isStringACommand(context, input)
        if (isCommand) {
            return isCommand
        }
        return CommandRegistry.getCommandGroup(input) != null
    }

    export function parseUserFromString(context: GuildContext, input: string): User {
        const id = parseIdFromMention(input)
        if (id) {
            return GuildUtils.parseUserFromUserID(context, id)
        }
        const idFromNickname = context.getConfig().getUserIDForNickname(input)
        if (idFromNickname) {
            return GuildUtils.parseUserFromUserID(context, idFromNickname)
        }
        return context.getGuild().members.cache.find((member) => compareCaseInsensitive(member.displayName, input))
            ?.user
    }

    export function parseRoleFromString(context: GuildContext, input: string): Role {
        const id = parseIdFromMention(input)
        if (id) {
            return GuildUtils.parseRoleFromRoleID(context, id)
        }
        return context
            .getGuild()
            .roles.cache.filter((role) => {
                return compareCaseInsensitive(role.name, input)
            })
            .first()
    }
}

function parseIdFromMention(input: string): string {
    const parsedId = input.match(/^<@!?(\d+)>$/)
    return parsedId?.[1]
}

function compareCaseInsensitive(input1: string, input2: string): boolean {
    return input1.localeCompare(input2, undefined, { sensitivity: 'base' }) === 0
}
