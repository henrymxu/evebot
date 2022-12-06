import {HotwordEngine} from '../hotword/Engine';
import {SpeechGenerator, SpeechRecognizer} from '../apis/SpeechProvider';
import {SpeechEngine} from '../apis/Engine';
import Porcupine from '../hotword/providers/Porcupine';
import {Config} from '../guild/Config';

export class VoiceDependencyProvider {
    private readonly hotwordEngine: HotwordEngine;

    constructor(hotwordEngine: HotwordEngine) {
        this.hotwordEngine = hotwordEngine;
    }

    getHotwordEngine(): HotwordEngine | undefined {
        return this.hotwordEngine;
    }

    getSpeechGenerator(): SpeechGenerator | undefined {
        return SpeechEngine.getGenerator();
    }

    getSpeechRecognizer(): SpeechRecognizer | undefined {
        return SpeechEngine.getRecognizer();
    }
}

export namespace VoiceDependencyProviderBuilder {
    export function build(config: Config): VoiceDependencyProvider {
        return new VoiceDependencyProvider(new Porcupine());
    }
}
