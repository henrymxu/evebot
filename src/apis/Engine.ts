import {Provider} from './Provider';
import {Keys} from '../Keys';
import {StubProvider} from './StubProvider';
import Microsoft from './providers/Microsoft';
import {isSpeechGenerator, isSpeechRecognizer, SpeechGenerator, SpeechRecognizer} from './SpeechProvider';
import {ImageGenerator, isImageGenerator} from './ImageProvider';
import OpenAi from './providers/OpenAi';

const providers: Provider[] = [new OpenAi(), new Microsoft()];

export namespace SpeechEngine {
    export function getGenerator(): SpeechGenerator | undefined {
        return findValidProvider(providers.filter(provider => isSpeechGenerator(provider)));
    }

    export function getRecognizer(): SpeechRecognizer | undefined {
        return findValidProvider(providers.filter(provider => isSpeechRecognizer(provider)));
    }
}

export namespace ImageEngine {
    export function getGenerator(): ImageGenerator | undefined {
        return findValidProvider(providers.filter(provider => isImageGenerator(provider)));
    }
}

function findValidProvider<T>(providers: Provider[]): T {
    const genericProviders = providers.map(provider => provider as Provider);
    for (const provider of genericProviders) {
        let hasRequiredKeys = true;
        for (const configVariable of provider.requiredConfigVariables()) {
            if (!Keys.get(configVariable)) {
                hasRequiredKeys = false;
                break;
            }
        }
        if (hasRequiredKeys) {
            return provider as T;
        }
    }
    return new StubProvider() as T;
}
