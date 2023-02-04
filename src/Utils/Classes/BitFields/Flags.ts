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

import { Flags } from '../../../Constants'

class FlagFields {
    bits: bigint
    constructor(bits: number) {
        this.bits = BigInt(bits)
    }

    has(bit: bigint) {
        return (this.bits & bit) === bit
    }

    add(bit: bigint): this {
        if (this.has(bit)) return this
        this.bits |= bit
        return this
    }

    remove(bit: bigint): this {
        if (!this.has(bit)) return this
        this.bits ^= bit
        return this
    }

    serialize(): bigint {
        return this.bits
    }

    toJSON(): Record<keyof typeof Flags, boolean> {
        return Object.keys(Flags).reduce((obj, key) => {
            obj[key as keyof typeof Flags] = this.has(Flags[key as keyof typeof Flags])
            return obj
        }, {} as Record<keyof typeof Flags, boolean>)
    }

    toArray(): string[] {
        return Object.keys(Flags).reduce((arr, key) => {
            if (this.has(Flags[key as keyof typeof Flags])) arr.push(key)
            return arr
        }, [] as string[])
    }

    hasString(bit: keyof typeof Flags) {
        return this.has(Flags[bit as keyof typeof Flags])
    }

    static deserialize(bits: bigint): FlagFields {
        return new FlagFields(Number(bits))
    }

    static get FlagFields(): typeof Flags {
        return Flags
    }

    static get FlagFieldsArray(): (keyof typeof Flags)[] {
        return Object.keys(Flags) as (keyof typeof Flags)[]
    }

    // Private flags is anything above 1n << 25n
    static get PrivateFlags(): (keyof typeof Flags)[] {
        return Object.keys(Flags).filter(key => Flags[key as keyof typeof Flags] >= 1n << 25n) as (keyof typeof Flags)[]
    }

    // Public flags is anything under 1n << 25n
    static get PublicFlags(): (keyof typeof Flags)[] {
        return Object.keys(Flags).filter(key => Flags[key as keyof typeof Flags] < 1n << 25n) as (keyof typeof Flags)[]
    }

    static RemovePrivateFlags(flags: bigint): bigint {
        return flags & ((1n << 25n) - 1n)
    }
}

export default FlagFields

export { FlagFields }