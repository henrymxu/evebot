import {GuildChannel, Role, TextChannel, User} from "discord.js"
import {GuildContext} from "../guild/Context"
import {GlobalContext} from "../GlobalContext"

export namespace GuildUtils {
    export function getUserFromUserID(context: GuildContext, userID: string): User {
        return context.getGuild().member(userID).user
    }

    export function getRoleFromRoleID(context: GuildContext, roleID: string): Role {
        return context.getGuild().roles.resolve(roleID)
    }

    export function createUserMentionString(userID: string): string {
        return `<@${userID}>`
    }

    export function findTextChannelByName(context: GuildContext, name: string): TextChannel {
        let textChannel: GuildChannel = context.getGuild().channels.cache.filter(channel => channel.type === 'text')
            .find(channel => channel.name == name)
        return textChannel as TextChannel
    }

    export function findTextChannelByID(context: GuildContext, id: string): TextChannel {
        let textChannel: GuildChannel = context.getGuild().channels.cache.filter(channel => channel.type === 'text')
            .find(channel => channel.id == id)
        return textChannel as TextChannel
    }
}
