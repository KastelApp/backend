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

import { Permissions as Perms, RolePermissions, ChannelPermissions, MixedPermissions } from '../../../Constants.js';

class Permissions {
	public bits: bigint;

	public constructor(bits: number | string) {
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
		return Object.keys(Perms).reduce<Record<keyof typeof Perms, boolean>>((obj, key) => {
			obj[key as keyof typeof Perms] = this.has(Perms[key as keyof typeof Perms]);
			return obj;
			// eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter -- I got no other ideas how to fix this
			// @ts-expect-error -- not sure how to fix this :/
		}, {});
	}

	public toArray(): string[] {
		return Object.keys(Perms).reduce<string[]>((arr, key) => {
			if (this.has(Perms[key as keyof typeof Perms])) arr.push(key);
			return arr;
		}, []);
	}

	public hasString(bit: keyof typeof Perms) {
		return this.has(Perms[bit as keyof typeof Perms]);
	}

	public static deserialize(bits: bigint): Permissions {
		return new Permissions(Number(bits));
	}

	public static get FlagFields(): typeof Perms {
		return Perms;
	}

	public static get FlagFieldsArray(): (keyof typeof Perms)[] {
		return Object.keys(Perms) as (keyof typeof Perms)[];
	}

	public static removeRolePerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(RolePermissions)) {
			newPermissions &= ~RolePermissions[key as keyof typeof RolePermissions];
		}

		return newPermissions;
	}

	public static removeChannelPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(ChannelPermissions)) {
			newPermissions &= ~ChannelPermissions[key as keyof typeof ChannelPermissions];
		}

		return newPermissions;
	}

	// this may never be used tbh
	public static removeMixedPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(MixedPermissions)) {
			newPermissions &= ~MixedPermissions[key as keyof typeof MixedPermissions];
		}

		return newPermissions;
	}
}

export default Permissions;

export { Permissions };
