import {Readable} from 'stream';
import {existsSync, readFileSync, unlink, unlinkSync} from 'fs';
import {get} from 'https';
import {IncomingMessage} from 'http';

export namespace FileUtils {
    export function openJsonFile(filePath: string): any {
        if (!existsSync(filePath)) {
            return {};
        }
        const rawdata = readFileSync(filePath);
        return JSON.parse(rawdata.toString());
    }

    export function deleteFile(filePath: string, sync = true, callback = () => {}) {
        if (sync) {
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }
        } else {
            if (existsSync(filePath)) {
                unlink(filePath, callback);
            }
        }
    }

    export function downloadFile(url: string): Promise<Readable> {
        return new Promise((res, rej) => {
            get(url, (response: IncomingMessage) => {
                res(response);
            }).on('error', (e: Error) => {
                rej(e);
            });
        });
    }
}
