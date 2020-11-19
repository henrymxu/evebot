import {Role, User} from "discord.js"
import {Storage} from "../storage/Storage"
import {CommandRegistry} from "../commands/Registry"

export class Config {
    private readonly guildID: string
    private json: any

    constructor(guildID: string) {
        this.guildID = guildID
    }

    public async load() {
        this.json = await Storage.loadConfig(this.guildID)
    }

    public save() {
        Storage.saveConfig(this.guildID, this.json)
    }

    getJSON(): string {
        return JSON.stringify(this.json, null, 4)
    }

    getPrefix(): string {
        return this.json.prefix
    }

    setPrefix(prefix: string) {
        Config.setKeyValue(this, 'prefix', prefix)
    }

    getDefaultPrivilege(): boolean {
        return this.json.defaultPrivilege
    }

    setDefaultPrivilege(privilege: boolean) {
        return Config.setKeyValue(this, 'defaultPrivilege', privilege)
    }

    getDefaultTextChannel(): string {
        return this.json.defaultTextChannel
    }

    setDefaultTextChannel(textChannelID: string) {
        return Config.setKeyValue(this, 'defaultTextChannel', textChannelID)
    }

    getLogging(): Logging {
        return this.json.logging
    }

    setLogging(channelID: string, level: string) {
        return Config.setKeyValue(this, 'logging', {
            "channelID": channelID,
            "flags": level
        })
    }

    getUserIDForNickname(nickname: string): string {
        return this.json.nicknames[nickname]
    }

    getNicknames(userID: string): Nicknames {
        return Config.getValuesOfUniqueKeyAsSet(this, 'nicknames', userID)
    }

    removeNicknames(userID: string, nicknames: string[]) {
        Config.removeKeysFromMap(this, 'nicknames', nicknames)
    }

    addNicknames(userID: string, nicknames: string[]): Error {
        return Config.addUniqueKeyToMap(this, 'nicknames', nicknames, userID, (config, key) => {
            return config.json['nicknames'][key]
        })
    }

    getCommandNameFromAlias(alias: string): string {
        return this.json.aliases[alias]
    }

    getAliases(command: string): Aliases {
        return Config.getValuesOfUniqueKeyAsSet(this, 'aliases', command)
    }

    removeAliases(command: string, aliases: string[]) {
        Config.removeKeysFromMap(this, 'aliases', aliases)
    }

    addAliases(command: string, aliases: string[]): Error {
        return Config.addUniqueKeyToMap(this, 'aliases', aliases, command, Config.isAlreadyProtectedKeyword)
    }

    getMacro(macroKey: string): Macro {
        return this.json['macros'][macroKey]
    }

    getMacros(): Map<string, Macro> {
        return new Map<string, Macro>(Object.entries(this.json['macros']))
    }

    removeMacro(macroKey: string) {
        delete this.json['macros'][macroKey]
        this.save()
    }

    addMacro(macroKey: string, macro: Macro): Error {
        if (Config.isAlreadyProtectedKeyword(this, macroKey)) {
            return Error('Keyword already exists as Macro / Alias / Command')
        }
        this.json['macros'][macroKey] = macro
        this.save()
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
        this.json.privileges.delete(name)
        this.save()
    }

    grantEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            Config.modifyEntityPrivilege(this, privilegeName, entity, true)
        })
    }

    denyEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        console.log(`deny ${entities}`)
        entities.forEach(entity => {
            Config.modifyEntityPrivilege(this, privilegeName, entity, false)
        })
    }

    removeEntitiesFromPrivilege(privilegeName: string, entities: (User | Role)[]) {
        console.log(`remove ${entities}`)
        let privilege = this.json.privileges[privilegeName]
        if (privilege) {
            const ids = entities.map(entity => entity.id)
            privilege.grantedRoles = removeArrayFromArray(privilege.grantedRoles, ids)
            privilege.deniedRoles = removeArrayFromArray(privilege.deniedRoles, ids)
            privilege.grantedUsers = removeArrayFromArray(privilege.grantedUsers, ids)
            privilege.deniedUsers = removeArrayFromArray(privilege.deniedUsers, ids)
        }
    }

    private static modifyEntityPrivilege(config: Config, privilegeName: string, entity: User | Role, isGranting: boolean) {
        let privilege = config.json.privileges[privilegeName] || createPrivilege()
        let baseKey = entity instanceof User ? 'Users' : 'Roles'
        let addingToKey = `${isGranting ? 'granted' : 'denied'}${baseKey}`
        let removingFromKey = `${isGranting ? 'denied' : 'granted'}${baseKey}`
        privilege[removingFromKey] = removeArrayFromArray(privilege[removingFromKey], [entity.id])
        privilege[addingToKey] = addArrayToArray(privilege[addingToKey], [entity.id])
        config.json.privileges[privilegeName] = privilege
        config.save()
    }

    private static setKeyValue(config: Config, key: string, value: any) {
        config.json[key] = value
        config.save()
    }

    private static addUniqueKeyToMap(config: Config, entry: string, keys: string[], value: string,
                                     validate?: (Config, string) => boolean): Error {
        const alreadyHad = []
        keys.forEach(key => {
            if (validate(Config, key)) {
                alreadyHad.push(`${key} => ${config.json[entry][key]}`)
            }
            config.json[entry][key] = value
        })
        config.save()
        return alreadyHad.length > 0 ? new Error(alreadyHad.join('\n')) : null
    }

    private static removeKeysFromMap(config: Config, entry: string, keys: string[]) {
        keys.forEach(key => {
            config[entry]?.delete(key)
        })
        config.save()
    }

    private static getValuesOfUniqueKeyAsSet(config: Config, entry: string, value: string): Set<string> {
        let values: string[] = Object.values(config.json[entry]).filter(val => val === value) as string[]
        return new Set(values || [])
    }

    private static isAlreadyProtectedKeyword(config: Config, keyword: string): boolean {
        return !!(config.getMacro(keyword) || config.getCommandNameFromAlias(keyword) || CommandRegistry.getCommands().has(keyword))

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

export type Macro = {
    command: string
    creator: string
}

export interface Privilege {
    command: string
    grantedRoles: Set<string>
    grantedUsers: Set<string>
    deniedRoles: Set<string>
    deniedUsers: Set<string>
}

export interface Logging {
    channelID: string
    flag: string
}