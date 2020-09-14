import {VoiceConnection} from "discord.js";
import {Readable} from "stream";

export namespace SilentStreamUtils {

    /**
     * This is required for the bot to be able to listen.
     * discord.js has this, but sometimes it does not work.
     */
    export function playSilentAudioStream(connection: VoiceConnection) {
        connection.play(SilentStreamUtils.createSilenceStream(), { type: "opus" });
        setTimeout(() => {
            if (connection.dispatcher) {
                connection.dispatcher.destroy()
                connection.setSpeaking("SPEAKING")
            }
        }, 250)
    }

    export function createSilenceStream(): Readable {
        const silenceReadable = new Readable()
        silenceReadable._read = function(size) {
            this.push(Buffer.from([0xf8, 0xff, 0xfe]))
        }
        return silenceReadable
    }
}
