interface PermissionsOverrides {
    Allow: string;
    Deny: string; 
    Editable: boolean;
    Id: string; // Id of the user or role
    PermissionId: string;
    Slowmode: number;
    Type: string;
}

export default PermissionsOverrides;
