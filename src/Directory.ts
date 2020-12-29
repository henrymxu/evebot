import * as path from 'path';

export namespace Directory {
    export const ROOT_DIR = __dirname;

    export function relativeSource(filePath: string): string {
        return path.join(ROOT_DIR, filePath);
    }

    export function relativeConfig(file: string): string {
        return path.join(ROOT_DIR, `../configs/${file}`);
    }

    export function relativeResources(file: string): string {
        return path.join(ROOT_DIR, `../resources/${file}`);
    }
}
