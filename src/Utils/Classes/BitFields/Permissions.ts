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

import { Permissions as Perms, RolePermissions, ChannelPermissions, MixedPermissions } from "../../../Constants.ts";
import FlagUtilsBInt from "./NewFlags.ts";

class Permissions extends FlagUtilsBInt<typeof Perms> {
	public constructor(bits: bigint | number | string) {
		super(bits, Perms);
	}

	public static RemoveRolePerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(RolePermissions)) {
			newPermissions &= ~RolePermissions[key as keyof typeof RolePermissions];
		}

		return newPermissions;
	}

	public static RemoveChannelPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(ChannelPermissions)) {
			newPermissions &= ~ChannelPermissions[key as keyof typeof ChannelPermissions];
		}

		return newPermissions;
	}

	// this may never be used tbh
	public static RemoveMixedPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(MixedPermissions)) {
			newPermissions &= ~MixedPermissions[key as keyof typeof MixedPermissions];
		}

		return newPermissions;
	}
}

export default Permissions;

export { Permissions };
