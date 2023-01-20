#!/usr/bin/env node

import {Keys} from './Keys';
import {Lifecycle} from './voice/Lifecycle';
import {GlobalContext} from './GlobalContext';
import {CommandDispatcher} from './commands/Dispatcher';
import {CommandRegistry} from './commands/Registry';
import {Logger} from './Logger';
import {Directory} from './Directory';

const client = GlobalContext.getClient();
Logger.i('Main', 'Registering Commands ...');
CommandDispatcher.register(client);
CommandRegistry.registerCommandsIn(Directory.relativeSource('commands'));

Lifecycle.registerVoiceLifecycleHandler(client);

Logger.i('Main', 'Logging in ...');
client
    .login(Keys.get('discord_token'))
    .then(result => {
        Logger.i('Main', 'Logged in!');
    })
    .catch(err => {
        Logger.e('Main', `Unable to login, reason: ${err}`);
        process.abort();
    });

client.on('invalidated', () => {
    Logger.e('Main', 'Session was invalidated');
});
