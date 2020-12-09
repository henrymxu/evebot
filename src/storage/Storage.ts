import AWSStorage from './providers/AWSStorage'
import {Keys} from '../Keys'
import LocalStorage from './providers/LocalStorage'
import {GlobalContext} from '../GlobalContext'
import {Utils} from '../utils/Utils'

export interface Storage {
    loadConfig(params: any, defaultValue?: any): Promise<any>
    saveConfig(params: any): Promise<void>
}

const storage: Storage = Keys.get('bot_environment') === 'production' ? new AWSStorage() : new LocalStorage()
const CONFIG_TABLE_NAME = 'Configs'
let keys: string[] = []

export namespace Storage {
    export function loadConfig(guildID: string): Promise<any> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Key: { 'id': guildID }
        }
        return storage.loadConfig(params, GlobalContext.getDefaultConfig()).then((config: any) => {
            if (keys.length == 0) {
                keys = Object.keys(GlobalContext.getDefaultConfig().getJSON())
                keys.concat(Utils.getAllNestedKeysOfObject(GlobalContext.getDefaultConfig().getJSON()))
            }
            if (checkConfigUpToDate(config, GlobalContext.getDefaultConfig().getJSON(), keys)) {
                saveConfig(guildID, config)
            }
            return config
        })
    }

    export function saveConfig(guildID: string, object: any): Promise<void> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Item: { 'id': guildID, 'config': object }
        }
        return storage.saveConfig(params)
    }
}

function checkConfigUpToDate(config: any, defaultConfig: any, defaultConfigKeys: string[]): boolean {
    let updated = false
    defaultConfigKeys.forEach((key: string) => {
        try {
            const value = key.split('.').reduce((o,i) => o[i], config)
            if (value === undefined) {
                const defaultValue = key.split('.').reduce((o,i) => o[i], defaultConfig)
                Utils.dynamicallySetObjectKeyValue(config, key, defaultValue)
                updated = true
            }
        } catch(e) {
            // Ignore
        }
    })
    return updated
}
