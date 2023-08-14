import type { types } from "@kastelll/cassandra-driver";

interface Roles {
    AllowedMentions: number;
    AllowedNsfw: boolean;
    Color: number;
    Deleteable: boolean;
    GuildId: string;
    Hoisted: boolean;
    Name: string;
    Permissions: types.Long;
    Position: number;
    RoleId: string;
}

export default Roles;
