import {Duplex} from 'stream';

export interface CachingStream {
    getCachedStream(lengthInSeconds?: number, withSilence?: boolean): Duplex;
    getCachedBuffer(lengthInSeconds?: number, withSilence?: boolean): Buffer;
}

export function CreateStreamFromBuffer(buffer: Buffer): Duplex {
    const duplex = new Duplex();
    duplex.push(buffer);
    duplex.push(null);
    return duplex;
}
