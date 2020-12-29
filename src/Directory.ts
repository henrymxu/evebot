import * as path from 'path';

export namespace Directory {
    export const ROOT_DIR = __dirname;
    export const RELATIVE_ROOT_DIR = determineRoot(ROOT_DIR);

    export function relativeRoot(file: string): string {
        return path.join(RELATIVE_ROOT_DIR, `../${file}`);
    }

    export function relativeSource(file: string): string {
        return path.join(ROOT_DIR, file);
    }

    export function relativeConfig(file: string): string {
        return path.join(RELATIVE_ROOT_DIR, `../configs/${file}`);
    }

    export function relativeResources(file: string): string {
        return path.join(RELATIVE_ROOT_DIR, `../resources/${file}`);
    }
}

function determineRoot(dir: string): string {
    const parsed = path.parse(path.join(dir, '../'));
    if (parsed.base === 'build') {
        return path.join(dir, '../');
    } else {
        return dir;
    }
}
