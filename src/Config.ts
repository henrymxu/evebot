import fs from "fs"
import {FileUtils} from "./utils/FileUtils"

export namespace GuildConfig {
    export function loadConfig(guildId: string): Config {
        const path = `./configs/config_${guildId}.json`
        if (!fs.existsSync(path)) {
            fs.copyFileSync('./default_config.json', path)
        }
        return new Config(FileUtils.openJsonFile(path))
    }

    export function saveConfig(guildId: string, guildConfig: Config) {
        const path = `./configs/config_${guildId}.json`
        fs.writeFile(path, JSON.stringify(guildConfig, null, '\t'), err => {
            if (err) {
                console.log(`An error occured when saving guild ${guildId} config: ${err}`)
            }
        })
    }
}

export class Config {
    private json: any

    constructor(configJSON: any) {
        this.json = configJSON
        //throw ('Attempted to load an invalid config file')
    }

    getPrefix(): string {
        return this.json.prefix
    }

    setPrefix(prefix: string): boolean {
        this.json.prefix = prefix
        return true
    }

    getDefaultTextChannel(): string {
        return this.json.defaultTextChannel
    }

    setDefaultTextChannel(textChannelID: string): boolean {
        this.json.defaulTextChannel = textChannelID
        return true
    }

    getNicknames(userID: string): Nicknames {
        return new Set(this.json.nicknames[userID] || [])
    }

    removeNicknames(userID: string, nicknames: string[]): boolean {
        if (this.json.nicknames[userID]) {
            this.json.nicknames[userID] = removeArrayFromArray(this.json.nicknames[userID], nicknames)
        }
        return true
    }

    addNicknames(userID: string, nicknames: string[]): boolean {
        let result = true
        nicknames.forEach(nickname => {
            if (this.json.nicknames[userID] && this.json.nicknames[userID].indexOf(nickname) !== -1) {
                result = false
            }
            this.json.nicknames[userID] = this.json.nicknames[userID] || []
            this.json.nicknames[userID].push(nickname)
        })
        return result
    }

    getPermissions(): Permission[] {
        const permissions: Permission[] = []
        Object.keys(this.json.permissions).forEach(key => {
            permissions.push(this.getPermission(key))
        })
        return permissions
    }

    hasPermission(key: string): boolean {
        return this.json.permissions[key] !== undefined
    }

    getPermission(key: string): Permission {
        let permission = this.json.permissions[key]
        return {
            command: key,
            allowedRoles: new Set(permission.allowedRoles || []),
            allowedUsers: new Set(permission.allowedUsers || []),
            disallowedRoles: new Set(permission.disallowedRoles || []),
            disallowedUsers: new Set(permission.disallowedUsers || [])
        }
    }

    createPermission(name: string, allowedRoles: string[], allowedUsers: string[],
                     disallowedRoles: string[], disallowedUsers: string[]): boolean {
        if (this.hasPermission(name)) {
            const currentPermission = this.json.permissions[name]
            currentPermission.allowedUsers = addArrayToArray(currentPermission.allowedUsers, allowedUsers)
            currentPermission.allowedRoles = addArrayToArray(currentPermission.allowedRoles, allowedRoles)
            currentPermission.disallowedUsers = addArrayToArray(currentPermission.disallowedUsers, disallowedUsers)
            currentPermission.disallowedRoles = addArrayToArray(currentPermission.disallowedRoles, disallowedRoles)
            this.json.permissions[name] = currentPermission
        } else {
            this.json.permissions[name] = {
                allowedRoles: Array.from(allowedRoles),
                allowedUsers: Array.from(allowedUsers),
                disallowedRoles: Array.from(disallowedRoles),
                disallowedUsers: Array.from(disallowedUsers)
            }
        }
        return true
    }

    deletePermission(name: string, allowedRoles: string[], allowedUsers: string[],
                     disallowedRoles: string[], disallowedUsers: string[]): boolean {
        if (allowedRoles.length === 0 && allowedUsers.length === 0
            && disallowedRoles.length === 0 && disallowedUsers.length == 0) {
            this.json.permissions[name] = undefined
        }
        if (this.hasPermission(name)) {
            const currentPermission = this.json.permissions[name]
            currentPermission.allowedUsers = removeArrayFromArray(currentPermission.allowedUsers, allowedUsers)
            currentPermission.allowedRoles = removeArrayFromArray(currentPermission.allowedRoles, allowedRoles)
            currentPermission.disallowedUsers = removeArrayFromArray(currentPermission.disallowedUsers, disallowedUsers)
            currentPermission.disallowedRoles = removeArrayFromArray(currentPermission.disallowedRoles, disallowedRoles)
            this.json.permissions[name] = currentPermission
        }
        return true
    }
}

function addArrayToArray(current: string[], adds: string[]): string[] {
    adds.forEach(add => {
        if (current.indexOf(add) === -1) { current.push(add) }
    })
    return current
}

function removeArrayFromArray(current: string[] ,removes: string[]): string[] {
    return current.filter(n => removes.indexOf(n) === -1)
}

export type Nicknames = Set<string>

export interface Permission {
    command: string
    allowedRoles: Set<string>
    allowedUsers: Set<string>
    disallowedRoles: Set<string>
    disallowedUsers: Set<string>
}
