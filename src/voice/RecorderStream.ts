import {Duplex, Transform, TransformCallback} from "stream"

const MAX_BUFFER_SIZE = 500 // Buffer in seconds is approximately MAX_BUFFER_SIZE / 50
export default class RecorderStream extends Transform {
    private rollingBuffer: Buffer[] = []
    private isWriting: Boolean = false

    getRecordedStream(lengthInSeconds: number = MAX_BUFFER_SIZE / 50): Duplex {
        this.isWriting = true
        let duplex = new Duplex();
        duplex.push(this.getBuffer(lengthInSeconds));
        duplex.push(null);
        this.isWriting = false
        return duplex;
    }

    getBuffer(lengthInSeconds: number = MAX_BUFFER_SIZE / 50): Buffer {
        const samplesPerSecond = 48000
        const bytesPerSample = 2
        const channels = 2
        const numberOfBytes = lengthInSeconds * samplesPerSecond * bytesPerSample * channels
        if (this.rollingBuffer.length === 0) {
            return Buffer.alloc(0)
        }
        const numberOfChunks = Math.min(numberOfBytes / this.rollingBuffer[0].length, MAX_BUFFER_SIZE)
        return Buffer.concat(this.rollingBuffer.slice(-numberOfChunks))
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if (!this.isWriting) {
            if (this.rollingBuffer.length > MAX_BUFFER_SIZE) { // Chunk size ~3840
                this.rollingBuffer.shift()
            }
            this.rollingBuffer.push(chunk)
        }
        this.push(chunk)
        callback()
    }
}
