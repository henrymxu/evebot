import {ImageEngine} from '../apis/Engine';
import {ImageGenerator} from '../apis/ImageProvider';
import {Config} from '../guild/Config';

export class SynthesisDependencyProvider {
    constructor() {}

    getImageGenerator(): ImageGenerator | undefined {
        return ImageEngine.getGenerator();
    }
}

export namespace SynthesisDependencyProviderBuilder {
    export function build(config: Config): SynthesisDependencyProvider {
        return new SynthesisDependencyProvider();
    }
}
