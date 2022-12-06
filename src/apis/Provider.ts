export interface Provider {
    requiredConfigVariables(): string[];
    getStatus(): string;
}
