import {GuildContext} from "./guild/Context"
import {Client} from "discord.js"

const guildContexts: Map<string, GuildContext> = new Map()
const client = new Client()

export namespace GlobalContext {
    export async function get(guildId: string): Promise<GuildContext> {
        if (!guildContexts.has(guildId)) {
            guildContexts.set(guildId, new GuildContext(guildId))
            await guildContexts.get(guildId).initialize()
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