import { Duplex } from "stream";

export interface CachedStream {
    getCachedStream(lengthInSeconds?: number, withSilence?: boolean): Duplex
    getCachedBuffer(lengthInSeconds?: number, withSilence?: boolean): Buffer
}

export function CreateStreamFromBuffer(buffer: Buffer): Duplex {
    let duplex = new Duplex();
    duplex.push(buffer);
    duplex.push(null);
    return duplex;
}