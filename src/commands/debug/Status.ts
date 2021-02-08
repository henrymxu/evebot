import {Message, User} from 'discord.js';
import {GuildContext} from '../../guild/Context';
import {Command, CommandAck, CommandOptions} from '../Command';
import {TableGenerator} from '../../communication/TableGenerator';
import {SpeechProvider} from '../../speech/Interfaces';
import {GuildUtils} from '../../utils/GuildUtils';
import {GlobalContext} from '../../GlobalContext';

export default class StatusCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Status',
        keywords: ['status', 'memory', 'config'],
        group: 'debug',
        descriptions: ['Show status of the bot', 'Show current memory usage of the bot', 'Show raw config of the bot'],
        arguments: [],
        permissions: ['ADMINISTRATOR'],
    };

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message): Promise<CommandAck> {
        let response = '';
        switch (args.get('keyword')) {
            case 'status': {
                response = getStatusResponse(context);
                break;
            }
            case 'memory': {
                response = getMemoryResponse();
                if (global.gc) {
                    global.gc();
                    response = response + '\n' + getMemoryResponse();
                }
                break;
            }
            case 'config': {
                response = JSON.stringify(context.getConfig().getJSON(), null, 4);
                break;
            }
        }
        return Promise.resolve({
            content: response,
            id: args.get('keyword'),
            message: message,
            options: {code: 'Markdown'},
            removeAfter: 15,
        });
    }
}

function getStatusResponse(context: GuildContext): string {
    let response = '';
    const tableHeader = ['Context', 'Value'];
    const tableData: string[][] = [];
    tableData.push(['Guild', context.getGuild().name]);
    tableData.push(['Prefix', context.getPrefix()]);
    const textChannel = context.getTextChannel();
    tableData.push(['TextChannel', textChannel ? textChannel.name : 'None']);
    const voiceConnection = context.getVoiceConnection();
    tableData.push(['VoiceChannel', voiceConnection ? voiceConnection.channel.name : 'None']);

    response += `${TableGenerator.createTable(tableHeader, tableData)}\n`;

    const tableHeader2 = ['SpeechProvider', 'Status'];
    const tableData2: string[][] = [];
    const hotwordEngine = context.getVoiceDependencyProvider().getHotwordEngine();
    tableData2.push(['HotwordEngine', hotwordEngine ? hotwordEngine.getStatus() : 'None']);
    tableData2.push(['Hotwords', hotwordEngine ? hotwordEngine.getHotwords().join(', ') : 'None']);
    tableData2.push([
        'SpeechGeneration',
        ((context.getVoiceDependencyProvider().getSpeechGenerator() as unknown) as SpeechProvider).getStatus(),
    ]);
    tableData2.push([
        'SpeechRecognition',
        ((context.getVoiceDependencyProvider().getSpeechRecognizer() as unknown) as SpeechProvider).getStatus(),
    ]);

    response += `${TableGenerator.createTable(tableHeader2, tableData2)}\n`;

    const tableHeader3 = ['Registered Users'];
    const tableData3: string[][] = [];
    context
        .getProvider()
        .getVoiceConnectionHandler()
        .getVoiceStreams()
        .forEach((_, userID) => {
            tableData3.push([GuildUtils.parseUserFromUserID(context, userID)!.username]);
        });
    response += `${TableGenerator.createTable(tableHeader3, tableData3)}\n`;
    response += `Version: ${GlobalContext.getBotVersion()}\n`;
    response += `Uptime: ${GlobalContext.getUptime()}`;
    return response;
}

function getMemoryResponse(): string {
    const tableHeaders = ['Type', 'Allocated (MBs)'];
    const tableData: string[][] = [];
    const memory = GlobalContext.getMemoryUsage();
    tableData.push(['heapUsed', memory[0].toString()]);
    tableData.push(['heapTotal', memory[1].toString()]);
    tableData.push(['external', memory[2].toString()]);
    tableData.push(['rss', memory[3].toString()]);
    tableData.push(['arrayBuffers', memory[4].toString()]);
    return TableGenerator.createTable(tableHeaders, tableData);
}
