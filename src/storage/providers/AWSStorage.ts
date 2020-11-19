import "aws-sdk/lib/node_loader"
import {Storage} from "../Storage"
import AWS from "aws-sdk/global"
import {Logger} from "../../Logger"
import DynamoDB, {DocumentClient} from "aws-sdk/clients/dynamodb"
import {Keys} from "../../Keys"

const TAG = 'AWSDynamoDB'

export default class AWSStorage implements Storage {
    private client: DocumentClient
    constructor() {
        AWS.config.update({
            region: Keys.get('AWS_REGION'),
            // @ts-ignore
            endpoint: Keys.get('AWS_ENDPOINT'),
            accessKeyId: Keys.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: Keys.get('AWS_SECRET_ACCESS_KEY')
        });
        this.client = new DynamoDB.DocumentClient()
    }

    load(params: any, defaultValue?: any): Promise<any> {
        return new Promise((res, rej) => {
            this.client.get(params, (err, data) => {
                if (err) {
                    Logger.e(null, TAG, `Unable to get ${params.Key.id}, reason: ${err}`)
                    rej(err)
                } else {
                    Logger.d(null, TAG, `Get succeeded for ${params.Key.id}`)
                    if (!data.Item) {
                        res(defaultValue)
                        return
                    }
                    res(data.Item.config)
                }
            })
        })
    }

    save(params: any): Promise<void> {
        // TODO: implement update?
        return new Promise((res, rej) => {
            this.client.put(params, (err, data) => {
                if (err) {
                    Logger.e(null, TAG, `Unable to write ${params.Item.id}, reason: ${err}`)
                    rej(err)
                } else {
                    Logger.d(null, TAG, `Write succeeded for ${params.Item.id}`)
                    res()
                }
            })
        })
    }
}