import {Transform, TransformCallback} from 'stream'
import defaults from 'defaults';
const pcm_convert = require('pcm-convert')

const TARGET_SAMPLE_RATE = 16000;

//http://watson-developer-cloud.github.io/speech-javascript-sdk/master/speech-to-text_webaudio-l16-stream.js.html#line195
export default class DownSamplingStream extends Transform {
    private bufferUnusedSamples: Float32Array | []
    private options: any

    constructor(options: object) {
        options = defaults(options, {
            sourceSampleRate: 48000,
            downsample: true,
        });
        super(options);
        this.options = options
        this.bufferUnusedSamples = []
    }

    /**
     * Downsamples WebAudio to 16 kHz.
     *
     * Browsers can downsample WebAudio natively with OfflineAudioContext's but it was designed for non-streaming use and
     * requires a new context for each AudioBuffer. Firefox can handle this, but chrome (v47) crashes after a few minutes.
     * So, we'll do it in JS for now.
     *
     * This really belongs in it's own stream, but there's no way to create new AudioBuffer instances from JS, so its
     * fairly coupled to the wav conversion code.
     *
     * @param  {AudioBuffer} bufferNewSamples Microphone/MediaElement audio chunk
     * @return {Float32Array} 'audio/l16' chunk
     */
    downsample(bufferNewSamples: any): Float32Array {
        let buffer: Float32Array
        const newSamples = bufferNewSamples.length
        const unusedSamples = this.bufferUnusedSamples.length
        let i
        let offset
        if (unusedSamples > 0) {
            buffer = new Float32Array(unusedSamples + newSamples)
            for (i = 0; i < unusedSamples; ++i) {
                buffer[i] = this.bufferUnusedSamples[i]
            }
            for (i = 0; i < newSamples; ++i) {
                buffer[unusedSamples + i] = bufferNewSamples[i]
            }
        } else {
            buffer = bufferNewSamples
        }
        // Downsampling and low-pass filter:
        // Input audio is typically 44.1kHz or 48kHz, this downsamples it to 16kHz.
        // It uses a FIR (finite impulse response) Filter to remove (or, at least attinuate)
        // audio frequencies > ~8kHz because sampled audio cannot accurately represent
        // frequiencies greater than half of the sample rate.
        // (Human voice tops out at < 4kHz, so nothing important is lost for transcription.)
        // See http://dsp.stackexchange.com/a/37475/26392 for a good explination of this code.
        var filter = [
            -0.037935,
            -0.00089024,
            0.040173,
            0.019989,
            0.0047792,
            -0.058675,
            -0.056487,
            -0.0040653,
            0.14527,
            0.26927,
            0.33913,
            0.26927,
            0.14527,
            -0.0040653,
            -0.056487,
            -0.058675,
            0.0047792,
            0.019989,
            0.040173,
            -0.00089024,
            -0.037935
        ]
        const samplingRateRatio = this.options.sourceSampleRate / TARGET_SAMPLE_RATE
        const nOutputSamples = Math.floor((buffer.length - filter.length) / samplingRateRatio) + 1
        const outputBuffer = new Float32Array(nOutputSamples)
        for (i = 0; i + filter.length - 1 < buffer.length; i++) {
            offset = Math.round(samplingRateRatio * i)
            let sample = 0
            for (let j = 0; j < filter.length; ++j) {
                sample += buffer[offset + j] * filter[j]
            }
            outputBuffer[i] = sample
        }
        const indexSampleAfterLastUsed = Math.round(samplingRateRatio * i)
        const remaining = buffer.length - indexSampleAfterLastUsed
        if (remaining > 0) {
            this.bufferUnusedSamples = new Float32Array(remaining)
            for (i = 0; i < remaining; ++i) {
                this.bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i]
            }
        } else {
            this.bufferUnusedSamples = new Float32Array(0)
        }
        return outputBuffer
    }

    /**
     * Accepts a Buffer (for binary mode), then downsamples to 16000 and converts to a 16-bit pcm
     */
    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        let source = pcm_convert(chunk, 'int16 mono interleaved le', 'float32 interleaved le')
        if (this.options.downsample) {
            source = this.downsample(source)
        }
        this.push(DownSamplingStream.floatTo16BitPCM(source))
        callback()
    }

    /**
     * Accepts a Float32Array of audio data and converts it to a Buffer of l16 audio data (raw wav)
     *
     * Explanation for the math: The raw values captured from the Web Audio API are
     * in 32-bit Floating Point, between -1 and 1 (per the specification).
     * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
     * Filter & combine samples to reduce frequency, then multiply to by 0x7FFF (32767) to convert.
     * Store in little endian.
     */
    private static floatTo16BitPCM(input: Float32Array): Buffer {
        const output = new DataView(new ArrayBuffer(input.length * 2)) // length is in bytes (8-bit), so *2 to get 16-bit length
        for (let i = 0; i < input.length; i++) {
            const multiplier = input[i] < 0 ? 0x8000 : 0x7fff // 16-bit signed range is -32768 to 32767
            output.setInt16(i * 2, input[i] * multiplier | 0, true) // index, value, little edian
        }
        return Buffer.from(output.buffer)
    };
}