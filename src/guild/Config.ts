import {Role, User} from 'discord.js';

export interface Config {
    load(): Promise<void>;

    save(): void;

    getJSON(): any;

    getPrefix(): string;

    setPrefix(prefix: string): void;

    getDefaultPrivilege(): boolean;

    setDefaultPrivilege(privilege: boolean): void;

    getDefaultTextChannel(): string;

    setDefaultTextChannel(textChannelID: string): void;

    getLogging(): Logging;

    setLogging(channelID: string, level: string): void;

    getUserIDForNickname(nickname: string): string;

    getNicknames(userID: string): Nicknames;

    removeNicknames(userID: string, nicknames: string[]): void;

    addNicknames(userID: string, nicknames: string[]): Error | null;

    getCommandNameFromAlias(alias: string): string;

    getAliases(command: string): Aliases;

    removeAliases(command: string, aliases: string[]): void;

    addAliases(command: string, aliases: string[]): Error | null;

    getMacro(macroKey: string): Macro;

    getMacros(): Map<string, Macro>;

    removeMacro(macroKey: string): void;

    addMacro(macroKey: string, macro: Macro): Error | null;

    getPrivileges(): Privilege[];

    hasPrivilege(key: string): boolean;

    getPrivilege(key: string): Privilege | undefined;

    deletePrivilege(name: string): void;

    grantEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]): void;

    denyEntitiesPrivilege(privilegeName: string, entities: (User | Role)[]): void;

    removeEntitiesFromPrivilege(privilegeName: string, entities: (User | Role)[]): void;

    getEmoji(type: string): string;

    getEmojis(): Emojis;

    setEmoji(type: string, emoji: string): void;

    isUserVoiceOptedOut(userID: string): boolean;

    setUserVoiceOptedOut(userID: string, optOut: boolean): void;
}

export type Nicknames = Set<string>;

export type Aliases = Set<string>;

export type Emojis = Map<string, string>;

export type Macro = {
    command: string;
    creator: string;
};

export interface Privilege {
    command: string;
    grantedRoles: Set<string>;
    grantedUsers: Set<string>;
    deniedRoles: Set<string>;
    deniedUsers: Set<string>;
}

export interface Logging {
    channelID: string;
    flag: string;
}
