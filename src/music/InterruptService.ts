import {GuildContext} from "../guild/Context"
import {AudioUtils} from "../utils/AudioUtils"
import {Readable} from "stream"

const hotword_ack_start = './resources/siri_acknowledge.mp3'
const hotword_ack_finish = './resources/siri_acknowledge_done.mp3'

export default class InterruptService {
    private context: GuildContext

    constructor(guildContext: GuildContext) {
        this.context = guildContext
    }

    /**
     *
     * @param mode: 0 for start, 1 for finish
     */
    playHotwordAck(mode: number) {
        const file = mode === 0 ? hotword_ack_start : hotword_ack_finish
        const hotwordAckStream = AudioUtils.convertMp3FileToOpusStream(file)
        this.context.getProvider().getAudioPlayer().queueInterrupt(hotwordAckStream, 'opus', 5)
    }

    playRawStream(stream: Readable) {
        this.context.getProvider().getAudioPlayer().queueInterrupt(stream, 'converted', 0)
    }

    playOpusStream(stream: Readable) {
        this.context.getProvider().getAudioPlayer().queueInterrupt(stream, 'opus', 0)
    }

    playOggStream(stream: Readable) {
        this.context.getProvider().getAudioPlayer().queueInterrupt(stream, 'ogg/opus', 0)
    }

    playUnknownStream(stream: Readable) {
        this.context.getProvider().getAudioPlayer().queueInterrupt(stream, undefined, 0)
    }
}