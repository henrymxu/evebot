import {Message, Role, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, Command, CommandAck, CommandOptions} from '../Command';
import {Privilege} from '../../guild/Config';
import {TableGenerator} from '../../communication/TableGenerator';
import {GuildUtils} from '../../utils/GuildUtils';
import {CommandRegistry} from '../Registry';
import {Acknowledgement} from '../../communication/Responder';

export default class PrivilegesCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Privileges',
        keywords: ['privileges'],
        group: 'admin',
        descriptions: ['Modify various member / role privileges of the bot'],
        arguments: [
            {
                key: 'privilegeName',
                description: 'Privilege you would like to modify',
                required: false,
                type: ArgumentType.STRING,
                validate: GuildUtils.isStringACommandOrCommandGroup,
            },
            {
                key: 'grant',
                flag: 'grant',
                description: 'Grant a member / role privilege to use the command',
                required: false,
                type: ArgumentType.STRING,
                array: true,
            },
            {
                key: 'deny',
                flag: 'deny',
                description: 'Deny a member / role privilege to use the command',
                required: false,
                type: ArgumentType.STRING,
                array: true,
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Remove a member / role from this privilege',
                required: false,
                type: ArgumentType.STRING,
                array: true,
            },
            {
                key: 'delete',
                flag: 'd',
                description: 'Delete this privilege',
                required: false,
                type: ArgumentType.FLAG,
            },
        ],
        permissions: ['MANAGE_ROLES'],
        examples: ['privileges play -grant Liam @Olivia Admins -deny @Kevin Newcomers'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        if (!args.get('privilegeName')) {
            const response = createPrivilegesListMessage(context.getConfig().getPrivileges());
            return Promise.resolve({
                content: response,
                message: message,
                id: 'privileges',
                options: {code: 'Markdown'},
                removeAfter: 30,
            });
        }
        const privilegeName = CommandRegistry.getCommand(
            context,
            args.get('privilegeName')
        )!.options.name.toLowerCase();
        if (args.get('delete')) {
            context.getConfig().deletePrivilege(privilegeName);
            context.getProvider().getResponder().acknowledge(Acknowledgement.OK, message);
            return Promise.resolve(Acknowledgement.OK);
        }
        if (args.get('grant') || args.get('deny') || args.get('remove')) {
            context.getConfig().grantEntitiesPrivilege(
                privilegeName,
                (args.get('grant') || []).map((name: string) => mapNameToUserOrRole(context, name))
            );
            context.getConfig().denyEntitiesPrivilege(
                privilegeName,
                (args.get('deny') || []).map((name: string) => mapNameToUserOrRole(context, name))
            );
            context.getConfig().removeEntitiesFromPrivilege(
                privilegeName,
                (args.get('remove') || []).map((name: string) => mapNameToUserOrRole(context, name))
            );
        }
        const response = createPrivilegeMessage(context, context.getConfig().getPrivilege(privilegeName));
        return Promise.resolve({
            content: response,
            message: message,
            id: 'privilege',
            options: {code: true},
            removeAfter: 20,
        });
    }
}

function mapNameToUserOrRole(context: GuildContext, name: string): User | Role | undefined {
    const role = GuildUtils.parseRoleFromString(context, name);
    if (role) {
        return role;
    }
    return GuildUtils.parseUserFromString(context, name);
}

function createPrivilegeMessage(context: GuildContext, privilege?: Privilege): string {
    if (!privilege) {
        return 'Privilege does not exist, create one first';
    }
    let response = `${privilege.command}\n---------\n`;
    const tableHeaders = ['Type', '< Grant >'];
    function addRowsToTable(users: Set<string>, roles: Set<string>): string[][] {
        const rows: string[][] = [];
        users.forEach(userID => {
            const user = GuildUtils.parseUserFromUserID(context, userID)?.username;
            if (user) {
                rows.push(['User', user]);
            }
        });
        roles.forEach(roleID => {
            const role = GuildUtils.parseRoleFromRoleID(context, roleID)?.name;
            if (role) {
                rows.push(['Role', role]);
            }
        });
        if (rows.length === 0) {
            rows.push(['-', '-']);
        }
        return rows;
    }
    const tableData = [];
    tableData.push(...addRowsToTable(privilege.grantedUsers, privilege.grantedRoles));
    tableData.push(['Type', '< Deny >']);
    tableData.push(...addRowsToTable(privilege.deniedUsers, privilege.deniedRoles));
    response += TableGenerator.createTable(tableHeaders, tableData);
    return response;
}

function createPrivilegesListMessage(privileges: Privilege[]): string {
    const tableHeaders = ['Privilege For', 'Grants', 'Denies'];
    const tableData: string[][] = [];
    privileges.forEach(privilege => {
        tableData.push([
            privilege.command,
            (privilege.grantedRoles.size + privilege.grantedUsers.size).toString(),
            (privilege.deniedRoles.size + privilege.deniedUsers.size).toString(),
        ]);
    });
    return TableGenerator.createTable(tableHeaders, tableData);
}
