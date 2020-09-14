import {GuildContext} from "./guild/Context"
import {Client} from "discord.js"

const guildContexts: Map<string, GuildContext> = new Map()
const client = new Client()

export namespace GlobalContext {
    export function get(guildId: string): GuildContext {
        if (!guildContexts.has(guildId)) {
            guildContexts.set(guildId, new GuildContext(guildId))
        }
        return guildContexts.get(guildId)
    }

    export function remove(guildId: string) {
        guildContexts.delete(guildId)
    }

    export function getClient(): Client {
        return client
    }
}