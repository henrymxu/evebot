import {FileUtils} from './utils/FileUtils';
import {ProcessArguments} from './ProcessArguments';

const DEFAULT_PATH = './keys.json';
const keys: Map<string, string> = loadKeysFromJson(ProcessArguments.getKeysPath());

/**
 * Class to retrieve keys from environment variables or json file
 */
export namespace Keys {
    export function get(key: string): string {
        return keys.get(key) || process.env[key]!;
    }
}

function loadKeysFromJson(path = DEFAULT_PATH): Map<string, string> {
    const keys: Map<string, string> = new Map();
    const json = FileUtils.openJsonFile(path);
    Object.keys(json).forEach(key => {
        keys.set(key, json[key]);
    });
    return keys;
}
