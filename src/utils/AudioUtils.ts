import {Readable, Transform} from 'stream';
import {Lame} from 'node-lame';
import {createReadStream} from 'fs';
import {opus, FFmpeg} from 'prism-media';
import {FileWriter} from 'wav';
import DownSamplingStream from './DownSamplingStream';

export namespace AudioUtils {
    export function createStereoToMonoTransformStream(): Transform {
        const stereoToMonoTransformer = new Transform({objectMode: true});
        stereoToMonoTransformer._transform = function (chunk, encoding, done) {
            this.push(convertStereoBufferToMonoBuffer(chunk));
            chunk = null;
            done();
        };
        return stereoToMonoTransformer;
    }

    /**
     * @returns 16kHz s16 pcm stream
     */
    export function createDownSampleTransformStream(resultMode = 0): Transform {
        const downSampleTransformer = new Transform();
        downSampleTransformer._transform = function (chunk, encoding, done) {
            this.push(chunk);
            chunk = null;
            done();
        };
        return new DownSamplingStream({
            sourceSampleRate: 48000,
            downsample: true,
            writableObjectMode: false,
        });
    }

    export function convertBufferToMp3Buffer(audioBuffer: Buffer, title: string, author: string): Promise<Buffer> {
        const encoder = new Lame({
            output: 'buffer',
            raw: true,
            sfreq: 48,
            bitwidth: 16,
            signed: true,
            'little-endian': true,
            mode: 's',
            meta: {
                title: 'Recording',
                artist: author,
            },
        }).setBuffer(audioBuffer);
        return encoder.encode().then(() => {
            return encoder.getBuffer();
        });
    }

    export function convertMp3FileToOpusStream(inputPath: string): Readable {
        const mp3Stream = createReadStream(inputPath);
        return convertMp3StreamToOpusStream(mp3Stream);
    }

    export function convertMp3StreamToOpusStream(inputStream: Readable): Readable {
        const opusEncoder = new opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });
        const transcoder = new FFmpeg({
            args: ['-analyzeduration', '0', '-loglevel', '0', '-f', 's16le', '-ar', '48000', '-ac', '2'],
        });
        inputStream.pipe(transcoder).pipe(opusEncoder);
        return opusEncoder;
    }

    export function createSilenceStream(): Readable {
        const silenceReadable = new Readable();
        silenceReadable._read = function (size) {
            this.push(Buffer.from([0xf8, 0xff, 0xfe]));
        };
        return silenceReadable;
    }

    export function writeStreamToWavFile(audioStream: Readable, outputPath: string) {
        const wavWriter = new FileWriter(`${outputPath}`, {
            channels: 2,
            sampleRate: 48000,
            bitDepth: 16,
        });
        audioStream.pipe(wavWriter);
    }

    export function createOpusDecodingStream(): Transform {
        return new opus.Decoder({channels: 2, rate: 48000, frameSize: 960});
    }
}

function convertStereoBufferToMonoBuffer(buffer: Buffer): Buffer {
    const newBuffer = Buffer.alloc(buffer.length / 2);
    const HI = 1;
    const LO = 0;
    for (let i = 0; i < newBuffer.length / 2; ++i) {
        const left = (buffer[i * 4 + HI] << 8) | (buffer[i * 4 + LO] & 0xff);
        const right = (buffer[i * 4 + 2 + HI] << 8) | (buffer[i * 4 + 2 + LO] & 0xff);
        const avg = (left + right) / 2;
        newBuffer[i * 2 + HI] = (avg >> 8) & 0xff;
        newBuffer[i * 2 + LO] = avg & 0xff;
    }
    return newBuffer;
}
