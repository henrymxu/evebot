import {table} from 'table'
import {MessageEmbed} from 'discord.js'
import {MessageGenerator} from './MessageGenerator'
import {MessageActionResponse} from './Responder'
import {GuildContext} from '../guild/Context'

export namespace TableGenerator {
    export function createTable(headers: string[], data: string[][]): string {
        if (data.length === 0) {
            return headers ? table([headers]) : 'Empty Table'
        }
        if (headers && headers.length !== data[0].length) {
            throw new Error(`Table Header Length (${headers.length}) is not equal to Table Data Length (${data[0].length})`)
        }
        const rowSize = data[0].length
        for (let row of data) {
            if (row.length !== rowSize) {
                throw new Error(`Table Rows aren't all the same size`)
            }
        }
        const columnOptions: {}[] = []
        for (let i = 0; i < data[0].length; i++) {
            columnOptions[i] = {

            }
        }
        const config = {
            columns: columnOptions
        }
        if (headers) {
            data.unshift(headers)
        }
        return table(data, config)
    }

    export function createBasicListEmbed(title: string, set: Set<string>, noneType?: string): MessageEmbed {
        const embed = MessageGenerator.getBaseEmbed()
        let description = ''
        if (!set || set.size === 0) {
            description = `No ${noneType || 'items'}`
        } else {
            set.forEach((item) => {
                description += `${item}\n`
            })
        }
        embed.setDescription(description.trimRight())
        return embed
    }
}

type TableGenerator = (context: GuildContext, rows: any[]) => string

export class DynamicTableGenerator {
    private currentPage = 0
    private readonly context: GuildContext
    private readonly rows: any[]
    private readonly maxRows: number
    private readonly tableGenerator: TableGenerator
    private readonly staticInformation?: TableGenerator

    private readonly options = ['⬆️', '⬇️']

    constructor(context: GuildContext, rows: any[], tableGenerator: TableGenerator,
                maxRows: number = 10,
                staticInformation?: TableGenerator) {
        this.context = context
        this.rows = rows
        this.tableGenerator = tableGenerator
        this.staticInformation = staticInformation
        this.maxRows = maxRows
    }

    initialize(): string {
        return this.createMessage()
    }

    emojiOptions(): Set<string> {
        return new Set<string>(this.options)
    }

    handler(emoji: string): MessageActionResponse {
        if (emoji === '⬆️') {
            this.currentPage = Math.max(0, this.currentPage - 1)
        } else if (emoji === '⬇️') {
            this.currentPage = Math.min(Math.floor(this.rows.length / this.maxRows), this.currentPage + 1)
        }
        return {
            newMessage: this.createMessage(),
            isEdit: true
        }
    }

    private createMessage(): string {
        const slice = this.getSlice()
        let table = this.tableGenerator(this.context, slice)
        table += `Page ${this.currentPage + 1}/${Math.floor(this.rows.length / this.maxRows) + 1}\n\n`
        table += this.staticInformation ? this.staticInformation(this.context, this.rows) : ''
        return table
    }

    private getSlice(): any[] {
        const startIndex = this.currentPage * this.maxRows
        const endIndex = startIndex + this.maxRows
        return this.rows.slice(startIndex, endIndex)
    }

    public static getHandler(tableGenerator: DynamicTableGenerator): (emoji: string) => MessageActionResponse {
        return (emoji: string) => {
            return tableGenerator.handler(emoji)
        }
    }
}
