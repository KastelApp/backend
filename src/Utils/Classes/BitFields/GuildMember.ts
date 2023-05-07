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

import { GuildMemberFlags as GMF } from '../../../Constants.js';

class GuildMemberFlags {
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
		return Object.keys(GMF).reduce<Record<keyof typeof GMF, boolean>>((obj, key) => {
			obj[key as keyof typeof GMF] = this.has(GMF[key as keyof typeof GMF]);
			return obj;
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- I got no other ideas how to fix this
		}, {} as Record<keyof typeof GMF, boolean>);
	}

	public toArray(): string[] {
		return Object.keys(GMF).reduce<string[]>((arr, key) => {
			if (this.has(GMF[key as keyof typeof GMF])) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof typeof GMF) {
		return this.has(GMF[bit as keyof typeof GMF]);
	}

	public static deserialize(bits: number): GuildMemberFlags {
		return new GuildMemberFlags(Number(bits));
	}

	public static get FlagFields(): typeof GMF {
		return GMF;
	}

	public static get FlagFieldsArray(): (keyof typeof GMF)[] {
		return Object.keys(GMF) as (keyof typeof GMF)[];
	}
}

export default GuildMemberFlags;

export { GuildMemberFlags };
