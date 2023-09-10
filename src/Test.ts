import { GuildMemberFlags, Permissions } from "./Constants.js";
import PermissionHandler from "./Utils/Versioning/v1/PermissionCheck.js";

const Test = new PermissionHandler(
    '123',
    GuildMemberFlags.Owner,
    [
        {
            Id: '123',
            Permissions: 0n,
            Position: 1
        }
    ],
    [
        {
            Id: '1234',
            Overrides: [
                {
                    Allow: Permissions.BypassSlowmode,
                    Deny: 0n,
                    Type: 'Member',
                    Id: '123'
                }
            ]
        }
    ]
);

console.log(Test.HasChannelPermission('1234', 'SendMessages'));
