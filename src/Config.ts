import {Guild} from "discord.js"
import fs from "fs"
import {FileUtils} from "./utils/FileUtils"

const configs: Map<string, object> = new Map()

export namespace GuildConfig {
    export function getConfig(guildId: string): object {
        if (!configs.has(guildId)) {
            configs.set(guildId, loadConfig(guildId))
        }
        return configs.get(guildId)
    }

    function loadConfig(guildId: string): object {
        const path = `./configs/config_${guildId}.json`
        if (!fs.existsSync(path)) {
            fs.copyFileSync('./default_config.json', path)
        }
        return FileUtils.openJsonFile(path)
    }

    export function saveConfig(guildId: string, guildConfig: object) {
        const path = `./configs/config_${guildId}.json`
        fs.writeFile(path, JSON.stringify(guildConfig, null, '\t'), err => {
            if (err) {
                console.log(`An error occured when saving guild ${guildId} config: ${err}`)
            }
        })
    }

    export function setNewConfigParameter(guild: Guild, type: string, key: string, value: string) {
        console.log(`Setting Config: ${guild.id}, Type: ${type}, KV: {${key}, ${value}}`)
        let config = getConfig(guild.id)
        if (key) {
            config[type][key] = value
        } else {
            config[type] = value
        }
        saveConfig(guild.id, config)
        configs.set(guild.id, config)
    }

    export function getCurrentConfigParameter(guild: Guild, type: string): object {
        console.log(`Retrieving Config: ${guild.id}, Type: ${type}`)
        let config = getConfig(guild.id)
        return config[type]
    }
}
