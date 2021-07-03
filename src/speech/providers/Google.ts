import {SpeechGenerator, SpeechProvider, SpeechRecognizer} from '../Interfaces';
import {Readable} from 'stream';
import {AudioUtils} from '../../utils/AudioUtils';
import {SpeechClient} from '@google-cloud/speech';
import {Keys} from '../../Keys';
import {Logger} from '../../Logger';

const configVars = ['google_keyFileName', 'google_keyFileCred'];
export default class Google implements SpeechRecognizer, SpeechProvider {
    /* eslint-disable */
    // @ts-ignore
    private client: SpeechClient
    /* eslint-enable */

    requiredConfigVariables(): string[] {
        return configVars;
    }

    getStatus(): string {
        return 'google';
    }

    asGenerator(): SpeechGenerator | undefined {
        return undefined;
    }

    asRecognizer(): SpeechRecognizer | undefined {
        return this;
    }

    recognizeTextFromSpeech(audioStream: Readable): Promise<string> {
        if (!this.client) {
            const fs = require('fs');
            fs.writeFileSync(Keys.get(configVars[0]), Keys.get(configVars[1]));
            this.client = new SpeechClient({
                keyFileName: Keys.get(configVars[0]),
            });
        }
        return new Promise((res, rej) => {
            const recognizeStream = this.client
                .streamingRecognize({
                    config: {
                        encoding: 'LINEAR16',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US',
                    },
                    interimResults: false,
                })
                .on('data', data => {
                    res(data.results[0].alternatives[0].transcript);
                })
                .on('error', (err: Error) => {
                    Logger.e(Google.name, `Generate speech error, reason ${err}`);
                    rej(err);
                });
            audioStream.pipe(AudioUtils.createStereoToMonoTransformStream()).pipe(recognizeStream);
        });
    }
}
