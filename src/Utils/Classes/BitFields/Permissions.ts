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

import { permissions as Perms, rolePermissions, channelPermissions, mixedPermissions } from "../../../Constants.ts";
import FlagUtilsBInt from "./NewFlags.ts";

class Permissions extends FlagUtilsBInt<typeof Perms> {
	public constructor(bits: bigint | number | string) {
		super(bits, Perms);
	}

	public static RemoveRolePerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(rolePermissions)) {
			newPermissions &= ~rolePermissions[key as keyof typeof rolePermissions];
		}

		return newPermissions;
	}

	public static RemoveChannelPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(channelPermissions)) {
			newPermissions &= ~channelPermissions[key as keyof typeof channelPermissions];
		}

		return newPermissions;
	}

	// this may never be used tbh
	public static RemoveMixedPerms(permissions: bigint): bigint {
		let newPermissions = permissions;

		for (const key of Object.keys(mixedPermissions)) {
			newPermissions &= ~mixedPermissions[key as keyof typeof mixedPermissions];
		}

		return newPermissions;
	}
}

export default Permissions;

export { Permissions };
