export type Language = string;

export interface LanguageDetails {
    voice: string;
    language: string;
    muteKey: string;
}

export const LanguageMap = new Map<Language, LanguageDetails>([
    [
        'en-US',
        {
            voice: 'en-CA-Linda',
            language: 'English',
            muteKey: 'muted',
        },
    ],
    [
        'ja-JP',
        {
            voice: 'ja-JP-NanamiNeural',
            language: 'Japanese',
            muteKey: 'ミュート',
        },
    ],
]);
