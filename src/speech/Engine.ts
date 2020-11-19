import { SpeechGenerator, SpeechProvider, SpeechRecognizer } from './Interfaces'
import Microsoft from './providers/Microsoft'
import { Keys } from '../Keys'

const providers: SpeechProvider[] = [new Microsoft()]

export namespace SpeechEngine {
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
        return null
    }

    export function getGenerator(): SpeechGenerator {
        return findProvider(
            providers.filter((provider) => {
                return provider.asGenerator()
            })
        ).asGenerator()
    }

    export function getRecognizer(): SpeechRecognizer {
        return findProvider(
            providers.filter((provider) => {
                return provider.asRecognizer()
            })
        ).asRecognizer()
    }

    export function getProviderStatus(): string {
        const provider = findProvider(providers)
        return provider ? provider.getStatus() : 'Unavailable'
    }
}
