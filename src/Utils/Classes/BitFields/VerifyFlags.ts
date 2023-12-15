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

import { VerificationFlags } from "../../../Constants.ts";
import { FlagUtils } from "./NewFlags.ts";

class VerifyFields extends FlagUtils<typeof VerificationFlags> {
	public constructor(bits: bigint | number | string) {
		super(bits, VerificationFlags);
	}
}

export default VerifyFields;

export { VerifyFields };
