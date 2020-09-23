import AWSStorage from "./providers/AWSStorage"
import {Keys} from "../Keys"
import LocalStorage from "./providers/LocalStorage"

export interface Storage {
    load(guildID: string): Promise<any>
    save(guildID: string, object: any): Promise<void>
}

const storage: Storage = Keys.get('bot_environment') == 'production' ? new AWSStorage() : new LocalStorage()

export namespace Storage {
    export function loadConfig(guildID: string): Promise<any> {
        return storage.load(guildID)
    }
    export function saveConfig(guildID: string, object: any): Promise<void> {
        return storage.save(guildID, object)
    }
}