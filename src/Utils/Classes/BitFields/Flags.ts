import { Flags } from '../../../Constants'

class FlagFields {
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

    static deserialize(bits: number): FlagFields {
        return new FlagFields(bits)
    }

    static get FlagFields(): typeof Flags {
        return Flags
    }

    static get FlagFieldsArray(): (keyof typeof Flags)[] {
        return Object.keys(Flags) as (keyof typeof Flags)[]
    }

    // Private flags is anything under 1 << 15
    static get PrivateFlags(): (keyof typeof Flags)[] {
        return Object.keys(Flags).filter(key => Flags[key as keyof typeof Flags] < 1 << 15) as (keyof typeof Flags)[]
    }

    // Public flags is anything above 1 << 15
    static get PublicFlags(): (keyof typeof Flags)[] {
        return Object.keys(Flags).filter(key => Flags[key as keyof typeof Flags] >= 1 << 15) as (keyof typeof Flags)[]
    }

    static RemovePrivateFlags(flags: number): number {
        return flags & ~(1 << 15 - 1)
    }
}

export default FlagFields

export { FlagFields }