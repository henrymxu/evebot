import {Duplex, Transform, TransformCallback} from "stream"
import {CachedStream, CreateStreamFromBuffer} from "./CachedStream"

const MAX_BUFFER_SIZE = 500 // Buffer in seconds is approximately MAX_BUFFER_SIZE / 50
const SAMPLING_RATE = 20 // Discord sends a chunk (if not silent) every 20 ms
const DEBOUNCE_TIME = 30 // Debounce time for inserting silence (Don't want to accidentally insert silence)
export default class RecorderStream extends Transform implements CachedStream {
    private rollingBuffer: Buffer[] = []
    private rollingBufferWithSilence: Buffer[] = []

    private isWriting: Boolean = false
    private readonly insertSilence: Boolean
    private silenceDebouncer: NodeJS.Timeout | undefined = undefined

    constructor(insertSilence: boolean = false) {
        super();
        this.insertSilence = insertSilence
        if (this.insertSilence) {
            this.setupSilenceInsertion()
        }
    }

    private setupSilenceInsertion() {
        setTimeout(() => {
            const silenceChunk = Buffer.from(new Array(3840).fill(0))
            this.insertChunk(this.rollingBufferWithSilence, silenceChunk, true)
            this.setupSilenceInsertion()
        }, SAMPLING_RATE)
    }

    getCachedStream(lengthInSeconds: number = MAX_BUFFER_SIZE / 50, withSilence: boolean = false): Duplex {
        this.isWriting = true
        const stream = CreateStreamFromBuffer(this.getCachedBuffer(lengthInSeconds, withSilence))
        this.isWriting = false
        return stream;
    }

    getCachedBuffer(lengthInSeconds: number = MAX_BUFFER_SIZE / 50, withSilence: boolean = false): Buffer {
        const buffer = !withSilence ? this.rollingBuffer : this.rollingBufferWithSilence
        const samplesPerSecond = 48000
        const bytesPerSample = 2
        const channels = 2
        const numberOfBytes = lengthInSeconds * samplesPerSecond * bytesPerSample * channels
        if (buffer.length === 0) {
            return Buffer.alloc(0)
        }
        const numberOfChunks = Math.min(numberOfBytes / buffer[0].length, MAX_BUFFER_SIZE)
        return Buffer.concat(buffer.slice(-numberOfChunks))
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.insertChunk(this.rollingBuffer, chunk)
        if (this.insertSilence) {
            this.insertChunk(this.rollingBufferWithSilence, chunk)
        }
        this.push(chunk)
        callback()
    }

    private insertChunk(buffer: Buffer[], chunk: any, isSilenceChunk: boolean = false) {
        if (!this.isWriting && !(isSilenceChunk && this.silenceDebouncer)) {
            if (buffer.length > MAX_BUFFER_SIZE) { // Chunk size ~3840
                buffer.shift()
            }
            buffer.push(chunk)
            if (!isSilenceChunk) {
                this.resetSilenceDebounce()
            }
        }
    }

    private resetSilenceDebounce() {
        if (this.silenceDebouncer) {
            clearTimeout(this.silenceDebouncer)
        }
        this.silenceDebouncer = setTimeout(() => {
            this.silenceDebouncer = undefined
        }, DEBOUNCE_TIME)
    }
}
