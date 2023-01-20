import {ImageEngine, TextEngine} from './Engine';
import {ImageGenerator} from './ImageProvider';
import {Config} from '../guild/Config';
import {TextGenerator} from './TextProvider';

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
