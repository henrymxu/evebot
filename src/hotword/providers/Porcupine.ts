/* eslint-disable */
// @ts-ignore
import PorcupineEngine from '@picovoice/porcupine-node'
// @ts-ignore
import {ALEXA, OK_GOOGLE, HEY_SIRI} from '@picovoice/porcupine-node/builtin_keywords'
/* eslint-enable */
import {HotwordEngine} from '../Engine'
import {Transform} from 'stream'
import {AudioUtils} from '../../utils/AudioUtils'

export default class Porcupine extends HotwordEngine {
    protected createDetector(userID: string, input: Transform, callback: (trigger: string) => void): any {
        let engineInstance = new InternalPorcupine([ALEXA, OK_GOOGLE, HEY_SIRI], [0.4, 0.4, 0.4])
        input.pipe(AudioUtils.createStereoToMonoTransformStream()).on('data', (chunk) => {
            let result = engineInstance.processAudio(chunk,48000)
            if (result > -1) { callback(this.getHotwords()[result]) }
        })
        return engineInstance
    }

    protected deleteDetector(userID: string) {
        this.detectors.get(userID)?.release()
    }

    getStatus(): string {
        return 'Porcupine'
    }

    getHotwords(): string[] {
        return ['ALEXA', 'OK_GOOGLE', 'HEY_SIRI']
    }
}

class InternalPorcupine {
    private engine: PorcupineEngine
    private keywords: Map<number, number> = new Map()
    private inputBuffer: number[] = []
    private released = false

    constructor(keywords: number[], sensitivies: number[]) {
        keywords.forEach((val, index) => {
            this.keywords.set(index, val)
        })
        this.engine = new PorcupineEngine(keywords, sensitivies)
    }

    processAudio(inputFrame: Buffer, inputSampleRate: number): number {
        for (let i = 0; i < inputFrame.length - 1; i += 2) {
            this.inputBuffer.push((inputFrame.readInt16LE(i)))
        }
        const PV_SAMPLE_RATE = 16000;
        const PV_FRAME_LENGTH = 512;
        let hotwordDetected: number = -1;

        while ((this.inputBuffer.length * PV_SAMPLE_RATE / inputSampleRate) > PV_FRAME_LENGTH) {
            let outputFrame = new Int16Array(PV_FRAME_LENGTH);
            let sum = 0;
            let num = 0;
            let outputIndex = 0;
            let inputIndex = 0;

            while (outputIndex < PV_FRAME_LENGTH) {
                sum = 0;
                num = 0;
                while (inputIndex < Math.min(this.inputBuffer.length, (outputIndex + 1) * inputSampleRate / PV_SAMPLE_RATE)) {
                    sum += this.inputBuffer[inputIndex];
                    num++;
                    inputIndex++;
                }
                outputFrame[outputIndex] = sum / num;
                outputIndex++;
            }
            if (!this.released) {
                let r = this.processPorcupine(outputFrame);
                if (r !== undefined) { hotwordDetected = r }
            }
            this.inputBuffer = this.inputBuffer.slice(inputIndex);
        }
        return hotwordDetected;
    }

    release() {
        this.released = true
        this.engine.release()
    }

    private processPorcupine(data: Int16Array): number | undefined {
        let id = this.engine.process(data);
        return this.keywords.get(id)
    }
}