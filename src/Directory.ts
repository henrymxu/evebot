import * as path from 'path';

export namespace Directory {
    export const ROOT_DIR = __dirname;

    export function relativeRoot(file: string): string {
        return path.join(ROOT_DIR, `../${file}`);
    }

    export function relativeSource(file: string): string {
        return path.join(ROOT_DIR, file);
    }

    export function relativeConfig(file: string): string {
        return path.join(ROOT_DIR, `../configs/${file}`);
    }

    export function relativeResources(file: string): string {
        return path.join(ROOT_DIR, `../resources/${file}`);
    }
}
