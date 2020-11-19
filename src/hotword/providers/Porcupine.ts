import { HotwordEngine } from '../Engine'
import { Transform } from 'stream'
import PorcupineEngine from '@picovoice/porcupine-node'
import {
    PORCUPINE,
    BUMBLEBEE,
    GRASSHOPPER,
} from '@picovoice/porcupine-node/builtin_keywords'
import { AudioUtils } from '../../utils/AudioUtils'

export default class Porcupine extends HotwordEngine {
    protected createDetector(
        userID: string,
        input: Transform,
        callback: (trigger: string) => void
    ): any {
        let engineInstance = new InternalPorcupine(
            [PORCUPINE, GRASSHOPPER, BUMBLEBEE],
            [0.5, 0.5, 0.65]
        )
        input
            .pipe(AudioUtils.createStereoToMonoTransformStream())
            .on('data', (chunk) => {
                let result = engineInstance.processAudio(chunk, 48000)
                if (result) {
                    callback(result)
                }
            })
        return engineInstance
    }

    protected deleteDetector(userID) {
        this.detectors.get(userID)?.release()
    }

    getStatus(): string {
        return 'Porcupine'
    }

    getHotwords(): string[] {
        return ['Porcupine', 'Grasshopper', 'Bumblebee']
    }
}

class InternalPorcupine {
    private engine: PorcupineEngine
    private keywords: Map<number, string> = new Map()
    private inputBuffer: number[] = []
    private released = false

    constructor(keywords: string[], sensitivies: number[]) {
        keywords.forEach((val, index) => {
            this.keywords.set(index, val)
        })
        this.engine = new PorcupineEngine(keywords, sensitivies)
    }

    processAudio(inputFrame: Buffer, inputSampleRate: number): string {
        for (let i = 0; i < inputFrame.length - 1; i += 2) {
            this.inputBuffer.push(inputFrame.readInt16LE(i))
        }
        const PV_SAMPLE_RATE = 16000
        const PV_FRAME_LENGTH = 512
        let hotwordDetected: string = null

        while (
            (this.inputBuffer.length * PV_SAMPLE_RATE) / inputSampleRate >
            PV_FRAME_LENGTH
        ) {
            let outputFrame = new Int16Array(PV_FRAME_LENGTH)
            let sum = 0
            let num = 0
            let outputIndex = 0
            let inputIndex = 0

            while (outputIndex < PV_FRAME_LENGTH) {
                sum = 0
                num = 0
                while (
                    inputIndex <
                    Math.min(
                        this.inputBuffer.length,
                        ((outputIndex + 1) * inputSampleRate) / PV_SAMPLE_RATE
                    )
                ) {
                    sum += this.inputBuffer[inputIndex]
                    num++
                    inputIndex++
                }
                outputFrame[outputIndex] = sum / num
                outputIndex++
            }
            if (!this.released) {
                let r = this.processPorcupine(outputFrame)
                if (r) {
                    hotwordDetected = r
                }
            }
            this.inputBuffer = this.inputBuffer.slice(inputIndex)
        }
        return hotwordDetected
    }

    release() {
        this.released = true
        this.engine.release()
    }

    private processPorcupine(data: Int16Array): string {
        let id = this.engine.process(data)
        return id > -1 ? this.keywords.get(id) : null
    }
}
