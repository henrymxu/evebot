import {GuildContext} from "./guild/Context"
import {Client} from "discord.js"

const guildContexts: Map<string, GuildContext> = new Map()
const client = new Client()

export namespace GlobalContext {
    export async function get(guildID: string): Promise<GuildContext> {
        let context = guildContexts.get(guildID)
        if (!context) {
            context = new GuildContext(guildID)
            guildContexts.set(guildID, context)
            await context.initialize()
        }
        return context
    }

    export function remove(guildID: string) {
        guildContexts.delete(guildID)
    }

    export function getClient(): Client {
        return client
    }

    export function getBotID(): string {
        const id = client.user?.id
        if (!id) {
            throw Error('Bot ID should never not exist')
        }
        return id
    }
}