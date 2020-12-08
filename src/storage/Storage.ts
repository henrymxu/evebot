import AWSStorage from './providers/AWSStorage'
import {Keys} from '../Keys'
import LocalStorage from './providers/LocalStorage'
import {FileUtils} from '../utils/FileUtils'
import {GlobalContext} from '../GlobalContext'

export interface Storage {
    loadConfig(params: any, defaultValue?: any): Promise<any>
    saveConfig(params: any): Promise<void>
}

const storage: Storage = Keys.get('bot_environment') === 'production' ? new AWSStorage() : new LocalStorage()
const CONFIG_TABLE_NAME = 'Configs'

export namespace Storage {
    export function loadConfig(guildID: string): Promise<any> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Key: { 'id': guildID }
        }
        return storage.loadConfig(params, GlobalContext.getDefaultConfig())
    }

    export function saveConfig(guildID: string, object: any): Promise<void> {
        const params = {
            TableName: CONFIG_TABLE_NAME,
            Item: { 'id': guildID, 'config': object }
        }
        return storage.saveConfig(params)
    }
}