import {Keys} from "./Keys"
import {Lifecycle} from "./Lifecycle"
import {GlobalContext} from "./GlobalContext"
import {CommandDispatcher} from "./commands/Dispatcher"
import {CommandRegistry} from "./commands/Registry"
import path from "path"
import {Logger} from "./Logger"

const client = GlobalContext.getClient()
CommandDispatcher.register(client)
CommandRegistry.registerCommandsIn(path.join(__dirname, 'commands'))

Lifecycle.registerJoinOnJoin(client)

client.login(Keys.get('discord_token')).then(result => {
    Logger.i('Main', `Logged in!`)
}).catch(err => {
    Logger.e('Main', `Unable to login, reason: ${err}`)
})

client.on('invalidated', () => {
    Logger.e('Main', `Session was invalidated`)
})
