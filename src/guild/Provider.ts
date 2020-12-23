import VoiceConnectionHandler from '../voice/ConnectionHandler';
import {GuildContext} from './Context';
import AudioPlayer from '../voice/AudioPlayer';
import DJ from '../music/DJ';
import InterruptService from '../music/InterruptService';
import Responder from '../communication/Responder';
import Throttler from './Throttler';

export default class GuildProvider {
    private readonly voiceConnectionHandler: VoiceConnectionHandler;
    private readonly audioPlayer: AudioPlayer;
    private readonly dj: DJ;
    private readonly interruptService: InterruptService;
    private readonly responder: Responder;
    private readonly throttler: Throttler;

    constructor(guildContext: GuildContext) {
        this.voiceConnectionHandler = new VoiceConnectionHandler(guildContext);
        this.audioPlayer = new AudioPlayer(guildContext);
        this.dj = new DJ(guildContext);
        this.interruptService = new InterruptService(guildContext);
        this.responder = new Responder(guildContext);
        this.throttler = new Throttler();
    }

    getVoiceConnectionHandler(): VoiceConnectionHandler {
        return this.voiceConnectionHandler;
    }

    getAudioPlayer(): AudioPlayer {
        return this.audioPlayer;
    }

    getDJ(): DJ {
        return this.dj;
    }

    getInterruptService(): InterruptService {
        return this.interruptService;
    }

    getResponder(): Responder {
        return this.responder;
    }

    getThrottler(): Throttler {
        return this.throttler;
    }
}
