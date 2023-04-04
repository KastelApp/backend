import { Flags } from '../../../Constants'

// This just removes private / invalid flags
class FlagRemover {
    static RemovePrivateNormalFlags(flags: bigint) {
        // Anything above 1n << 25n is a private flag
        return flags & ((1n << 25n) - 1n)
    }

    static NormalFlagsInvalidRemover(flags: bigint) {
        // just goes through all the flags and removes them if they're invalid
        return Object.keys(Flags).reduce((bits, key) => {
            if (bits & Flags[key as keyof typeof Flags]) bits ^= Flags[key as keyof typeof Flags]
            return bits
        }, flags)
    }

    static NormalFlags(flags: bigint) {
        return this.NormalFlagsInvalidRemover(this.RemovePrivateNormalFlags(flags))
    }
}

export default FlagRemover

export { FlagRemover }