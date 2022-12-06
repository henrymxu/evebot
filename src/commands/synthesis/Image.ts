import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {ArgumentType, Command, CommandAck, CommandExecutionError, CommandOptions} from '../Command';
import {Acknowledgement} from '../../communication/Responder';

export default class ImageCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Image',
        keywords: ['image'],
        group: 'synthesis',
        descriptions: ['Generate an image with the bot'],
        arguments: [
            {
                key: 'prompt',
                description: 'Prompt to generate the image (must be less than 500 characters)',
                required: true,
                type: ArgumentType.STRING,
                validate: (context, arg) => {
                    return arg.length < 500;
                },
            },
            {
                key: 'number',
                flag: 'n',
                description: 'Number of images to generate',
                required: false,
                default: 1,
                type: ArgumentType.NUMBER,
            },
        ],
        throttleRate: {count: 3, seconds: 60},
        examples: ['image A cute baby sea otter -n 2'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        const imageGenerator = context.getSynthesisDependencyProvider().getImageGenerator();
        if (!imageGenerator) {
            throw new CommandExecutionError('No ImageGenerator Registered');
        }
        context.getProvider().getResponder().startTyping(message);
        return imageGenerator
            .asyncGenerateImageFromMessage(args.get('prompt'), args.get('number'))
            .then(result => {
                const messages: CommandAck = result.urls.map(url => {
                    return {content: url, message: message};
                });
                messages.push(Acknowledgement.OK);
                return messages;
            })
            .catch(err => {
                throw new CommandExecutionError(`There was an error generating image, reason: ${err.toString()}`);
            })
            .finally(() => {
                context.getProvider().getResponder().stopTyping(message);
            });
    }
}
