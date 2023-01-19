import {Readable} from 'stream';
import {Language} from '../LanguageDictionary';

export interface SpeechGenerator {
    asyncGenerateSpeechFromText(message: string, voice?: string): Promise<SpeechGeneratorResult>;
}

export interface SpeechGeneratorResult {
    stream: Readable;
    length: number;
}

export interface SpeechRecognizer {
    recognizeTextFromSpeech(audioStream: Readable, language: Language): Promise<string>;
}

export function isSpeechGenerator(object: any): object is SpeechGenerator {
    return (object as SpeechGenerator).asyncGenerateSpeechFromText !== undefined;
}

export function isSpeechRecognizer(object: any): object is SpeechRecognizer {
    return (object as SpeechRecognizer).recognizeTextFromSpeech !== undefined;
}
