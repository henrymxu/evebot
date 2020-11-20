import {HotwordEngine} from "../hotword/Engine"
import {SpeechGenerator, SpeechRecognizer} from "../speech/Interfaces"
import Snowboy from "../hotword/providers/Snowboy"
import {SpeechEngine} from "../speech/Engine"

export class VoiceDependencyProvider {
    private readonly hotwordEngine: HotwordEngine

    constructor(hotwordEngine: HotwordEngine) {
        this.hotwordEngine = hotwordEngine
    }

    getHotwordEngine(): HotwordEngine {
        return this.hotwordEngine
    }

    getSpeechGenerator(): SpeechGenerator | undefined {
        return SpeechEngine.getGenerator()
    }

    getSpeechRecognizer(): SpeechRecognizer | undefined {
        return SpeechEngine.getRecognizer()
    }
}

export namespace VoiceDependencyProviderBuilder {
    export function build(config: object): VoiceDependencyProvider {
        return new VoiceDependencyProvider(new Snowboy())
    }
}