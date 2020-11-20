import {Readable} from "stream"
import {existsSync, readFileSync, unlink, unlinkSync} from "fs"
import {get} from "https"
import {IncomingMessage} from "http"

export namespace FileUtils {
    export function openJsonFile(filePath: string): any {
        if (!existsSync(filePath)) {
            return {}
        }
        let rawdata = readFileSync(filePath);
        // @ts-ignore
        return JSON.parse(rawdata)
    }

    export function deleteFile(filePath: string, sync:boolean = true, callback=()=>{}) {
        if (sync) {
            if (existsSync(filePath)) {
                unlinkSync(filePath)
            }
        } else {
            if (existsSync(filePath)) {
                unlink(filePath, callback)
            }
        }
    }

    export function downloadFile(url: string): Promise<Readable> {
        return new Promise((res, rej) => {
            get(url, function(response: IncomingMessage) {
                res(response)
            })
        })
    }
}
