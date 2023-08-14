interface SettingsTokens {
    CreatedDate: Date;
    Flags: number;
    Ip: string;
    Token: string;
    TokenId: string;
}

interface SettingsMentions {
    MessageId: string;
}

interface Settings {
    Bio: string;
    Language: string;
    MaxFileUploadSize: number;
    MaxGuilds: number;
    Mentions: SettingsMentions[];
    Presence: number;
    Privacy: number;
    Status: string;
    Theme: string;
    Tokens: SettingsTokens[];
    UserId: string;
}

export default Settings;

export type { SettingsTokens, SettingsMentions };
