import type { types } from "@kastelll/cassandra-driver";

interface PermissionsOverrides {
    Allow: types.Long;
    Deny: types.Long;
    Editable: boolean;
    Id: string; // Id of the user or role
    PermissionId: string;
    Slowmode: number;
    Type: string;
}

export default PermissionsOverrides;
