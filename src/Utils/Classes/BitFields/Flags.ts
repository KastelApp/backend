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

import { Flags } from '../../../Constants.js';

class FlagFields {
	public bits: bigint;

	public constructor(bits: bigint | number | string) {
		this.bits = BigInt(bits);
	}

	public has(bit: bigint) {
		return (this.bits & bit) === bit;
	}

	public add(bit: bigint): this {
		if (this.has(bit)) return this;
		this.bits |= bit;
		return this;
	}

	public remove(bit: bigint): this {
		if (!this.has(bit)) return this;
		this.bits ^= bit;
		return this;
	}

	public serialize(): bigint {
		return this.bits;
	}

	public toJSON() {
		return Object.keys(Flags).reduce<Record<keyof typeof Flags, boolean>>((obj, key) => {
			obj[key as keyof typeof Flags] = this.has(Flags[key as keyof typeof Flags]);
			return obj;
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- I got no other ideas how to fix this
			// @ts-expect-error -- not sure how to fix this :/
		}, {});
	}

	public toArray(): string[] {
		return Object.keys(Flags).reduce<string[]>((arr, key) => {
			if (this.has(Flags[key as keyof typeof Flags])) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof typeof Flags) {
		return this.has(Flags[bit as keyof typeof Flags]);
	}

	public removeString(bit: keyof typeof Flags) {
		return this.remove(Flags[bit]);
	}

	public addString(bit: keyof typeof Flags) {
		return this.add(Flags[bit]);
	}

	public static deserialize(bits: bigint): FlagFields {
		return new FlagFields(Number(bits));
	}

	public static get FlagFields(): typeof Flags {
		return Flags;
	}

	public static get FlagFieldsArray(): (keyof typeof Flags)[] {
		return Object.keys(Flags) as (keyof typeof Flags)[];
	}

	// Private flags is anything above 1n << 25n
	public static get PrivateFlags(): (keyof typeof Flags)[] {
		return Object.keys(Flags).filter((key) => Flags[key as keyof typeof Flags] >= 1n << 25n) as (keyof typeof Flags)[];
	}

	// Public flags is anything under 1n << 25n
	public static get PublicFlags(): (keyof typeof Flags)[] {
		return Object.keys(Flags).filter((key) => Flags[key as keyof typeof Flags] < 1n << 25n) as (keyof typeof Flags)[];
	}

	public static RemovePrivateFlags(flags: bigint): bigint {
		return flags & ((1n << 25n) - 1n);
	}

	public toString() {
		return String(this.bits);
	}
}

export default FlagFields;

export { FlagFields };
