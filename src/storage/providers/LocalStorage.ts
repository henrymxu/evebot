import {Storage} from '../Storage';
import {FileUtils} from '../../utils/FileUtils';
import {Logger} from '../../Logger';
import {copyFileSync, existsSync, mkdirSync, writeFile} from 'fs';
import {Directory} from '../../Directory';

const TAG = 'LocalStorage';

export default class LocalStorage implements Storage {
    loadConfig(params: any, defaultValue?: any): Promise<any> {
        const newConfigPath = Directory.relativeConfig(`config_${params.Key.id}.json`);
        if (!existsSync(newConfigPath)) {
            if (!existsSync(Directory.relativeConfig(''))) {
                mkdirSync(Directory.relativeConfig(''));
            }
            copyFileSync(Directory.relativeResources('default_config.json'), newConfigPath);
        }
        //throw ('Attempted to load an invalid config file')
        return Promise.resolve(FileUtils.openJsonFile(newConfigPath));
    }

    saveConfig(params: any): Promise<void> {
        return new Promise((res, rej) => {
            const path = `./configs/config_${params.Item.id}.json`;
            writeFile(path, JSON.stringify(params.Item.config, null, '\t'), err => {
                if (err) {
                    Logger.e(TAG, `Unable to write ${params.Item.id}, reason: ${err}`);
                    rej(err);
                }
                res();
            });
        });
    }
}
