import {Message, Role, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {ArgumentType, Command, CommandOptions} from "../Command"
import {Privilege} from "../../guild/Config"
import {TableGenerator} from "../../communication/TableGenerator"
import {GuildUtils} from "../../utils/GuildUtils"
import {CommandRegistry} from "../Registry"

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
                validate: GuildUtils.isStringACommandOrCommandGroup
            },
            {
                key: 'grant',
                flag: 'grant',
                description: 'Grant a member / role privilege to use the command',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'deny',
                flag: 'deny',
                description: 'Deny a member / role privilege to use the command',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'remove',
                flag: 'r',
                description: 'Remove a member / role from this privilege',
                required: false,
                type: ArgumentType.STRING,
                array: true
            },
            {
                key: 'delete',
                flag: 'd',
                description: 'Delete this privilege',
                required: false,
                type: ArgumentType.FLAG,
            }
        ],
        example: 'privileges play -allow Liam @Olivia Admins -disallow @Kevin Newcomers'
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        if (!args.get('privilegeName')) {
            const response = createPrivilegesListMessage(context.getConfig().getPrivileges())
            context.getProvider().getResponder().send(
                {content: response, message: message, id: 'privileges', options: {code: 'Markdown'}}, 30)
            return
        }
        const privilegeName = CommandRegistry.getCommand(context, args.get('privilegeName')).options.name
        if (args.get('delete')) {
            context.getConfig().deletePrivilege(privilegeName)
            context.getProvider().getResponder().acknowledge(0, message)
            return
        }
        if (args.get('allow') || args.get('disallow') || args.get('remove')) {
            context.getConfig().grantEntitiesPrivilege(privilegeName, (args.get('allow') || []).map(name => mapNameToUserOrRole(context, name)))
            context.getConfig().denyEntitiesPrivilege(privilegeName, (args.get('disallow') || []).map(name => mapNameToUserOrRole(context, name)))
            context.getConfig().removeEntitiesFromPrivilege(privilegeName, (args.get('remove') || []).map(name => mapNameToUserOrRole(context, name)))
        }
        const response = createPrivilegeMessage(context, context.getConfig().getPrivilege(privilegeName))
        context.getProvider().getResponder().send(
            {content: response, message: message, id: 'privilege', options: {code: 'Markdown'}}, 30)
        return
    }
}

function mapNameToUserOrRole(context: GuildContext, name: string): User | Role {
    let role = GuildUtils.parseRoleFromString(context, name)
    if (role) {
        console.log(`Found role ${role.id} for ${name}`)
        return role
    }
    return GuildUtils.parseUserFromString(context, name)
}

function createPrivilegeMessage(context: GuildContext, privilege: Privilege): string {
    if (!privilege) {
        return 'Privilege does not exist, use -c to create it'
    }
    let response = `${privilege.command}\n---------\n`
    const tableHeaders = ['Type', '< Allowed >']
    function addRowsToTable(users: Set<string>, roles: Set<string>): string[][] {
        const rows = []
        users.forEach((userID) => {
            rows.push(['User', GuildUtils.parseUserFromUserID(context, userID).username])
        })
        roles.forEach((roleID) => {
            rows.push(['Role', GuildUtils.parseRoleFromRoleID(context, roleID).name])
        })
        return rows
    }
    let tableData = []
    tableData.push(...addRowsToTable(privilege.grantedUsers, privilege.grantedRoles))
    tableData.push(['Type', '< Disallowed >'])
    tableData.push(...addRowsToTable(privilege.deniedUsers, privilege.deniedRoles))
    response += TableGenerator.createTable(tableHeaders, tableData)
    return response
}

function createPrivilegesListMessage(privileges: Privilege[]): string {
    const tableHeaders = ['Privilege For', 'Allows', 'Disallows']
    const tableData = []
    privileges.forEach((privilege) => {
        tableData.push([privilege.command, privilege.grantedRoles.size + privilege.grantedUsers.size,
            privilege.deniedRoles.size + privilege.deniedUsers.size])
    })
    return TableGenerator.createTable(tableHeaders, tableData)
}