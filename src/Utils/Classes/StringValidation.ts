import Constants from "../../Constants";

class StringValidation {
    static isString(value: any): boolean {
        return typeof value === 'string'
    }

    static GuildName(value: string): boolean {
        if (!this.isString(value)) return false

        if (value.length > Constants.Settings.Max.GuildNameLength) return false

        if (value.length < Constants.Settings.Min.GuildNameLength) return false

        for (const RegexOrString of Constants.Settings.DisallowedWords.Guilds as (string | RegExp)[]) {
            if (typeof RegexOrString === 'string') {
                if (value.includes(RegexOrString)) return false
            } else {
                if (RegexOrString.test(value)) return false
            }
        }

        for (const RegexOrString of Constants.Settings.DisallowedWords.Global as (string | RegExp)[]) {
            if (typeof RegexOrString === 'string') {
                if (value.includes(RegexOrString)) return false
            } else {
                if (RegexOrString.test(value)) return false
            }
        }

        return true
    }

    static GuildDescription(value: string): boolean {
        if (!this.isString(value)) return false

        if (value.length > Constants.Settings.Max.GuildDescriptionLength) return false

        for (const RegexOrString of Constants.Settings.DisallowedWords.Global as (string | RegExp)[]) {
            if (typeof RegexOrString === 'string') {
                if (value.includes(RegexOrString)) return false
            } else {
                if (RegexOrString.test(value)) return false
            }
        }

        return true
    }
}

export default StringValidation

export { StringValidation}