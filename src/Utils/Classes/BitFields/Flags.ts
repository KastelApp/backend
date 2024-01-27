import { privateFlags, publicFlags } from "../../../Constants.ts";
import FlagUtilsBInt from "./NewFlags.ts";

const publicPrivateFlags: (keyof typeof privateFlags)[] = ["System", "Ghost", "Spammer", "VerifiedBot", "Bot"];

class FlagFields {
	public PrivateFlags: FlagUtilsBInt<typeof privateFlags>;

	public PublicFlags: FlagUtilsBInt<typeof publicFlags>;

	public constructor(PrivFlags: bigint | number | string, PubFlags: bigint | number | string) {
		this.PrivateFlags = new FlagUtilsBInt(PrivFlags, privateFlags);

		this.PublicFlags = new FlagUtilsBInt(PubFlags, publicFlags);
	}

	public get PublicPrivateFlags(): bigint {
		return this.PrivateFlags.clean(publicPrivateFlags);
	}

	public has(bit: bigint | number | keyof typeof privateFlags | keyof typeof publicFlags) {
		return (
			this.PrivateFlags.has(bit as keyof typeof privateFlags) || this.PublicFlags.has(bit as keyof typeof publicFlags)
		);
	}

	public toArray(): (keyof typeof privateFlags | keyof typeof publicFlags)[] {
		return [...this.PrivateFlags.toArray(), ...this.PublicFlags.toArray()];
	}
	
	public toJSON() {
		return {
			PrivateFlags: this.PrivateFlags.bits.toString(),
			PublicFlags: this.PublicFlags.bits.toString(),
		};
	}
	
	public static fromJSON(data: { PrivateFlags: bigint | number | string; PublicFlags: bigint | number | string }) {
		return new FlagFields(data.PrivateFlags, data.PublicFlags);
	}
}

export default FlagFields;

export { FlagFields };
