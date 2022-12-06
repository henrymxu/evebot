import {ImageGenerator, ImageGeneratorResult} from '../ImageProvider';
import {Configuration, OpenAIApi} from 'openai';
import {Keys} from '../../Keys';
import {Provider} from '../Provider';

const configVars = ['openai_api_key'];

export default class OpenAi implements Provider, ImageGenerator {
    private openai: OpenAIApi;

    private initializeIfNeeded() {
        if (this.openai === undefined) {
            this.openai = new OpenAIApi(new Configuration({apiKey: Keys.get(configVars[0])}));
        }
    }

    requiredConfigVariables(): string[] {
        return configVars;
    }

    getStatus(): string {
        return 'openai';
    }

    asyncGenerateImageFromMessage(message: string, count: number): Promise<ImageGeneratorResult> {
        this.initializeIfNeeded();
        return this.openai.createImage({prompt: message, n: count}).then(result => {
            return {urls: result.data.data.map(item => item.url!)};
        });
    }
}
