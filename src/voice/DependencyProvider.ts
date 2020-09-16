import {HotwordEngine} from "../hotword/Engine"
import {SpeechGenerator, SpeechRecognizer} from "../speech/Interfaces"
import Snowboy from "../hotword/Snowboy"
import {SpeechEngine} from "../speech/Engine"
import Porcupine from "../hotword/Porcupine"

export class VoiceDependencyProvider {
    private readonly hotwordEngine: HotwordEngine

    constructor(hotwordEngine: HotwordEngine) {
        this.hotwordEngine = hotwordEngine
    }

    getHotwordEngine(): HotwordEngine {
        return this.hotwordEngine
    }

    getSpeechGenerator(): SpeechGenerator {
        return SpeechEngine.getGenerator()
    }

    getSpeechRecognizer(): SpeechRecognizer {
        return SpeechEngine.getRecognizer()
    }
}

export namespace VoiceDependencyProviderBuilder {
    export function build(config: object): VoiceDependencyProvider {
        return new VoiceDependencyProvider(new Snowboy())
    }
}