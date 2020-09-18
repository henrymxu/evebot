import {GuildContext} from "./guild/Context"

export namespace Logger {
    export function i(context: GuildContext, tag: string, log: string) {
        console.info(`${tag}: ${log}`)
    }

    export function e(context: GuildContext, tag: string, log: string) {
        console.error(`${tag}: ${log}`)
    }

    export function d(context: GuildContext, tag: string, log: string) {
        console.debug(`${tag}: ${log}`)
    }

    export function w(context: GuildContext, tag: string, log: string) {
        console.warn(`${tag}: ${log}`)
    }
}