import AWSStorage from './providers/AWSStorage'
import { Keys } from '../Keys'
import LocalStorage from './providers/LocalStorage'
import { FileUtils } from '../utils/FileUtils'

export interface Storage {
    load(params: any, defaultValue?: any): Promise<any>
    save(params: any): Promise<void>
}

const storage: Storage = Keys.get('bot_environment') == 'production' ? new AWSStorage() : new LocalStorage()
const CONFIG_TABLE_NAME = 'Configs'

export namespace Storage {
    const defaultConfig = FileUtils.openJsonFile('./default_config.json')

    export function loadConfig(guildID: string): Promise<any> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Key: { id: guildID },
        }
        return storage.load(params, defaultConfig)
    }

    export function saveConfig(guildID: string, object: any): Promise<void> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Item: { id: guildID, config: object },
        }
        return storage.save(params)
    }
}
