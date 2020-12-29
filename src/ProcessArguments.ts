const args = process.argv.slice(2);

export namespace ProcessArguments {
    export function getKeysPath(): string {
        return args[0];
    }
}
