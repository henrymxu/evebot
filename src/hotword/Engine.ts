import {Transform} from "stream"

export abstract class HotwordEngine {
    protected detectors: Map<string, any> = new Map()

    remove(userID: string) {
        if (this.detectors.has(userID)) {
            this.deleteDetector(userID)
            this.detectors.delete(userID)
        }
    }

    clear() {
        this.detectors.clear()
    }

    register(userID: string, input: Transform, callback: (trigger: string) => void) {
        if (this.detectors.has(userID)) {
            return
        }
        this.detectors.set(userID, this.createDetector(userID, input, callback))
    }

    protected abstract createDetector(userID: string, input: Transform, callback: (trigger: string) => void): any
    protected abstract deleteDetector(userID)
    abstract getStatus(): string
    abstract getHotwords(): string[]
}