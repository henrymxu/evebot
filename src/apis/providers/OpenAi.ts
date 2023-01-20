import {ImageGenerator, ImageGeneratorResult} from '../ImageProvider';
import {Configuration, OpenAIApi} from 'openai';
import {Keys} from '../../Keys';
import {Provider} from '../Provider';
import {TextGenerator, TextGeneratorResult} from '../TextProvider';

const configVars = ['openai_api_key'];

export default class OpenAi implements Provider, ImageGenerator, TextGenerator {
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

    asyncGenerateReplyFromMessage(
        message: string,
        model = 'text-davinci-003',
        maxLength = 256,
        explore = true
    ): Promise<TextGeneratorResult> {
        this.initializeIfNeeded();
        return this.openai
            .createCompletion({
                prompt: message,
                model: model,
                max_tokens: maxLength,
                temperature: explore ? 0.7 : 1,
            })
            .then(result => {
                return {message: result.data.choices[0].text!};
            });
    }
}
