import { messageFlags, nonDeletableMessageFlags } from "../../../Constants.ts";
import { FlagUtils } from "./NewFlags.ts";

// honestly easiest way instead of rewriting old code
class MessageFlags extends FlagUtils<typeof messageFlags> {
	public constructor(bits: bigint | number | string) {
		super(bits, messageFlags);
	}
    
    public isDeletable(flag: number ) {
        return (flag & nonDeletableMessageFlags) === 0;
    }
}

export default MessageFlags;

export { MessageFlags };
