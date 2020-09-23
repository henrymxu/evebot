import {Storage} from "./Storage"
import fs from "fs"
import {FileUtils} from "../utils/FileUtils"
import {Logger} from "../Logger"

const TAG = 'LocalStorage'

export default class LocalStorage implements Storage {
    load(guildID: string): Promise<any> {
        const path = `./configs/config_${guildID}.json`
        if (!fs.existsSync(path)) {
            if (!fs.existsSync('./configs')){
                fs.mkdirSync('./configs')
            }
            fs.copyFileSync('./default_config.json', path)
        }
        //throw ('Attempted to load an invalid config file')
        return Promise.resolve(FileUtils.openJsonFile(path))
    }

    save(guildID: string, object: any): Promise<void> {
        return new Promise((res, rej) => {
            const path = `./configs/config_${guildID}.json`
            fs.writeFile(path, JSON.stringify(object, null, '\t'), err => {
                if (err) {
                    Logger.e(null, TAG, `Unable to write ${guildID}, reason: ${err}`)
                    rej(err)
                }
                res()
            })
        })

    }
}