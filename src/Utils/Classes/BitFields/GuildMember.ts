/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { GuildMemberFlags as GMF } from '../../../Constants'

class GuildMemberFlags {
    bits: number
    constructor(bits: number) {
        this.bits = bits
    }

    has(bit: number) {
        return (this.bits & bit) === bit
    }

    add(bit: number): this {
        if (this.has(bit)) return this
        this.bits |= bit
        return this
    }

    remove(bit: number): this {
        if (!this.has(bit)) return this
        this.bits ^= bit
        return this
    }

    serialize(): number {
        return this.bits
    }

    toJSON(): Record<keyof typeof GMF, boolean> {
        return Object.keys(GMF).reduce((obj, key) => {
            obj[key as keyof typeof GMF] = this.has(GMF[key as keyof typeof GMF])
            return obj
        }, {} as Record<keyof typeof GMF, boolean>)
    }

    toArray(): string[] {
        return Object.keys(GMF).reduce((arr, key) => {
            if (this.has(GMF[key as keyof typeof GMF])) arr.push(key)
            return arr
        }, [] as string[])
    }

    hasString(bit: keyof typeof GMF) {
        return this.has(GMF[bit as keyof typeof GMF])
    }

    static deserialize(bits: number): GuildMemberFlags {
        return new GuildMemberFlags(Number(bits))
    }

    static get FlagFields(): typeof GMF {
        return GMF
    }

    static get FlagFieldsArray(): (keyof typeof GMF)[] {
        return Object.keys(GMF) as (keyof typeof GMF)[]
    }
}

export default GuildMemberFlags

export { GuildMemberFlags }