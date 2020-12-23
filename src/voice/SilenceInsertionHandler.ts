import RecordingStream from '../utils/RecordingStream';

export default class SilenceInsertionHandler {
    private streams: Map<string, RecordingStream>;
    private silenceInsertionInterval: NodeJS.Timeout | undefined = undefined;
    private readonly SAMPLING_RATE = 20; // Discord sends a chunk (if not silent) every 20 ms

    constructor(streamsMap: Map<string, RecordingStream>) {
        this.streams = streamsMap;
    }

    start() {
        this.silenceInsertionInterval = setInterval(() => {
            const silenceChunk = Buffer.from(new Array(3840).fill(0));
            this.streams.forEach(stream => {
                stream.insertSilentChunk(silenceChunk);
            });
        }, this.SAMPLING_RATE);
    }

    stop() {
        if (this.silenceInsertionInterval) {
            clearInterval(this.silenceInsertionInterval);
        }
    }
}
