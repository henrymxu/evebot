'use strict'

import {HotwordModels, Models, SnowboyDetect} from "snowboy"

import {AudioUtils} from "../utils/AudioUtils"
import {Transform} from "stream"
import {HotwordEngine} from "./Engine"

export default class Snowboy extends HotwordEngine {
    protected createDetector(userID: string, input: Transform, callback: (trigger: string) => void): any {
        const detector = createRecognizer(callback)
        input.pipe(AudioUtils.createStereoToMonoTransformStream())
            .pipe(AudioUtils.createDownSampleTransformStream()).pipe(detector)
    }

    protected deleteDetector(userID) {
        this.detectors.get(userID)?.reset()
    }

    getStatus(): string {
        return "Snowboy"
    }
}

function createRecognizer(callback: (hotword: string) => void): SnowboyDetect {
    let detector = new SnowboyDetect({
        resource: "resources/common.res",
        models: constructModels(),
        audioGain: 1.0,
        applyFrontend: true
    })
    // detector.on('silence', () => {});
    // detector.on('sound', buffer => {});
    // detector.on('error', () => {console.log('error');});
    detector.on('hotword', function (index, hotword, buffer) {
        // <buffer> contains the last chunk of the audio that triggers the "hotword"
        // event. It could be written to a wav stream. You will have to use it
        // together with the <buffer> in the "sound" event if you want to get audio
        // data after the hotword.
        // console.log('hotword', index, hotword)
        callback(hotword)
    })
    return detector
}

function constructModels(): HotwordModels {
    const models = new HotwordModels()
    models.add({
        file: 'resources/models/alexa.umdl',
        sensitivity: '0.6',
        hotwords: 'alexa',
    })
    // models.add({
    //     file: 'resources/models/computer.umdl',
    //     sensitivity: '0.6',
    //     hotwords: 'computer',
    // })
    return models
}
