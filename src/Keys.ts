import {FileUtils} from "./utils/FileUtils";

/**
 * Class to retrieve keys from environment variables or json file
 */
const keys: Map<string, string> = loadKeysFromJson()
export namespace Keys {
    export function get(key: string): string {
        return keys.get(key) || process.env[key]!
    }
}

function loadKeysFromJson(): Map<string, string> {
    const keys: Map<string, string> = new Map()
    const json = FileUtils.openJsonFile('./keys.json')
    Object.keys(json).forEach(key => {
        keys.set(key, json[key])
    })
    return keys
}