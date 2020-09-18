'use strict'

import {Keys} from "./Keys"
import {Lifecycle} from "./Lifecycle"
import {GlobalContext} from "./GlobalContext"
import {CommandDispatcher} from "./commands/Dispatcher"
import {CommandRegistry} from "./commands/Registry"
import path from "path"

const client = GlobalContext.getClient()
CommandDispatcher.register(client)
CommandRegistry.registerCommandsIn(path.join(__dirname, 'commands'))

Lifecycle.registerJoinOnJoin(client)

client.login(Keys.get('discord_token')).then(result => {
    console.log(`Logged in!`)
}).catch(err => {
    console.log(`Unable to login! ${err}`)
})

client.on('invalidated', () => {
    console.log('Session invalidated')
})
