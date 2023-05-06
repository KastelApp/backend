import { Flags, VerificationFlags } from '../../../Constants.js';

// This just removes private / invalid flags
const FlagRemover = {
	RemovePrivateNormalFlags(flags: bigint) {
		// Anything above 1n << 25n is a private flag
		return flags & ((1n << 25n) - 1n);
	},

	NormalFlagsInvalidRemover(flags: bigint) {
		const validFlags = Object.values(Flags);
		const invalidFlags = flags & ~validFlags.reduce((acc, flg) => acc | flg, 0n);
		return flags & ~invalidFlags;
	},

	NormalFlags(flags: bigint) {
		return this.NormalFlagsInvalidRemover(this.RemovePrivateNormalFlags(flags));
	},

	VerifyFlagsInvalidRemover(flags: number) {
		const validFlags = Object.values(VerificationFlags);
		const invalidFlags = flags & ~validFlags.reduce((acc, flg) => acc | flg, 0);
		return flags & ~invalidFlags;
	},
};

export default FlagRemover;

export { FlagRemover };
