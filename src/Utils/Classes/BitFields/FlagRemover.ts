import { Flags, VerificationFlags } from '../../../Constants'

// This just removes private / invalid flags
class FlagRemover {
    static RemovePrivateNormalFlags(flags: bigint) {
        // Anything above 1n << 25n is a private flag
        return flags & ((1n << 25n) - 1n)
    }

    static NormalFlagsInvalidRemover(flags: bigint) {
        const validFlags = Object.values(Flags);
        const invalidFlags = flags & ~validFlags.reduce((acc, f) => acc | f, 0n);
        return flags & ~invalidFlags;
    }

    static NormalFlags(flags: bigint) {
        return this.NormalFlagsInvalidRemover(this.RemovePrivateNormalFlags(flags))
    }

    static VerifyFlagsInvalidRemover(flags: number) {
        const validFlags = Object.values(VerificationFlags);
        const invalidFlags = flags & ~validFlags.reduce((acc, f) => acc | f, 0);
        return flags & ~invalidFlags;
    }
}

export default FlagRemover

export { FlagRemover }