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

import { VerificationFlags } from '../../../Constants'

class VerifyFields {
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

    toJSON(): Record<keyof typeof VerificationFlags, boolean> {
        return Object.keys(VerificationFlags).reduce((obj, key) => {
            obj[key as keyof typeof VerificationFlags] = this.has(VerificationFlags[key as keyof typeof VerificationFlags])
            return obj
        }, {} as Record<keyof typeof VerificationFlags, boolean>)
    }

    toArray(): string[] {
        return Object.keys(VerificationFlags).reduce((arr, key) => {
            if (this.has(VerificationFlags[key as keyof typeof VerificationFlags])) arr.push(key)
            return arr
        }, [] as string[])
    }

    hasString(bit: keyof typeof VerificationFlags) {
        return this.has(VerificationFlags[bit as keyof typeof VerificationFlags])
    }

    static deserialize(bits: number): VerifyFields {
        return new VerifyFields(Number(bits))
    }

    static get FlagFields(): typeof VerificationFlags {
        return VerificationFlags
    }

    static get FlagFieldsArray(): (keyof typeof VerificationFlags)[] {
        return Object.keys(VerificationFlags) as (keyof typeof VerificationFlags)[]
    }
}

export default VerifyFields

export { VerifyFields }