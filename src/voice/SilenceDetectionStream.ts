import {Transform, TransformCallback} from 'stream'

const MAX_VOICE_COMMAND_LENGTH = 7500
const TIME_AFTER_SILENCE = 1000
export default class SilenceDetectionStream extends Transform {
    private talkedOnce = false
    private continuousSilenceCounter = 0
    private readonly isSilentNowCallback: () => void
    private silenceTimeout: NodeJS.Timeout | undefined
    private readonly maxLengthTimeout: NodeJS.Timeout

    constructor(callback: ()=>void, maxVoiceCommandLength: number = MAX_VOICE_COMMAND_LENGTH) {
        super();
        this.isSilentNowCallback = callback
        this.maxLengthTimeout = setTimeout(() => {
            this.clearSilenceTimeout()
            this.isSilentNowCallback()
        }, maxVoiceCommandLength)
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.continuousSilenceCounter = checkChunkForSilence(chunk) ? this.continuousSilenceCounter + 1 : 0
        if (this.continuousSilenceCounter == 0) {
            this.talkedOnce = true
            this.clearSilenceTimeout()
        } else {
            if (this.continuousSilenceCounter > 5 && this.talkedOnce) {
                this.clearSilenceTimeout()
                this.silenceTimeout = setTimeout(() => {
                    clearTimeout(this.maxLengthTimeout)
                    this.isSilentNowCallback()
                }, TIME_AFTER_SILENCE)
            }
        }
        this.push(chunk)
        callback()
    }

    private clearSilenceTimeout() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout)
            this.silenceTimeout = undefined
        }
    }
}

function checkChunkForSilence(chunk: Buffer): boolean {
    for (let i = 0; i < chunk.length; i += 2) {
        if (chunk.readInt16LE(i) !== 0) {
            return false
        }
    }
    return true
}
