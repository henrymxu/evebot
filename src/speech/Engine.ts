import {SpeechGenerator, SpeechProvider, SpeechRecognizer} from "./Interfaces"
import Microsoft from "./providers/Microsoft"
import {Keys} from "../Keys"

const providers: SpeechProvider[] = [new Microsoft()]

export namespace SpeechEngine {
    export function getGenerator(): SpeechGenerator | undefined {
        return findProvider(providers.filter(provider => {
            return provider.asGenerator()
        })).asGenerator()
    }

    export function getRecognizer(): SpeechRecognizer | undefined {
        return findProvider(providers.filter(provider => {
            return provider.asRecognizer()
        })).asRecognizer()
    }
}

function findProvider(providers: SpeechProvider[]): SpeechProvider {
    for (let provider of providers) {
        let hasRequiredKeys = true
        for (let configVariable of provider.requiredConfigVariables()) {
            if (!Keys.get(configVariable)) {
                hasRequiredKeys = false
                break
            }
            if (hasRequiredKeys) {
                return provider
            }
        }
    }
    return new StubSpeechProvider()
}

class StubSpeechProvider implements SpeechProvider {
    asGenerator(): SpeechGenerator | undefined {
        return undefined;
    }

    asRecognizer(): SpeechRecognizer | undefined {
        return undefined;
    }

    getStatus(): string {
        return "No Registered Speech Provider";
    }

    requiredConfigVariables(): string[] {
        return [];
    }

}