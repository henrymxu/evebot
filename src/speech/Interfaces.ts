import {Readable} from "stream";

export interface SpeechGenerator {
    asyncGenerateSpeechFromText(message: string, voice?: string): Promise<SpeechGeneratorResult>
}

export interface SpeechGeneratorResult {
    stream: Readable
    length: number
}

export interface SpeechRecognizer {
    recognizeTextFromSpeech(audioStream: Readable): Promise<string>
}

export interface SpeechProvider {
    requiredConfigVariables(): string[]
    getStatus(): string
    asGenerator(): SpeechGenerator
    asRecognizer(): SpeechRecognizer
}