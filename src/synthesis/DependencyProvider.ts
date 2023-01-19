import {ImageEngine, TextEngine} from '../apis/Engine';
import {ImageGenerator} from '../apis/ImageProvider';
import {Config} from '../guild/Config';
import {TextGenerator} from '../apis/TextProvider';

export class SynthesisDependencyProvider {
    constructor() {}

    getImageGenerator(): ImageGenerator | undefined {
        return ImageEngine.getGenerator();
    }

    getTextGenerator(): TextGenerator | undefined {
        return TextEngine.getGenerator();
    }
}

export namespace SynthesisDependencyProviderBuilder {
    export function build(config: Config): SynthesisDependencyProvider {
        return new SynthesisDependencyProvider();
    }
}
