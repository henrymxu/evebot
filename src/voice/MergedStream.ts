import {Duplex} from "stream"
import RecorderStream from "./RecorderStream"
import {CachedStream, CreateStreamFromBuffer} from "./CachedStream"

const SIGNED_16_BIT_MIN = -32768
const SIGNED_16_BIT_MAX = 32767
export default class MergedStream implements CachedStream {
    private silenceStreams: Map<string, CachedStream> = new Map<string, RecorderStream>()

    getCachedStream(): Duplex {
        return CreateStreamFromBuffer(this.getCachedBuffer())
    }

    getCachedBuffer(): Buffer {
        const buffers: Buffer[] = []
        this.silenceStreams.forEach((stream: CachedStream) => {
            buffers.push(stream.getCachedBuffer(undefined, true))
        })
        let maxLengthOfBuffer = 0
        buffers.forEach((buffer) => {
            maxLengthOfBuffer = Math.max(maxLengthOfBuffer, buffer.length)
        })
        for (let i = 0; i < buffers.length; i++) {
            if (buffers[i].length < maxLengthOfBuffer) {
                const difference = maxLengthOfBuffer - buffers[i].length
                buffers[i] = Buffer.concat([Buffer.alloc(difference, 0), buffers[i]])
            }
        }
        const result = Buffer.alloc(buffers[0].length)
        for (let i = 0; i < result.length; i += 2) {
            let value = 0
            buffers.forEach((buffer: Buffer) => {
                value += buffer.readInt16LE(i)
            })
            value = Math.max(SIGNED_16_BIT_MIN, value)
            value = Math.min(SIGNED_16_BIT_MAX, value)
            result.writeInt16LE(value, i)
        }
        return result
    }

    insertStream(userID: string, stream: CachedStream) {
        this.silenceStreams.set(userID, stream)
    }

    removeStream(userID: string) {
        this.silenceStreams.delete(userID)
    }

    clear() {
        this.silenceStreams.clear()
    }
}