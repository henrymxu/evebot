import {Storage} from "../Storage"
import fs from "fs"
import {FileUtils} from "../../utils/FileUtils"
import {Logger} from "../../Logger"

const TAG = 'LocalStorage'

export default class LocalStorage implements Storage {
    load(params: any, defaultValue?: any): Promise<any> {
        const path = `./configs/config_${params.Key.id}.json`
        if (!fs.existsSync(path)) {
            if (!fs.existsSync('./configs')){
                fs.mkdirSync('./configs')
            }
            fs.copyFileSync('./default_config.json', path)
        }
        //throw ('Attempted to load an invalid config file')
        return Promise.resolve(FileUtils.openJsonFile(path))
    }

    save(params: any): Promise<void> {
        return new Promise((res, rej) => {
            const path = `./configs/config_${params.Item.id}.json`
            fs.writeFile(path, JSON.stringify(params.Item.config, null, '\t'), err => {
                if (err) {
                    Logger.e(null, TAG, `Unable to write ${params.Item.id}, reason: ${err}`)
                    rej(err)
                }
                res()
            })
        })

    }
}