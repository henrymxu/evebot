import {Provider} from './Provider';

export class StubProvider implements Provider {
    getStatus(): string {
        return 'No Registered Provider';
    }

    requiredConfigVariables(): string[] {
        return [];
    }
}
