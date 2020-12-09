import {Role, User} from 'discord.js'
import {Storage} from '../storage/Storage'
import {CommandRegistry} from '../commands/Registry'
import {Aliases, Config, Emojis, Logging, Macro, Nicknames, Privilege} from './Config'

export class ConfigImplementation implements Config {
    private readonly guildID: string
    protected json: any

    constructor(guildID: string) {
        this.guildID = guildID
    }

    async load() {
        this.json = await Storage.loadConfig(this.guildID)
    }

    save() {
        Storage.saveConfig(this.guildID, this.json)
    }

    getJSON(): any {
        return this.json
    }

    getPrefix(): string {
        return this.json['prefix']
    }

    setPrefix(prefix: string) {
        ConfigImplementation.setKeyValue(this, 'prefix', prefix)
    }

    getDefaultPrivilege(): boolean {
        return this.json['defaultPrivilege']
    }

    setDefaultPrivilege(privilege: boolean) {
        return ConfigImplementation.setKeyValue(this, 'defaultPrivilege', privilege)
    }

    getDefaultTextChannel(): string {
        return this.json['defaultTextChannel']
    }

    setDefaultTextChannel(textChannelID: string) {
        return ConfigImplementation.setKeyValue(this, 'defaultTextChannel', textChannelID)
    }

    getLogging(): Logging {
        return this.json['logging']
    }

    setLogging(channelID: string, level: string) {
        return ConfigImplementation.setKeyValue(this, 'logging', {
            'channelID': channelID,
            'flags': level
        })
    }

    getUserIDForNickname(nickname: string): string {
        return this.json['nicknames'][nickname]
    }

    getNicknames(userID: string): Nicknames {
        return ConfigImplementation.getValuesOfUniqueKeyAsSet(this, 'nicknames', userID)
    }

    removeNicknames(userID: string, nicknames: string[]) {
        ConfigImplementation.removeKeysFromMap(this, 'nicknames', nicknames)
    }

    addNicknames(userID: string, nicknames: string[]): Error | null {
        return ConfigImplementation.addUniqueKeyToMap(this, 'nicknames', nicknames, userID, (config, key) => {
            return config.json['nicknames'][key]
        })
    }

    getCommandNameFromAlias(alias: string): string {
        return this.json['aliases'][alias]
    }

    getAliases(command: string): Aliases {
        return ConfigImplementation.getValuesOfUniqueKeyAsSet(this, 'aliases', command)
    }

    removeAliases(command: string, aliases: string[]) {
        ConfigImplementation.removeKeysFromMap(this, 'aliases', aliases)
    }

    addAliases(command: string, aliases: string[]): Error | null {
        return ConfigImplementation.addUniqueKeyToMap(this, 'aliases', aliases, command, ConfigImplementation.isAlreadyProtectedKeyword)
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

    addMacro(macroKey: string, macro: Macro): Error | null {
        if (ConfigImplementation.isAlreadyProtectedKeyword(this, macroKey)) {
            return Error('Keyword already exists as Macro / Alias / Command')
        }
        this.json['macros'][macroKey] = macro
        this.save()
        return null
    }

    getPrivileges(): Privilege[] {
        const privileges: Privilege[] = []
        Object.keys(this.json['privileges']).forEach(key => {
            privileges.push(this.getPrivilege(key)!)
        })
        return privileges
    }

    hasPrivilege(key: string): boolean {
        return this.json['privileges'][key] !== undefined
    }

    getPrivilege(key: string): Privilege | undefined {
        let privilege = this.json['privileges'][key]
        return privilege ? {
            command: key,
            grantedRoles: new Set(privilege.grantedRoles || []),
            grantedUsers: new Set(privilege.grantedUsers || []),
            deniedRoles: new Set(privilege.deniedRoles || []),
            deniedUsers: new Set(privilege.deniedUsers || [])
        } : undefined
    }

    deletePrivilege(name: string) {
        delete this.json['privileges'][name]
        this.save()
    }

    grantEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            ConfigImplementation.modifyEntityPrivilege(this, privilegeName, entity, true)
        })
    }

    denyEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            ConfigImplementation.modifyEntityPrivilege(this, privilegeName, entity, false)
        })
    }

    removeEntitiesFromPrivilege(privilegeName: string, entities: (User | Role)[]) {
        let privilege = this.json['privileges'][privilegeName]
        if (privilege) {
            const ids = entities.map(entity => entity.id)
            privilege.grantedRoles = removeArrayFromArray(privilege.grantedRoles, ids)
            privilege.deniedRoles = removeArrayFromArray(privilege.deniedRoles, ids)
            privilege.grantedUsers = removeArrayFromArray(privilege.grantedUsers, ids)
            privilege.deniedUsers = removeArrayFromArray(privilege.deniedUsers, ids)
        }
    }

    getEmoji(type: string): string {
        return this.json['acknowledgement_emojis'][type]
    }
    getEmojis(): Emojis {
        return new Map<string, string>(Object.entries(this.json['acknowledgement_emojis']))
    }
    setEmoji(type: string, emoji: string): void {
        this.json['acknowledgement_emojis'][type] = emoji
        this.save()
    }

    private static modifyEntityPrivilege(config: ConfigImplementation, privilegeName: string, entity: User | Role, isGranting: boolean) {
        let privilege = config.json['privileges'][privilegeName] || createPrivilege()
        let baseKey = entity instanceof User ? 'Users' : 'Roles'
        let addingToKey = `${isGranting ? 'granted' : 'denied'}${baseKey}`
        let removingFromKey = `${isGranting ? 'denied' : 'granted'}${baseKey}`
        privilege[removingFromKey] = removeArrayFromArray(privilege[removingFromKey], [entity.id])
        privilege[addingToKey] = addArrayToArray(privilege[addingToKey], [entity.id])
        config.json.privileges[privilegeName] = privilege
        config.save()
    }

    private static setKeyValue(config: ConfigImplementation, key: string, value: any) {
        config.json[key] = value
        config.save()
    }

    private static addUniqueKeyToMap(config: ConfigImplementation, entry: string, keys: string[], value: string,
                                     validate?: (arg0: ConfigImplementation, arg1: string) => boolean): Error | null {
        const alreadyHad: string[] = []
        keys.forEach(key => {
            if (validate && validate(config, key)) {
                alreadyHad.push(`${key} => ${config.json[entry][key]}`)
            }
            config.json[entry][key] = value
        })
        config.save()
        return alreadyHad.length > 0 ? new Error(alreadyHad.join('\n')) : null
    }

    private static removeKeysFromMap(config: ConfigImplementation, entry: string, keys: string[]) {
        keys.forEach(key => {
            config.json[entry]?.delete(key)
        })
        config.save()
    }

    private static getValuesOfUniqueKeyAsSet(config: ConfigImplementation, entry: string, value: string): Set<string> {
        let values: string[] = Object.values(config.json[entry]).filter(val => val === value) as string[]
        return new Set(values || [])
    }

    private static isAlreadyProtectedKeyword(config: ConfigImplementation, keyword: string): boolean {
        return !!(config.getMacro(keyword) || config.getCommandNameFromAlias(keyword) || CommandRegistry.getCommands().has(keyword))

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

function createPrivilege(): object {
    return {
        grantedRoles: [],
        grantedUsers: [],
        deniedRoles: [],
        deniedUsers: []
    }
}
