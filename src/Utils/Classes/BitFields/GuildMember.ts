import { guildMemberFlags as GMF } from "../../../Constants.ts";
import { FlagUtils } from "./NewFlags.ts";

// honestly easiest way instead of rewriting old code
class GuildMemberFlags extends FlagUtils<typeof GMF> {
	public constructor(bits: bigint | number | string) {
		super(bits, GMF);
	}
}

export default GuildMemberFlags;

export { GuildMemberFlags };
