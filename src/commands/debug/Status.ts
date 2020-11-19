import {Message, User} from "discord.js"
import {GuildContext} from "../../guild/Context"
import {Command, CommandOptions} from "../Command"
import {TableGenerator} from "../../communication/TableGenerator"
import {SpeechProvider} from "../../speech/Interfaces"
import {GuildUtils} from "../../utils/GuildUtils"

export default class StatusCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Status',
        keywords: ['status', 'memory', 'config'],
        group: 'debug',
        descriptions: ['Show status of the bot',
            'Show current memory usage of the bot', 'Show raw config of the bot'],
        arguments: [],
        permissions: ['ADMINISTRATOR']
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        let response = ''
        switch(args.get('keyword')) {
            case 'status': {
                response = getStatusResponse(context)
                break
            }
            case 'memory': {
                response = getMemoryResponse()
                if (global.gc) {
                    global.gc()
                    response = response + '\n' + getMemoryResponse()
                }
                break
            }
            case 'config': {
                response = context.getConfig().getJSON()
                break
            }
        }
        context.getProvider().getResponder()
            .send({content: response, id: args.get('keyword'), message: message, options: {code: 'Markdown'}},
                15)
    }
}

function getStatusResponse(context: GuildContext): string {
    let response = ""
    const tableHeader = ['Context', 'Value']
    const tableData = []
    tableData.push(['Guild', context.getGuild().name])
    tableData.push(['Prefix', context.getPrefix()])
    tableData.push(['TextChannel', context.getTextChannel().name])
    tableData.push(['VoiceChannel', context.getVoiceConnection() ? context.getVoiceConnection().channel.name: "None"])

    response += `${TableGenerator.createTable(tableHeader, tableData)}\n`

    const tableHeader2 = ['SpeechProvider', 'Status']
    const tableData2 = []
    tableData2.push(['HotwordEngine', context.getVoiceDependencyProvider().getHotwordEngine().getStatus()])
    tableData2.push(['Hotwords', context.getVoiceDependencyProvider().getHotwordEngine().getHotwords().join(', ')])
    tableData2.push(['SpeechGeneration',
        (context.getVoiceDependencyProvider().getSpeechGenerator() as unknown as SpeechProvider).getStatus()])
    tableData2.push(['SpeechRecognition',
        (context.getVoiceDependencyProvider().getSpeechRecognizer() as unknown as SpeechProvider).getStatus()])

    response += `${TableGenerator.createTable(tableHeader2, tableData2)}\n`

    const tableHeader3 = ['Registered Users']
    const tableData3 = []
    context.getProvider().getVoiceConnectionHandler().getVoiceStreams().forEach((_, userID) => {
        tableData3.push([GuildUtils.parseUserFromUserID(context, userID).username])
    })
    response += `${TableGenerator.createTable(tableHeader3, tableData3)}`
    return response
}

function getMemoryResponse(): string {
    const tableHeaders = ['Type', 'Allocated (MBs)']
    const tableData = []
    tableData.push(['heapTotal', process.memoryUsage().heapTotal / 1000000])
    tableData.push(['external', process.memoryUsage().external / 1000000])
    tableData.push(['rss', process.memoryUsage().rss / 1000000])
    return TableGenerator.createTable(tableHeaders, tableData)
}