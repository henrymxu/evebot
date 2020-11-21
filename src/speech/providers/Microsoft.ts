import {SpeechGenerator, SpeechGeneratorResult, SpeechProvider, SpeechRecognizer} from "../Interfaces"
import {Duplex, Readable} from "stream"
import {AudioUtils} from "../../utils/AudioUtils"
import {Keys} from "../../Keys"
import {Logger} from "../../Logger"
import {
    Recognizer,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechSynthesisResult
} from "microsoft-cognitiveservices-speech-sdk"
const SpeechSDK = require('microsoft-cognitiveservices-speech-sdk')

const configVars = ['microsoft_token', 'microsoft_location']

export default class Microsoft implements SpeechGenerator, SpeechRecognizer, SpeechProvider {
    requiredConfigVariables(): string[] {
        return configVars
    }

    getStatus(): string {
        return "microsoft"
    }

    asGenerator(): SpeechGenerator {
        return this
    }

    asRecognizer(): SpeechRecognizer {
        return this
    }

    asyncGenerateSpeechFromText(message: string, voice: string = "en-CA-Linda"): Promise<SpeechGeneratorResult> {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(Keys.get(configVars[0]),
            Keys.get(configVars[1]))
        speechConfig.speechRecognitionLanguage = "en-US"
        speechConfig.speechSynthesisVoiceName = voice
        let synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null)
        return new Promise<SpeechGeneratorResult>((res, rej) => {
            synthesizer.speakTextAsync(message, (result: SpeechSynthesisResult) => {
                const array = new Uint8Array(result.audioData)
                const sampleRate = 48000
                const streamLengthInSeconds = result.audioData.byteLength / sampleRate
                let duplex = new Duplex()
                duplex.push(array)
                duplex.push(null)
                res({stream: AudioUtils.convertMp3StreamToOpusStream(duplex), length: streamLengthInSeconds})
                synthesizer.close()
                synthesizer = undefined
            }, (err: string) => {
                synthesizer.close()
                synthesizer = undefined
                Logger.e(Microsoft.name, `Generate speech error, reason ${err}`)
                rej(err)
            })
        })
    }

    recognizeTextFromSpeech(audioStream: Readable): Promise<string> {
        const pushStream = SpeechSDK.AudioInputStream
            .createPushStream(SpeechSDK.AudioStreamFormat.getWaveFormatPCM(48000, 16, 2))
        audioStream.on('data', arrayBuffer => {
            pushStream.write(arrayBuffer.buffer)
        }).on('end', () => {
            pushStream.close()
        })

        const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream)
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(Keys.get(configVars[0]), Keys.get(configVars[1]))
        speechConfig.speechRecognitionLanguage = "en-US"

        let recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

        return new Promise((res, rej) => {
            recognizer.recognized = (s: Recognizer, e: SpeechRecognitionEventArgs) => {
                const result = e.result.reason === SpeechSDK.ResultReason.NoMatch ?
                    'Unknown Value' : e.result.text.replace('.', '')
                res(result)
            }

            recognizer.recognizeOnceAsync(
                (result: SpeechRecognitionResult) => {
                    recognizer.close()
                    recognizer = undefined
                }, (err: string) => {
                    recognizer.close()
                    recognizer = undefined
                })
        })
    }
}
