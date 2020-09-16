import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {Permission} from "../../Config"
import {TableGenerator} from "../../communication/TableGenerator"
import {GuildUtils} from "../../utils/GuildUtils"

export default class PermissionsCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Permissions',
        keywords: ['permissions'],
        group: 'admin',
        descriptions: ['Modify various member / role permissions of the bot'],
        arguments: [
            {
                key: 'permissionName',
                description: 'Permission you would like to modify',
                required: false,
                type: ArgumentType.string
            },
            {
                key: 'add',
                flag: 'a',
                description: 'Add member / role to permission',
                required: false,
                type: ArgumentType.string,
                array: true
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Remove member / role from permission',
                required: false,
                type: ArgumentType.string,
                array: true
            },
            {
                key: 'create',
                flag: 'c',
                description: 'Create permission',
                required: false,
                type: ArgumentType.flag
            },
            {
                key: 'delete',
                flag: 'd',
                description: 'Delete permission',
                required: false,
                type: ArgumentType.flag
            }
        ]
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        const permissionName = args.get('permissionName')
        // Check if permissionName is a command or group
        if (!permissionName) {
            const response = createPermissionsListMessage(context.getConfig().getPermissions())
            context.getProvider().getResponder().send(
                {content: response, message: message, id: 'permissions', options: {code: 'Markdown'}}, 30)
            return
        }
        if (!args.get('add') && !args.get('remove') && !args.get('create') && !args.get('delete')) {
            const response = createPermissionsMessage(context, context.getConfig().getPermission(permissionName))
            context.getProvider().getResponder().send(
                {content: response, message: message, id: 'permission', options: {code: 'Markdown'}}, 30)
            return
        }
    }
}

function createPermissionsMessage(context: GuildContext, permission: Permission): string {
    if (!permission) {
        return 'Permission does not exist, use -c to create it'
    }
    let response = `${permission.command}\n---------\n`
    const tableHeaders = ['Type', '< Allowed Users >']
    function addRowsToTable(users: Set<string>, roles: Set<string>): string[][] {
        const rows = []
        users.forEach((userID) => {
            rows.push(['User', GuildUtils.getUserFromUserID(context, userID).username])
        })
        roles.forEach((roleID) => {
            rows.push(['Role', GuildUtils.getRoleFromRoleID(context, roleID).name])
        })
        return rows
    }
    let tableData = []
    tableData.push(...addRowsToTable(permission.allowedUsers, permission.allowedRoles))
    tableData.push(['Type', '< Disallowed Users >'])
    tableData.push(...addRowsToTable(permission.disallowedUsers, permission.disallowedRoles))
    response += TableGenerator.createTable(tableHeaders, tableData)
    return response
}

function createPermissionsListMessage(permissions: Permission[]): string {
    const tableHeaders = ['Permission Name', 'Allowed', 'Disallowed']
    const tableData = []
    permissions.forEach((permission) => {
        tableData.push([permission.command, permission.allowedRoles.size + permission.allowedUsers.size,
            permission.disallowedRoles.size + permission.disallowedUsers.size])
    })
    return TableGenerator.createTable(tableHeaders, tableData)
}