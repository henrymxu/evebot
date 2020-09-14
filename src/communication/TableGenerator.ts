import {table} from "table"

export namespace TableGenerator {
    export function createTable(headers: string[], data: string[][]): string {
        if (data.length === 0) {
            return headers ? table([headers]) : "Empty Table"
        }
        if (headers && headers.length != data[0].length) {
            throw new Error(`Table Header Length (${headers.length}) is not equal to Table Data Length (${data[0].length})`)
        }
        const rowSize = data[0].length
        for (let row of data) {
            if (row.length != rowSize) {
                throw new Error(`Table Rows aren't all the same size`)
            }
        }
        const columnOptions = {}
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
}