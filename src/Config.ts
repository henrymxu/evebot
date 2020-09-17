import fs from "fs"
import {FileUtils} from "./utils/FileUtils"
import {Role, User} from "discord.js"

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

    setPrefix(prefix: string) {
        this.json.prefix = prefix
    }

    getDefaultPrivilege(): boolean {
        return this.json.defaultPrivilege
    }

    setDefaultPrivilege(privilege: boolean) {
        this.json.defaultPrivilege = privilege
    }

    getDefaultTextChannel(): string {
        return this.json.defaultTextChannel
    }

    setDefaultTextChannel(textChannelID: string) {
        this.json.defaulTextChannel = textChannelID
    }

    getUserIDForNickname(nickname: string): string {
        return this.json.nicknames[nickname]
    }

    getNicknames(userID: string): Nicknames {
        let nicknames: string[] = Object.values(this.json.nicknames).filter(val => val === userID) as string[]
        return new Set(nicknames || [])
    }

    removeNicknames(userID: string, nicknames: string[]) {
        nicknames.forEach(nickname => {
            this.json.nicknames.delete(nickname)
        })
    }

    addNicknames(userID: string, nicknames: string[]): Error {
        const alreadyHadNickname = []
        nicknames.forEach(nickname => {
            if (this.json.nicknames[nickname]) {
                alreadyHadNickname.push(`${nickname} => ${this.json.nicknames[nickname]}`)
            }
            this.json.nicknames[nickname] = userID
        })
        return alreadyHadNickname.length > 0 ? new Error(alreadyHadNickname.join('\n')) : null
    }

    getCommandNameForAlias(alias: string): string {
        return this.json.aliases[alias]
    }

    getAliases(command: string): Aliases {
        let aliases: string[] = Object.values(this.json.aliases).filter(val => val === command) as string[]
        return new Set(aliases || [])
    }

    removeAliases(command: string, aliases: string[]) {
        aliases.forEach(alias => {
            this.json.aliases.delete(alias)
        })
    }

    addAliases(command: string, aliases: string[]): Error {
        const alreadyHadAlias = []
        aliases.forEach(alias => {
            if (this.json.aliases[alias]) {
                alreadyHadAlias.push(`${alias} => ${this.json.aliases[alias]}`)
            }
            this.json.aliases[alias] = command
        })
        return alreadyHadAlias.length > 0 ? new Error(alreadyHadAlias.join('\n')) : null
    }

    getPrivileges(): Privilege[] {
        const privileges: Privilege[] = []
        Object.keys(this.json.privileges).forEach(key => {
            privileges.push(this.getPrivilege(key))
        })
        return privileges
    }

    hasPrivilege(key: string): boolean {
        return this.json.privileges[key] !== undefined
    }

    getPrivilege(key: string): Privilege {
        let privilege = this.json.privileges[key]
        return privilege ? {
            command: key,
            grantedRoles: new Set(privilege.grantedRoles || []),
            grantedUsers: new Set(privilege.grantedUsers || []),
            deniedRoles: new Set(privilege.deniedRoles || []),
            deniedUsers: new Set(privilege.deniedUsers || [])
        } : null
    }

    deletePrivilege(name: string) {
        this.json.privileges[name] = undefined
    }

    private modifyEntityPrivilege(privilegeName: string, entity: User | Role, isGranting: boolean) {
        let privilege = this.json.privileges[privilegeName] || createPrivilege()
        let baseKey = entity instanceof User ? 'users' : 'roles'
        let addingToKey = `${isGranting ? 'granted' : 'denied'}${baseKey}`
        let removingFromKey = `${isGranting ? 'denied' : 'granted'}${baseKey}`
        privilege[removingFromKey] = removeArrayFromArray(privilege[removingFromKey], [entity.id])
        privilege[addingToKey] = addArrayToArray(privilege[addingToKey], [entity.id])
        this.json.privileges[privilegeName] = privilege
    }

    grantEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            this.modifyEntityPrivilege(privilegeName, entity, true)
        })
    }

    denyEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            this.modifyEntityPrivilege(privilegeName, entity, false)
        })
    }

    removeEntitiesFromPrivilege(privilegeName: string, entities: (User | Role)[]) {
        let privilege = this.json.privileges[privilegeName]
        if (privilege) {
            const ids = entities.map(entity => entity.id)
            privilege.grantedRoles = removeArrayFromArray(privilege.grantedRoles, ids)
            privilege.deniedRoles = removeArrayFromArray(privilege.deniedRoles, ids)
            privilege.grantedUsers = removeArrayFromArray(privilege.grantedUsers, ids)
            privilege.deniedUsers = removeArrayFromArray(privilege.deniedUsers, ids)
        }
    }
}

function createPrivilege(): object {
    return {
        grantedRoles: [],
        grantedUsers: [],
        deniedRoles: [],
        deniedUsers: []
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

export type Aliases = Set<string>

export interface Privilege {
    command: string
    grantedRoles: Set<string>
    grantedUsers: Set<string>
    deniedRoles: Set<string>
    deniedUsers: Set<string>
}
