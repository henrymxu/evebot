import {Command, CommandOptions} from "../Command"
import {GuildContext} from "../../guild/Context"
import {Message, MessageEmbed, User} from "discord.js"
import {Track} from "../../music/tracks/Track"
import {MessageGenerator} from "../../communication/MessageGenerator"
import {TrackMessageFactory} from "../../communication/TrackMessageGenerator"
import {TableGenerator} from "../../communication/TableGenerator"

export default class QueueCommand extends Command {
    readonly options: CommandOptions = {
        name: 'Queue',
        keywords: ['queue', 'song'],
        group: 'music',
        descriptions: ['Display entire queue', 'Display current song'],
        arguments: []
    }

    execute(context: GuildContext, source: User, args: Map<string, any>, message?: Message) {
        switch(args.get('keyword')) {
            case 'queue': {
                const response = createQueueMessage(context, context.getProvider().getDJ().getQueueMessage())
                let options = undefined
                if (!(response instanceof MessageEmbed)) {
                    options = {code: 'Markdown'}
                }
                context.getProvider().getResponder().send({content: response, id: 'queue', message: message, options: options}, 30)
                return
            }
            case 'song': {
                const embed = createSongMessage(context.getProvider().getDJ().getCurrentSong())
                context.getProvider().getResponder().send({content: embed, id: 'song', message: message})
                return
            }
        }
    }
}

function createQueueMessage(context: GuildContext, tracks: Track[]): MessageEmbed | string {
    if (tracks.length == 0) {
        return MessageGenerator.createErrorEmbed(`Queue is empty! Use ${context.getPrefix()}play command to queue some tracks!`)
    }
    let response = ''
    const tableHeaders = ['Song name', 'Requester', 'Length']
    const tableData = []
    tracks.forEach((track, index) => {
        const title = index === 0 ? `< ${track.getTitle()} >` : track.getTitle()
        tableData.push([title,
            context.getUserFromUserID(track.metaData.requesterId).username, track.asQueueString()])
    })
    response += TableGenerator.createTable(tableHeaders, tableData)
    return response
}

function createSongMessage(track: Track): MessageEmbed {
    if (!track) {
        return MessageGenerator.createErrorEmbed('You must be playing a track to use this command!')
    }
    return TrackMessageFactory.createCurrentlyPlayingEmbed(track)
}
