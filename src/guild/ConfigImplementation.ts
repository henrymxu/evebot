import {Role, User} from 'discord.js';
import {Storage} from '../storage/Storage';
import {CommandRegistry} from '../commands/Registry';
import {Aliases, Config, Emojis, Logging, Macro, Nicknames, Privilege} from './Config';
import {Language} from '../LanguageDictionary';

export class ConfigImplementation implements Config {
    private readonly guildID: string;
    protected json: any;

    constructor(guildID: string) {
        this.guildID = guildID;
    }

    async load() {
        this.json = await Storage.loadConfig(this.guildID);
    }

    save() {
        Storage.saveConfig(this.guildID, this.json);
    }

    getJSON(): any {
        return this.json;
    }

    getPrefix(): string {
        return this.json['prefix'];
    }

    setPrefix(prefix: string) {
        ConfigImplementation.setKeyValue(this, 'prefix', prefix);
    }

    getLanguage(): Language {
        return this.json['language'];
    }

    setLanguage(language: Language) {
        ConfigImplementation.setKeyValue(this, 'language', language);
    }

    getDefaultPrivilege(): boolean {
        return this.json['defaultPrivilege'];
    }

    setDefaultPrivilege(privilege: boolean) {
        return ConfigImplementation.setKeyValue(this, 'defaultPrivilege', privilege);
    }

    getDefaultTextChannel(): string {
        return this.json['defaultTextChannel'];
    }

    setDefaultTextChannel(textChannelID: string) {
        return ConfigImplementation.setKeyValue(this, 'defaultTextChannel', textChannelID);
    }

    getLogging(): Logging {
        return this.json['logging'];
    }

    setLogging(channelID: string, level: string) {
        return ConfigImplementation.setKeyValue(this, 'logging', {
            channelID: channelID,
            flags: level,
        });
    }

    getUserIDForNickname(nickname: string): string {
        return this.json['nicknames'][nickname];
    }

    getNicknames(userID: string): Nicknames {
        return ConfigImplementation.getValuesOfUniqueKeyAsSet(this, 'nicknames', userID);
    }

    removeNicknames(userID: string, nicknames: string[]) {
        ConfigImplementation.removeKeysFromMap(this, 'nicknames', nicknames);
    }

    addNicknames(userID: string, nicknames: string[]): Error | null {
        return ConfigImplementation.addUniqueKeyToMap(this, 'nicknames', nicknames, userID, (config, key) => {
            return config.json['nicknames'][key];
        });
    }

    getCommandNameFromAlias(alias: string): string {
        return this.json['aliases'][alias];
    }

    getAliases(command: string): Aliases {
        return ConfigImplementation.getValuesOfUniqueKeyAsSet(this, 'aliases', command);
    }

    removeAliases(command: string, aliases: string[]) {
        ConfigImplementation.removeKeysFromMap(this, 'aliases', aliases);
    }

    addAliases(command: string, aliases: string[]): Error | null {
        return ConfigImplementation.addUniqueKeyToMap(
            this,
            'aliases',
            aliases,
            command,
            ConfigImplementation.isAlreadyProtectedKeyword
        );
    }

    getMacro(macroKey: string): Macro {
        return this.json['macros'][macroKey];
    }

    getMacros(): Map<string, Macro> {
        return new Map<string, Macro>(Object.entries(this.json['macros']));
    }

    removeMacro(macroKey: string) {
        delete this.json['macros'][macroKey];
        this.save();
    }

    addMacro(macroKey: string, macro: Macro): Error | null {
        if (ConfigImplementation.isAlreadyProtectedKeyword(this, macroKey)) {
            return Error('Keyword already exists as Macro / Alias / Command');
        }
        this.json['macros'][macroKey] = macro;
        this.save();
        return null;
    }

    getPrivileges(): Privilege[] {
        const privileges: Privilege[] = [];
        Object.keys(this.json['privileges']).forEach(key => {
            privileges.push(this.getPrivilege(key)!);
        });
        return privileges;
    }

    hasPrivilege(key: string): boolean {
        return this.json['privileges'][key] !== undefined;
    }

    getPrivilege(key: string): Privilege | undefined {
        const privilege = this.json['privileges'][key];
        return privilege
            ? {
                  command: key,
                  grantedRoles: new Set(privilege.grantedRoles || []),
                  grantedUsers: new Set(privilege.grantedUsers || []),
                  deniedRoles: new Set(privilege.deniedRoles || []),
                  deniedUsers: new Set(privilege.deniedUsers || []),
              }
            : undefined;
    }

    deletePrivilege(name: string) {
        delete this.json['privileges'][name];
        this.save();
    }

    grantEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            ConfigImplementation.modifyEntityPrivilege(this, privilegeName, entity, true);
        });
    }

    denyEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]) {
        entities.forEach(entity => {
            ConfigImplementation.modifyEntityPrivilege(this, privilegeName, entity, false);
        });
    }

    removeEntitiesFromPrivilege(privilegeName: string, entities: (User | Role)[]) {
        const privilege = this.json['privileges'][privilegeName];
        if (privilege) {
            const ids = entities.map(entity => entity.id);
            privilege.grantedRoles = removeArrayFromArray(privilege.grantedRoles, ids);
            privilege.deniedRoles = removeArrayFromArray(privilege.deniedRoles, ids);
            privilege.grantedUsers = removeArrayFromArray(privilege.grantedUsers, ids);
            privilege.deniedUsers = removeArrayFromArray(privilege.deniedUsers, ids);
        }
    }

    getEmoji(type: string): string {
        return this.json['acknowledgement_emojis'][type];
    }
    getEmojis(): Emojis {
        return new Map<string, string>(Object.entries(this.json['acknowledgement_emojis']));
    }
    setEmoji(type: string, emoji: string): void {
        this.json['acknowledgement_emojis'][type] = emoji;
        this.save();
    }

    isUserVoiceOptedOut(userID: string): boolean {
        return this.json['voice_opt_out_list'].includes(userID);
    }

    setUserVoiceOptedOut(userID: string, optOut: boolean): void {
        if ((optOut && this.isUserVoiceOptedOut(userID)) || (!optOut && !this.isUserVoiceOptedOut(userID))) {
            return;
        }
        if (optOut) {
            this.json['voice_opt_out_list'].push(userID);
        } else {
            const index = this.json['voice_opt_out_list'].indexOf(userID);
            index > -1 ? this.json['voice_opt_out_list'].splice(index, 1) : false;
        }
        this.save();
    }

    getUserVoiceLanguage(userID: string): Language {
        return this.json['user_languages'][userID] ?? this.getLanguage();
    }

    setUserVoiceLanguage(userID: string, language?: Language) {
        if (!language) {
            delete this.json['user_languages'][userID];
        } else {
            this.json['user_languages'][userID] = language;
        }
        this.save();
    }

    isUserInConversationMode(userID: string): boolean {
        return this.json['user_conversation_mode_list'].includes(userID);
    }

    setUserInConversationMode(userID: string, enabled: boolean) {
        if (
            (enabled && this.isUserInConversationMode(userID)) ||
            (!enabled && !this.isUserInConversationMode(userID))
        ) {
            return;
        }
        if (enabled) {
            this.json['user_conversation_mode_list'].push(userID);
        } else {
            const index = this.json['user_conversation_mode_list'].indexOf(userID);
            index > -1 ? this.json['user_conversation_mode_list'].splice(index, 1) : false;
        }
        this.save();
    }

    private static modifyEntityPrivilege(
        config: ConfigImplementation,
        privilegeName: string,
        entity: User | Role,
        isGranting: boolean
    ) {
        const privilege = config.json['privileges'][privilegeName] || createPrivilege();
        const baseKey = entity instanceof User ? 'Users' : 'Roles';
        const addingToKey = `${isGranting ? 'granted' : 'denied'}${baseKey}`;
        const removingFromKey = `${isGranting ? 'denied' : 'granted'}${baseKey}`;
        privilege[removingFromKey] = removeArrayFromArray(privilege[removingFromKey], [entity.id]);
        privilege[addingToKey] = addArrayToArray(privilege[addingToKey], [entity.id]);
        config.json.privileges[privilegeName] = privilege;
        config.save();
    }

    private static setKeyValue(config: ConfigImplementation, key: string, value: any) {
        config.json[key] = value;
        config.save();
    }

    private static addUniqueKeyToMap(
        config: ConfigImplementation,
        entry: string,
        keys: string[],
        value: string,
        validate?: (arg0: ConfigImplementation, arg1: string) => boolean
    ): Error | null {
        const alreadyHad: string[] = [];
        keys.forEach(key => {
            if (validate && validate(config, key)) {
                alreadyHad.push(`${key} => ${config.json[entry][key]}`);
            }
            config.json[entry][key] = value;
        });
        config.save();
        return alreadyHad.length > 0 ? new Error(alreadyHad.join('\n')) : null;
    }

    private static removeKeysFromMap(config: ConfigImplementation, entry: string, keys: string[]) {
        keys.forEach(key => {
            config.json[entry]?.delete(key);
        });
        config.save();
    }

    private static getValuesOfUniqueKeyAsSet(config: ConfigImplementation, entry: string, value: string): Set<string> {
        const values: string[] = Object.entries(config.json[entry])
            .filter(val => val[1] === value.toLowerCase())
            .map(val => val[0]) as string[];
        return new Set(values || []);
    }

    private static isAlreadyProtectedKeyword(config: ConfigImplementation, keyword: string): boolean {
        return !!(
            config.getMacro(keyword) ||
            config.getCommandNameFromAlias(keyword) ||
            CommandRegistry.getCommands().has(keyword)
        );
    }
}

function addArrayToArray(current: string[], adds: string[]): string[] {
    adds.forEach(add => {
        if (current.indexOf(add) === -1) {
            current.push(add);
        }
    });
    return current;
}

function removeArrayFromArray(current: string[], removes: string[]): string[] {
    return current.filter(n => removes.indexOf(n) === -1);
}

function createPrivilege(): object {
    return {
        grantedRoles: [],
        grantedUsers: [],
        deniedRoles: [],
        deniedUsers: [],
    };
}
