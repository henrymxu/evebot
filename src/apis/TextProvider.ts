import {ImageGenerator} from './ImageProvider';

export interface TextGenerator {
    asyncGenerateReplyFromMessage(
        message: string,
        model?: string,
        maxLength?: number,
        explore?: boolean
    ): Promise<TextGeneratorResult>;
}

export interface TextGeneratorResult {
    message: string;
}

export function isTextGenerator(object: any): object is ImageGenerator {
    return (object as TextGenerator).asyncGenerateReplyFromMessage !== undefined;
}
