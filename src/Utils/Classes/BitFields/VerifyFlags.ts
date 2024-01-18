import { verificationFlags } from "../../../Constants.ts";
import { FlagUtils } from "./NewFlags.ts";

class VerifyFields extends FlagUtils<typeof verificationFlags> {
	public constructor(bits: bigint | number | string) {
		super(bits, verificationFlags);
	}
}

export default VerifyFields;

export { VerifyFields };
