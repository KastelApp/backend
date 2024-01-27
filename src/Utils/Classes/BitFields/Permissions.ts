/**
 * ? Permissions are now like this
 * ? [[ 256n, 1n ]] // 256n = ManageInvites, 1n = CreateInvite
 * ? The main group is ManageInvites, the sub permission is CreateInvite
 * ? If the second number is -1n, then it means that all the permissions for that group are enabled
 * ? If its 0n, then it means nothing is enabled
 * ? The concept of permissions are still the same as Discords, we just have more control over them.
 * ? PermissionOverrides still will have "allow" and "deny" properties, but they now will be an array of arrays of strings (BigInts)
 */

import { permissions } from "@/Constants.ts";
import type { bigintPair } from "@/Utils/Cql/Types/PermissionsOverides.ts";

type hasType = "all" | "some";

type PermissionKeys = {
	[K in keyof typeof permissions]: keyof (typeof permissions)[K]["subPermissions"];
};

type PermissionKey = PermissionKeys[keyof PermissionKeys];

class Permissions {
	public bits: [bigint | string, bigint | string][]; // if the second number is -1n (or "-1"), then it means that all the permissions for that group are enabled

	public constructor(bits: [bigint | string, bigint | string][]) {
		this.bits = bits;

		this.fixBits();
	}

	public has<T extends PermissionKey, HT extends hasType>(
		perms: T[],
		mustHaveAll?: HT,
		ignoreAdmin?: boolean,
	): boolean {
		const groups = perms
			.map((permission) => this.getGroupFromSubPermission(permission))
			.filter((group) => group !== null)
			.map((group) => group as keyof typeof permissions)
			.reduce<(keyof typeof permissions)[]>((groups, group) => {
				if (!groups.includes(group)) groups.push(group);
				return groups;
			}, []);

		if (!ignoreAdmin && this.bits.some((bits) => BigInt(bits[0]) === permissions.Administrator.int)) return true;

		const has = groups.map((group) => {
			const groupBits = this.bits.find((bits) => BigInt(bits[0]) === permissions[group].int);

			if (!groupBits) return [false];

			if (BigInt(groupBits[1]) === -1n) return [true];

			return perms.map((permission) => {
				const permissionBits = this.bits.find((bits) => {
					// @ts-expect-error -- unsure how to fix this sorry
					const and = BigInt(bits[1]) & (permissions[group].subPermissions[permission] ?? -99n);

					// @ts-expect-error -- unsure how to fix this sorry
					return bits[0] === permissions[group].int && and === (permissions[group].subPermissions[permission] ?? -99n);
				});

				return Boolean(permissionBits);
			});
		});

		if (mustHaveAll === "all") {
			return has.map((x) => x.includes(false)).includes(false);
		} else if (mustHaveAll === "some") {
			return has.some((x) => x.includes(true));
		}

		return false; // ? you didn't provide a method, we default to false
	}

	public add<T extends PermissionKey>(perms: (T | "Administrator")[]): this {
		for (const perm of perms) {
			if (perm === "Administrator") {
				this.bits = [[permissions.Administrator.int, -1n]];

				continue;
			}

			const group = this.getGroupFromSubPermission(perm);

			if (!group) continue;

			const groupBits = this.bits.find((bits) => BigInt(bits[0]) === permissions[group].int);

			if (groupBits) {
				if (BigInt(groupBits[1]) === -1n) continue;

				this.bits[this.bits.indexOf(groupBits)] = [
					groupBits[0],
					// @ts-expect-error -- unsure how to fix this sorry
					BigInt(groupBits[1]) | permissions[group].subPermissions[perm],
				];
			} else {
				// @ts-expect-error -- unsure how to fix this sorry
				this.bits.push([permissions[group].int, permissions[group].subPermissions[perm]]);
			}
		}

		this.fixBits();

		return this;
	}

	public remove<T extends PermissionKey>(perms: (T | "Administrator")[]): this {
		for (const perm of perms) {
			if (perm === "Administrator") {
				this.bits = this.bits.filter((bits) => BigInt(bits[0]) !== permissions.Administrator.int);

				continue;
			}

			const group = this.getGroupFromSubPermission(perm);

			if (!group) continue;

			const groupBits = this.bits.find((bits) => BigInt(bits[0]) === permissions[group].int);

			if (!groupBits) continue;

			if (BigInt(groupBits[1]) === -1n) {
				// @ts-expect-error -- unsure how to fix this sorry
				this.bits[this.bits.indexOf(groupBits)] = [groupBits[0], permissions[group].subPermissions[perm]];
			} else {
				this.bits[this.bits.indexOf(groupBits)] = [
					groupBits[0],
					// @ts-expect-error -- unsure how to fix this sorry
					BigInt(groupBits[1]) ^ permissions[group].subPermissions[perm],
				];
			}
		}

		return this;
	}

	private getGroupFromSubPermission(subPermission: PermissionKey): keyof typeof permissions | null {
		for (const group of Object.keys(permissions)) {
			if (subPermission in permissions[group as keyof typeof permissions].subPermissions)
				return group as keyof typeof permissions;
		}

		return null;
	}

	public toJSON() {
		// we turn the arrays into something like this: { group: { subPermission: true } }
		const obj: Record<string, Record<string, boolean>> = {};

		for (const [group, stuff] of Object.entries(permissions)) {
			for (const [subPermission] of Object.entries(stuff.subPermissions)) {
				if (!obj[group]) obj[group] = {};

				// @ts-expect-error -- its fine
				obj[group][subPermission] = this.has([subPermission as PermissionKey], "some", true);
			}
		}

		return obj;
	}

	private fixBits() {
		// removes duplicates and invalids
		this.bits = this.bits
			.filter((bits) => {
				if (typeof bits[0] !== "string" && typeof bits[0] !== "bigint") return false;
				return !(typeof bits[1] !== "string" && typeof bits[1] !== "bigint");
			})
			.reduce<[bigint | string, bigint | string][]>((bits, bit) => {
				if (bits.some((b) => b[0] === bit[0])) return bits;

				return [...bits, bit];
			}, [])
			.map((bits) => {
				if (typeof bits[0] === "string") bits[0] = BigInt(bits[0]);
				if (typeof bits[1] === "string") bits[1] = BigInt(bits[1]);

				// remove invalids (invalids are ones that don't exist in the permissions.ts file)
				if (!Object.values(permissions).some((group) => group.int === bits[0])) return null;
				if (
					!Object.values(permissions).some((group) => Object.values(group.subPermissions).includes(bits[1] as bigint))
				)
					return null;

				return bits;
			})
			.filter((bits) => bits !== null) as [bigint, bigint][];
	}

	public get normizedBits() {
		return this.bits.map((bits) => {
			if (typeof bits[0] === "bigint") bits[0] = bits[0].toString();
			if (typeof bits[1] === "bigint") bits[1] = bits[1].toString();

			return bits;
		}) as [string, string][];
	}

	public get bitsForDatabase() {
		return this.normizedBits.map((bits) => {
			return {
				first: bits[0],
				second: bits[1],
			};
		});
	}

	public static permissionFromBigint(permissions: bigintPair[]) {
		return Array.isArray(permissions)
			? new Permissions(permissions.map((bits) => [bits.first.toString(), bits.second.toString()]))
			: new Permissions([]);
	}
}

export default Permissions;

export {
	type PermissionKey
}
