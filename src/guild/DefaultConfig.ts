import {ConfigImplementation} from './ConfigImplementation';

export class DefaultConfig extends ConfigImplementation {
    constructor(json: object) {
        super('0');
        this.json = json;
    }

    async load() {
        // Do nothing
    }

    save() {
        // Do nothing
    }
}
