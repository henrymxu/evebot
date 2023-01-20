import {SpeechGenerator, SpeechGeneratorResult, SpeechRecognizer} from '../SpeechProvider';
import {Duplex, Readable} from 'stream';
import {AudioUtils} from '../../utils/AudioUtils';
import {Keys} from '../../Keys';
import {Logger} from '../../Logger';
import {
    SpeechConfig,
    Recognizer,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechSynthesisResult,
    SpeechSynthesizer,
    AudioInputStream,
    AudioStreamFormat,
    AudioConfig,
    SpeechRecognizer as MicrosoftSpeechRecognizer,
    ResultReason,
    SpeechSynthesisOutputFormat,
} from 'microsoft-cognitiveservices-speech-sdk';
import {Provider} from '../Provider';
import {Language} from '../../LanguageDictionary';

const configVars = ['microsoft_token', 'microsoft_location'];

export default class Microsoft implements Provider, SpeechGenerator, SpeechRecognizer {
    private synthesizerCache = new Map<string, SpeechSynthesizer>();
    private recognizerCache = new Map<string, MicrosoftSpeechRecognizer>();

    requiredConfigVariables(): string[] {
        return configVars;
    }

    getStatus(): string {
        return 'microsoft';
    }

    asyncGenerateSpeechFromText(message: string, voice = 'en-CA-Linda'): Promise<SpeechGeneratorResult> {
        const speechConfig = SpeechConfig.fromSubscription(Keys.get(configVars[0]), Keys.get(configVars[1]));
        speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Ogg48Khz16BitMonoOpus;
        speechConfig.speechSynthesisVoiceName = voice;
        let synthesizer: SpeechSynthesizer;
        if (this.synthesizerCache.has(voice)) {
            synthesizer = this.synthesizerCache.get(voice)!;
        } else {
            synthesizer = new SpeechSynthesizer(speechConfig, undefined);
            this.synthesizerCache.set(voice, synthesizer);
        }
        return new Promise<SpeechGeneratorResult>((res, rej) => {
            synthesizer?.speakTextAsync(
                message,
                (result: SpeechSynthesisResult) => {
                    const array = new Uint8Array(result.audioData);
                    const sampleRate = 48000;
                    const streamLengthInSeconds = result.audioData.byteLength / sampleRate;
                    const duplex = new Duplex();
                    duplex.push(array);
                    duplex.push(null);
                    res({
                        stream: AudioUtils.convertMp3StreamToOpusStream(duplex),
                        length: streamLengthInSeconds,
                    });
                    // synthesizer?.close();
                },
                (err: string) => {
                    // synthesizer?.close();
                    Logger.e(Microsoft.name, `Generate speech error, reason ${err}`);
                    rej(err);
                }
            );
        });
    }

    recognizeTextFromSpeech(audioStream: Readable, language: Language): Promise<string> {
        const pushStream = AudioInputStream.createPushStream(AudioStreamFormat.getWaveFormatPCM(48000, 16, 2));
        audioStream
            .on('data', arrayBuffer => {
                pushStream.write(arrayBuffer.buffer);
            })
            .on('end', () => {
                pushStream.close();
            });

        const audioConfig = AudioConfig.fromStreamInput(pushStream);
        const speechConfig = SpeechConfig.fromSubscription(Keys.get(configVars[0]), Keys.get(configVars[1]));
        speechConfig.speechRecognitionLanguage = language;

        let recognizer: MicrosoftSpeechRecognizer;
        if (this.recognizerCache.has(language)) {
            recognizer = this.recognizerCache.get(language)!;
        } else {
            recognizer = new MicrosoftSpeechRecognizer(speechConfig, audioConfig);
            this.recognizerCache.set(language, recognizer);
        }
        return new Promise((res, rej) => {
            recognizer.recognized = (s: Recognizer, e: SpeechRecognitionEventArgs) => {
                const result =
                    e.result.reason === ResultReason.NoMatch ? 'Unknown Value' : e.result.text.replace('.', '');
                res(result);
            };

            recognizer.recognizeOnceAsync(
                (result: SpeechRecognitionResult) => {
                    // recognizer.close();
                },
                (err: string) => {
                    // recognizer.close();
                }
            );
        });
    }
}
