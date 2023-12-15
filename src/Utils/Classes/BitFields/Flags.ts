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

import { PrivateFlags, PublicFlags } from "../../../Constants.ts";
import FlagUtilsBInt from "./NewFlags.ts";

const PublicPrivateFlags: (keyof typeof PrivateFlags)[] = ["System", "Ghost", "Spammer", "VerifiedBot", "Bot"];

class FlagFields {
	public PrivateFlags: FlagUtilsBInt<typeof PrivateFlags>;

	public PublicFlags: FlagUtilsBInt<typeof PublicFlags>;

	public constructor(PrivFlags: bigint | number | string, PubFlags: bigint | number | string) {
		this.PrivateFlags = new FlagUtilsBInt(PrivFlags, PrivateFlags);

		this.PublicFlags = new FlagUtilsBInt(PubFlags, PublicFlags);
	}

	public get PublicPrivateFlags(): bigint {
		return this.PrivateFlags.clean(PublicPrivateFlags);
	}

	public has(bit: bigint | number | keyof typeof PrivateFlags | keyof typeof PublicFlags) {
		return (
			this.PrivateFlags.has(bit as keyof typeof PrivateFlags) || this.PublicFlags.has(bit as keyof typeof PublicFlags)
		);
	}

	public toArray(): (keyof typeof PrivateFlags | keyof typeof PublicFlags)[] {
		return [...this.PrivateFlags.toArray(), ...this.PublicFlags.toArray()];
	}
}

export default FlagFields;

export { FlagFields };
