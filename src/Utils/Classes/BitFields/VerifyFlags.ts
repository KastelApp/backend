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

import { VerificationFlags } from '../../../Constants.js';

class VerifyFields {
	public bits: number;

	public constructor(bits: number) {
		this.bits = bits;
	}

	public has(bit: number) {
		return (this.bits & bit) === bit;
	}

	public add(bit: number): this {
		if (this.has(bit)) return this;
		this.bits |= bit;
		return this;
	}

	public remove(bit: number): this {
		if (!this.has(bit)) return this;
		this.bits ^= bit;
		return this;
	}

	public serialize(): number {
		return this.bits;
	}

	public toJSON() {
		return Object.keys(VerificationFlags).reduce<Record<keyof typeof VerificationFlags, boolean>>((obj, key) => {
			obj[key as keyof typeof VerificationFlags] = this.has(VerificationFlags[key as keyof typeof VerificationFlags]);
			return obj;
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- I got no other ideas how to fix this
		}, {} as Record<keyof typeof VerificationFlags, boolean>);
	}

	public toArray(): string[] {
		return Object.keys(VerificationFlags).reduce<string[]>((arr, key) => {
			if (this.has(VerificationFlags[key as keyof typeof VerificationFlags])) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof typeof VerificationFlags) {
		return this.has(VerificationFlags[bit as keyof typeof VerificationFlags]);
	}

	public static deserialize(bits: number): VerifyFields {
		return new VerifyFields(Number(bits));
	}

	public static get FlagFields(): typeof VerificationFlags {
		return VerificationFlags;
	}

	public static get FlagFieldsArray(): (keyof typeof VerificationFlags)[] {
		return Object.keys(VerificationFlags) as (keyof typeof VerificationFlags)[];
	}
}

export default VerifyFields;

export { VerifyFields };
