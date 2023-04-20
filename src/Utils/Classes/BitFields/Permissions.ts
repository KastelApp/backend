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

import { Permissions as Perms, RolePermissions, ChannelPermissions, MixedPermissions } from '../../../Constants'

class Permissions {
    bits: bigint
    constructor(bits: number) {
        this.bits = BigInt(bits)
    }

    has(bit: bigint) {
        return (this.bits & bit) === bit
    }

    add(bit: bigint): this {
        if (this.has(bit)) return this
        this.bits |= bit
        return this
    }

    remove(bit: bigint): this {
        if (!this.has(bit)) return this
        this.bits ^= bit
        return this
    }

    serialize(): bigint {
        return this.bits
    }

    toJSON(): Record<keyof typeof Perms, boolean> {
        return Object.keys(Perms).reduce((obj, key) => {
            obj[key as keyof typeof Perms] = this.has(Perms[key as keyof typeof Perms])
            return obj
        }, {} as Record<keyof typeof Perms, boolean>)
    }

    toArray(): string[] {
        return Object.keys(Perms).reduce((arr, key) => {
            if (this.has(Perms[key as keyof typeof Perms])) arr.push(key)
            return arr
        }, [] as string[])
    }

    hasString(bit: keyof typeof Perms) {
        return this.has(Perms[bit as keyof typeof Perms])
    }

    static deserialize(bits: bigint): Permissions {
        return new Permissions(Number(bits))
    }

    static get FlagFields(): typeof Perms {
        return Perms
    }

    static get FlagFieldsArray(): (keyof typeof Perms)[] {
        return Object.keys(Perms) as (keyof typeof Perms)[]
    }

    static removeRolePerms(permissions: bigint): bigint {
        Object.keys(RolePermissions).forEach((key) => {
            permissions &= ~RolePermissions[key as keyof typeof RolePermissions]
        })

        return permissions
    }

    static removeChannelPerms(permissions: bigint): bigint {
        Object.keys(ChannelPermissions).forEach((key) => {
            permissions &= ~ChannelPermissions[key as keyof typeof ChannelPermissions]
        })

        return permissions
    }

    // this may never be used tbh
    static removeMixedPerms(permissions: bigint): bigint {
        Object.keys(MixedPermissions).forEach((key) => {
            permissions &= ~MixedPermissions[key as keyof typeof MixedPermissions]
        })

        return permissions
    }
}

export default Permissions;

export { Permissions };