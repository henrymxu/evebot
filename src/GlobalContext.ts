import {GuildContext} from './guild/Context';
import {Client} from 'discord.js';
import {execSync} from 'child_process';
import {Config} from './guild/Config';
import {FileUtils} from './utils/FileUtils';
import {DefaultConfig} from './guild/DefaultConfig';
import {Directory} from './Directory';
import {Utils} from './utils/Utils';

const guildContexts: Map<string, GuildContext> = new Map();
const client = new Client();
const defaultConfig = new DefaultConfig(FileUtils.openJsonFile(Directory.relativeResources('default_config.json')));

export namespace GlobalContext {
    export async function get(guildID: string): Promise<GuildContext> {
        let context = guildContexts.get(guildID);
        if (!context) {
            context = new GuildContext(guildID);
            guildContexts.set(guildID, context);
            await context.initialize();
        }
        return context;
    }

    export function getDefaultConfig(): Config {
        return defaultConfig;
    }

    export function remove(guildID: string) {
        guildContexts.delete(guildID);
    }

    export function getClient(): Client {
        return client;
    }

    export function getBotID(): string {
        const id = client.user?.id;
        if (!id) {
            throw new Error('Bot ID should never not exist');
        }
        return id;
    }

    export function getMemoryUsage(): number[] {
        return [
            process.memoryUsage().heapUsed / 1000000,
            process.memoryUsage().heapTotal / 1000000,
            process.memoryUsage().external / 1000000,
            process.memoryUsage().rss / 1000000,
            process.memoryUsage().arrayBuffers,
        ];
    }

    export function getBotVersion(): string {
        let version: string;
        // execSync('git branch --show-current');
        try {
            version = `(Git Hash) ${execSync("git log --pretty=format:'%h' -n 1").toString()}`;
        } catch (e) {
            version = `(NPM Version) ${require('../package.json').version}` || 'Unavailable';
        }
        return version;
    }

    export function getUptime(): string {
        return Utils.convertSecondsToTimeString(process.uptime());
    }
}
