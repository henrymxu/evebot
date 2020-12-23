import 'aws-sdk/lib/node_loader';
import {Storage} from '../Storage';
import {config} from 'aws-sdk/global';
import {Logger} from '../../Logger';
import {DocumentClient} from 'aws-sdk/clients/dynamodb';
import {Keys} from '../../Keys';

const TAG = 'AWSDynamoDB';

export default class AWSStorage implements Storage {
    private client: DocumentClient;
    constructor() {
        config.update({
            region: Keys.get('AWS_REGION'),
            accessKeyId: Keys.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: Keys.get('AWS_SECRET_ACCESS_KEY'),
        });
        this.client = new DocumentClient();
    }

    loadConfig(params: any, defaultValue?: any): Promise<any> {
        return new Promise((res, rej) => {
            this.client.get(params, (err, data) => {
                if (err) {
                    Logger.e(TAG, `Unable to get ${params.Key.id}, reason: ${err}`);
                    rej(err);
                } else {
                    Logger.d(TAG, `Get succeeded for ${params.Key.id}`);
                    if (!data.Item) {
                        res(defaultValue);
                        return;
                    }
                    res(data.Item.config);
                }
            });
        });
    }

    saveConfig(params: any): Promise<void> {
        // TODO: implement update?
        return new Promise((res, rej) => {
            this.client.put(params, (err, data) => {
                if (err) {
                    Logger.e(TAG, `Unable to write ${params.Item.id}, reason: ${err}`);
                    rej(err);
                } else {
                    Logger.d(TAG, `Write succeeded for ${params.Item.id}`);
                    res();
                }
            });
        });
    }
}
