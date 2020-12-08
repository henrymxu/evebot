import NodeCache from 'node-cache'
import {User} from 'discord.js'
import {Command} from '../commands/Command'

export default class Throttler {
    private cache: NodeCache = new NodeCache()

    shouldThrottleCommand(executor: User, command: Command): boolean {
        if (!command.options.throttleRate) {
            return false
        }
        const key = `${executor.id}${command.options.name}`
        if (!this.cache.has(key)) {
            this.cache.set(key, [], command.options.throttleRate.seconds)
        }
        let prevCommands: any[] = this.cache.get(key) || []
        if (prevCommands.length > command.options.throttleRate.count) {
            return true
        }
        prevCommands.push({})
        this.cache.set(key, prevCommands, command.options.throttleRate.seconds)
        return false
    }
}
