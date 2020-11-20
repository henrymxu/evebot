import {SpeechGenerator, SpeechProvider, SpeechRecognizer} from "../Interfaces"
import {Readable} from "stream"
import {Keys} from "../../Keys"
import Auth from "ibm-watson/auth"
import {SpeechToTextV1} from "ibm-watson/sdk"

const configVars = ['watson_token', 'watson_url']

export default class IBM implements SpeechRecognizer, SpeechProvider {
    // @ts-ignore
    private speechToText: SpeechToTextV1

    requiredConfigVariables(): string[] {
        return configVars
    }

    getStatus(): string {
        return "IBM"
    }

    asGenerator(): SpeechGenerator | undefined {
        return undefined
    }

    asRecognizer(): SpeechRecognizer | undefined {
        return this
    }

    recognizeTextFromSpeech(audioStream: Readable): Promise<string> {
        if (!this.speechToText) {
            this.speechToText = new SpeechToTextV1({
                authenticator: new Auth.IamAuthenticator({
                    apikey: Keys.get(configVars[0])
                }),
                url: Keys.get(configVars[1])
            })
        }
        const params = {
            audio: audioStream,
            contentType: 'audio/l16;rate=48000;channels=2;endianness=little-endian',
            objectMode: true,
        }
        return new Promise((res, rej) => {
            this.speechToText.recognize(params, (error, response) => {
                let result = 'Unknown Value'
                if (response?.result?.results && response.result.results.length > 0) {
                    if (response.result.results[0].alternatives.length > 0) {
                        result = response.result.results[0].alternatives[0].transcript
                    }
                }
                res(result)
            })
        })
    }
}