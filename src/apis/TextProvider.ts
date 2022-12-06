export interface TextGenerator {
    asyncGenerateReplyFromMessage(message: string): Promise<TextGeneratorResult>;
}

export interface TextGeneratorResult {
    message: string;
}
