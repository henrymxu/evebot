'use strict'

import {FileUtils} from "./utils/FileUtils";

/**
 * Class to retrieve keys from environment variables or json file
 */
export default class Keys {
    private static instance: Keys
    private keys: Map<string, string>
    private constructor() {
        this.keys = new Map()
        this.loadKeysFromJson()
    }

    static getInstance(): Keys {
        if (!this.instance) {
            this.instance = new Keys()
        }
        return this.instance
    }

    static get(key: string): string {
        return this.getInstance().keys.get(key) || process.env[key]
    }

    private loadKeysFromJson() {
        const json = FileUtils.openJsonFile('./keys.json')
        Object.keys(json).forEach(key => {
            this.keys.set(key, json[key])
        })
    }
}
