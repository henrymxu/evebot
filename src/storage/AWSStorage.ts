import "aws-sdk/lib/node_loader"
import {Storage} from "./Storage"
import AWS from "aws-sdk/global"
import {Logger} from "../Logger"
import DynamoDB, {DocumentClient} from "aws-sdk/clients/dynamodb"
import {FileUtils} from "../utils/FileUtils"
import {Keys} from "../Keys"

const TAG = 'AWSDynamoDB'
const TABLE_NAME = 'Configs'

export default class AWSStorage implements Storage {
    private client: DocumentClient
    constructor() {
        AWS.config.update({
            region: "us-east-1",
            // @ts-ignore
            endpoint: "https://dynamodb.us-east-1.amazonaws.com",
            accessKeyId: Keys.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: Keys.get('AWS_SECRET_ACCESS_KEY')
        });
        this.client = new DynamoDB.DocumentClient()
    }

    load(guildID: string): Promise<any> {
        const params = {
            TableName: TABLE_NAME,
            Key: { 'id': guildID }
        }
        return new Promise((res, rej) => {
            this.client.get(params, (err, data) => {
                if (err) {
                    Logger.e(null, TAG, `Unable to get ${params.Key.id}, reason: ${err}`)
                    rej(err)
                } else {
                    Logger.d(null, TAG, `Get succeeded for ${params.Key.id}`)
                    if (!data.Item) {
                        res(FileUtils.openJsonFile('./default_config.json'))
                        return
                    }
                    res(data.Item.config)
                }
            })
        })
    }

    save(guildID: string, object: any): Promise<void> {
        // TODO: implement update?
        const params = {
            TableName: TABLE_NAME,
            Item: { 'id': guildID, 'config': object }
        }
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