export interface ImageGenerator {
    asyncGenerateImageFromMessage(message: string, count: number): Promise<ImageGeneratorResult>;
}

export interface ImageGeneratorResult {
    urls: string[];
}

export function isImageGenerator(object: any): object is ImageGenerator {
    return (object as ImageGenerator).asyncGenerateImageFromMessage !== undefined;
}
