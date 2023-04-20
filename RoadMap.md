# Roadmap

## 1.0.0

### API

API V1 Is closer then ever. This will be the first functional version of the API ~~hopefully~~. 

- [ ] Middleware
  - [x] Captcha
    - **Description**: The captcha middleware uses Cloudflares turnstile to verify that the request is not a bot. Any request that uses this middleware will be required to have a `captcha` header with the value of the captcha token. Then the middleware will verify that the token is valid and if it is not it will return a `401` error. This captcha also allows for certain items in the body to trigger a captcha. For example if the body contains a `password` field it will trigger a captcha. This is to prevent bots from spamming the API with requests.
    - **Options**: The middleware takes these options:
      - `Enabled` - Whether or not the middleware is enabled (Boolean) (Required)
      - `ExpectedAction` - The action the captcha expects, login, register, etc. (String) (Optional)
      - `ExpectedCData` - The data the captcha expects, the username, email, etc. (String) (Optional) (Not Finished)
      - `BodyTrigger` - The body field that triggers a captcha (String[]) (Optional)
  - [x] User
    - **Description**: The User middleware is for everything to do with Authentication. It verifies the token if its provided. If the route does not allow for people to be logged in then it will return a `401` error. If the route does allow for people to be logged in then it will verify the token and if the token is invalid it will return a `401` error. If the token is valid then it will add the user to the request object.
    - **Options**: The middleware takes these options:
      - `AllowedRequesters` - The requesters that are allowed to use this route ('Bot' | 'User' | 'All') (String) (Required)
      - `Flags` - The flags that are required to use this route (String) (Optional)
      - `AccessType` - If the user needs to be logged in or not ('LoggedIn' | 'LoggedOut' | 'All') (String) (Required)
      - `DisallowedFlags` - The flags that are not allowed to use this route (String) (Optional)
  - [ ] Rate Limit
    - **Description**: The Rate limit middleware is sadly not finished yet, and may not be finished in v1. The point of it is to dynimically rate limit the API based on the amount of requests that are being made. This is to prevent people from spamming the API with requests. This middleware will also be able to be configured to allow for certain routes to be rate limited more then others. 
    - So lets say the route normally allows `10` requests `per minute`. If you hit that that rate limit once nothing will happen, if you hit it again again nothing `may` happen. Though if you hit it for a `third time` you will then see you got a `minute thirty` rate limit. And so on


- [ ] Main Routes
  - [ ] Authentication
    - **Description**: The Authentication routes are for logging in, registering, and logging out etc etc.
    - [x] Login
      - **Description**: This route is for logging in to an account.
      - **Method**: `POST`
      - **Path**: `/auth/login`
      - **Body**:
        - `email` - The email address of the account (String) (Required)
        - `password` - The password of the account (String) (Required)
    - [x] Register
      - **Description**: This route is for registering a new account.
      - **Method**: `POST`
      - **Path**: `/auth/register`
      - **Body**:
        - `username` - The username of the account (String) (Required)
        - `email` - The email address of the account (String) (Required)
        - `password` - The password of the account (String) (Required)
        - `invite` - The invite code of the guild (String) (Optional)
    - [x] Loggout
      - **Description**: This route is for logging out of an account.
      - **Method**: `GET`
      - **Path**: `/auth/logout`
    - [ ] Forgot Password
      - **Description**: This route is for sending a forgot password email.
      - **Method**: `POST`
      - **Path**: `/auth/forgot-password`
    - [ ] Reset Password
      - **Description**: This route is for resetting the password of an account using the forgot password email code.
      - **Method**: `POST`
      - **Path**: `/auth/reset-password`
    - [ ] MFA
      - [ ] Verify Totp
        - **Description**: This route is for verifying the TOTP code when enabling 2FA.
        - **Method**: `POST`
        - **Path**: `/auth/mfa/verify-totp`
    - [ ] Passwordless
      - [ ] SMS
        - [ ] Send
          - **Description**: This route is for sending a passwordless login code via SMS.
          - **Method**: `POST`
          - **Path**: `/auth/passwordless/sms/send`
        - [ ] Verify
          - **Description**: This route is for verifying the passwordless login code via SMS.
          - **Method**: `POST`
          - **Path**: `/auth/passwordless/sms/verify`
      - [ ] Email Code
        - [ ] Send
          - **Description**: This route is for sending a passwordless login code via email.
          - **Method**: `POST`
          - **Path**: `/auth/passwordless/email/send`
        - [ ] Verify
          - **Description**: This route is for verifying the passwordless login code via email.
          - **Method**: `POST`
          - **Path**: `/auth/passwordless/email/verify`
  - [ ] Channels
    - **Description**: The Channels routes are for everything to do with channels, creating, editing, deleting, etc etc. 
    - **Note**: All of these routes require the user to be logged in, If you have Admin Permissions then you should not run into any issues, else then you will need to have the permissions in the "Required Permissions" column.
    - [ ] Fetch
      - **Description**: This route is for fetching the info of the specified channel.
      - **Method**: `GET`
      - **Required Permissions**: `ViewChannel`
      - **Path**: `/channels/:channelId`
    - [ ] Delete
      - **Description**: This route is for deleting the specified channel.
      - **Method**: `DELETE`
      - **Required Permissions**: `ManageChannels`, `ManageChannel`
      - **Path**: `/channels/:channelId`
    - [ ] Edit
      - **Description**: This route is for editing the specified channel.
      - **Method**: `PATCH`
      - **Required Permissions**: `ManageChannels`, `ManageChannel`
      - **Path**: `/channels/:channelId`
      - **Body**:
    - [ ] Messages
      - **Description**: These routes are for fetching, creating, deleting messages and so on. Same rules apply as the channels routes.
      - [ ] Create
        - **Description**: This route is for creating a new message in the specified channel.
        - **Method**: `POST`
        - **Required Permissions**: `SendMessages`
        - **Path**: `/channels/:channelId/messages`
        - **Body**:
          - `content` - The content of the message (String) (Required)
          - `nonce` - The nonce of the message (String) (Optional)
          - `replyingTo` - The id of the message that this message is replying to (String) (Optional)
          - `allowedMentions` - Check the [Allowed Mentions](#allowed-mentions) section for more info (Number) (Optional)
          - `flags` - Check the [Message Flags](#message-flags) section for more info (Number) (Optional)
      - [ ] Fetch
        - **Description**: This route is for fetching the messages in the specified channel.
        - **Method**: `GET`
        - **Required Permissions**: `ViewChannel`, `ReadMessages`
        - **Path**: `/channels/:channelId/messages`
        - **Parameters**:
          - `before` - The id of the message to fetch before (String) (Optional)
          - `after` - The id of the message to fetch after (String) (Optional)
          - `limit` - The amount of messages to fetch (Number) (Optional) (Default: 50)
      - [ ] Purge
        - **Description**: This route is for purging the messages in the specified channel.
        - **Method**: `DELETE`
        - **Required Permissions**: `ManageMessages`
        - **Path**: `/channels/:channelId/messages`
        - **Body**:
          - `messageIds` - The ids of the messages to delete (Array of Strings) (Required)
      - [ ] [Message]
        - [ ] Delete
          - **Description**: This route is for deleting the specified message.
          - **Method**: `DELETE`
          - **Required Permissions**: `ManageMessages`, `MessageAuthor`
          - **Path**: `/channels/:channelId/messages/:messageId`
        - [ ] Edit
          - **Description**: This route is for editing the specified message.
          - **Method**: `PATCH`
          - **Required Permissions**: `MessageAuthor`
          - **Path**: `/channels/:channelId/messages/:messageId`
          - **Body**:
            - `content` - The content of the message (String) (Required)
            - `allowedMentions` - Check the [Allowed Mentions](#allowed-mentions) section for more info (Number) (Optional) (Pointless)
            - `flags` - Check the [Message Flags](#message-flags) section for more info (Number) (Optional)
        - [ ] Fetch
          - **Description**: This route is for fetching the specified message. (Bot Only, N/A for now)
          - **Method**: `GET`
          - **Required Permissions**: `ViewChannel`, `ReadMessages`
          - **Path**: `/channels/:channelId/messages/:messageId`
  - [ ] Guilds
    - [ ] Fetch
      - **Description**: This route is for fetching the guilds that the user is in.
      - **Method**: `GET`
      - **Path**: `/guilds`
      - **Parameters**:
        - `include` - The type of things to include in the response (Strings) (Optional)
          - `owner` - The owner of the guild
          - `coowners` - The co-owners of the guild
        - `limit` - The amount of guilds to fetch (Number) (Optional) (Default: 50)
        - `before` - The id of the guild to fetch before (String) (Optional)
        - `after` - The id of the guild to fetch after (String) (Optional)
    - [ ] New
      - **Description**: This route is for creating a new guild.
      - **Method**: `POST`
      - **Path**: `/guilds`
      - **Body**:
        - `name` - The name of the guild (String) (Required)
        - `description` - The description of the guild (String) (Optional)
        - `channels` - The channels for the guild (Array) (Optional)
          - `name` - The name of the channel (String) (Required)
          - `type` - The type of the channel (Number) (Required)
          - `position` - The position of the channel (Number) (Optional)
          - `id` - The id of the channel (String) (Optional)
          - `children` - The children of the channel (Array of Strings) (Optional) (Id Is required to use this)
        - `roles` - The roles for the guild (Array) (Optional)
          - `name` - The name of the role (String) (Required)
          - `permissions` - The permissions of the role (Number) (Required)
          - `position` - The position of the role (Number) (Optional)
          - `color` - The color of the role (Number) (Optional)
          - `hoist` - Whether the role should be hoisted (Boolean) (Optional)
          - `mentionable` - Whether the role should be mentionable (Boolean) (Optional)
    - [ ] [Guild]
      - [ ] Delete
        - **Description**: This route is for deleting the specified guild.
        - **Method**: `DELETE`
        - **Path**: `/guilds/:guildId`
        - **Required Permissions**: `Owner`
        - **Body**:
          - `code` - A 2FA Code (String) (Required if 2FA is enabled)
      - [ ] Fetch
        - **Description**: This route is for fetching the specified guild.
        - **Method**: `GET`
        - **Path**: `/guilds/:guildId`
        - **Parameters**:
          - `include` - The type of things to include in the response (Strings) (Optional)
            - `owner` - The owner of the guild
            - `coowners` - The co-owners of the guild
      - [ ] Maintenance
        - [ ] Fetch
        - [ ] Enable / Disable
        - [ ] [User]
          - [ ] Bypass
            - **Description**: This route is for bypassing the maintenance mode for the specified user. (Stuff for like bots or certain people)
            - **Method**: `PUT`
            - **Path**: `/guilds/:guildId/maintenance/bypass/:userId`
            - **Required Permissions**: `ManageGuild`
            - **Body**:
              - `code` - A 2FA Code (String) (Required if 2FA is enabled)
      - [ ] Edit
      - [ ] Channels
        - [ ] Fetch
          - **Description**: This route is for fetching the channels in the specified guild.
          - **Method**: `GET`
          - **Path**: `/guilds/:guildId/channels`
          - **Required Permissions**: `ViewChannel`
          - **Parameters**:
            - `limit` - The amount of channels to fetch (Number) (Optional) (Default: 50)
            - `before` - The id of the channel to fetch before (String) (Optional)
            - `after` - The id of the channel to fetch after (String) (Optional)
        - [ ] New
          - **Description**: This route is for creating a new channel in the specified guild.
          - **Method**: `POST`
          - **Path**: `/guilds/:guildId/channels`
          - **Required Permissions**: `ManageChannels`
          - **Body**:
            - `name` - The name of the channel (String) (Required)
            - `description` - The description of the channel (String) (Optional)
            - `type` - The type of the channel (Number) (Required)
            - `nsfw` - Whether the channel is nsfw (Boolean) (Optional)
            - `allowedMentions` - Check the [Allowed Mentions](#allowed-mentions) section for more info (Number) (Optional)
            - `parent` - The parent of the channel (String) (Optional)
            - `position` - The position of the channel (Number) (Optional)
            - `children` - The children of the channel (Array of Strings) (Optional) (if parent is specified this is not allowed)
            - `permissionsOverides` - The permissions overides for the channel (Array) (Optional)
              - `id` - The id of the role or user (String) (Required)
              - `type` - The type of the overide (Number) (Required)
              - `allow` - The permissions to allow (String) (Required)
              - `deny` - The permissions to deny (String) (Required)
      - [ ] Co-Owners
        - [ ] Fetch
        - [ ] New
        - [ ] [Co-Owner]
          - [ ] Delete
      - [ ] Invites
        - [ ] Fetch
          - **Description**: This route is for fetching the invites in the specified guild.
          - **Method**: `GET`
          - **Path**: `/guilds/:guildId/invites`
          - **Required Permissions**: `ManageInvites`
          - **Parameters**:
            - `limit` - The amount of invites to fetch (Number) (Optional) (Default: 50)
            - `before` - The id of the invite to fetch before (String) (Optional)
            - `after` - The id of the invite to fetch after (String) (Optional)
        - [ ] New
          - **Description**: This route is for creating a new invite in the specified guild.
          - **Method**: `POST`
          - **Path**: `/guilds/:guildId/invites`
          - **Required Permissions**: `CreateInvite`
          - **Body**:
            - `channel` - The channel to create the invite in (String) (Required)
            - `maxAge` - The max age of the invite (Number) (Optional) (Default: 86400)
            - `maxUses` - The max uses of the invite (Number) (Optional) (Default: 0)
            - `temporary` - Whether the invite is temporary (Boolean) (Optional) (Default: false)
            - `unique` - Whether the invite is unique (Boolean) (Optional) (Default: false)
        - [ ] Purge
      - [ ] Members
        - [ ] Fetch
        - [ ] [Member]
          - [ ] Ban
          - [ ] Edit
          - [ ] Fetch
          - [ ] Kick
  - [ ] Invite
    - [ ] Fetch Guild
    - [ ] Join
  - [ ] Users
    - [ ] [@Me]
      - [ ] CreateDm
      - [ ] Delete
      - [ ] Disable
      - [ ] Edit
      - [ ] Fetch
      - [ ] Friends
      - [ ] Sessions
    - [ ] [User]
      - [ ] Block
      - [ ] Fetch
      - [ ] Friend
  - [ ] Webhooks
    - [ ] Fetch
    - [ ] Post
    - [ ] Delete
    - [ ] [Webhook]
      - [ ] Fetch


### Allowed Mentions

| Mention  | Value                          | Description                    |
| -------- | ------------------------------ | ------------------------------ |
| Everyone | `0x0000000000000020`, `1 << 5` | Allows you to mention everyone |
| Here     | `0x0000000000000040`, `1 << 6` | Allows you to mention here     |
| Roles    | `0x0000000000000080`, `1 << 7` | Allows you to mention roles    |
| Users    | `0x0000000000000100`, `1 << 8` | Allows you to mention users    |


### Implicit Permissions

We follow the Implicit Permissions system, This means that if you have SendMessages but you do not have ViewChannel then you will not be able to send messages.

From Discord:

> Permissions in Discord are sometimes implicitly denied or allowed based on logical use. The two main cases are `VIEW_CHANNEL` and `SEND_MESSAGES` for text channels. Denying a user or a role `VIEW_CHANNEL` on a channel implicitly denies other permissions on the channel. Though permissions like `SEND_MESSAGES` are not explicitly denied for the user, they are ignored because the user cannot read messages in the channel.


<details>
<summary>CLI</summary>

### CLI

These CLI Commands are the LEAST important things, They mainly are for testing and debugging purposes.

- [ ] CLI Commands
  - [ ] `--verify` - Verify the integrity of the project, confirm that all files are present and correct
  - [ ] `--update` - Update the project to the latest version
  - [ ] `--version` - Display the version of the project
  - [ ] `--help` - Display help information
  - [ ] Account CLI
    - [ ] Create Account
      - Creates a new account.
      - Required Parameters:
        - `--id` - The ID of the account (This is Dangerous to use) (String) (Optional)
        - `--email` - The email address of the account (String) (Required)
        - `--email-verified` - Whether or not the email address has been verified (Boolean / 0 or 1) (Optional)
        - `--username` - The username of the account (String) (Required)
        - `--discriminator` - The discriminator of the account (String) (also --tag) (Optional)
        - `--password` - The password of the account (String) (Required)
        - `--phone` - The phone number of the account (String) (Optional)
        - `--two-factor` - Whether or not the account has two-factor authentication enabled (Boolean / 0 or 1) (Optional)
        - `--two-factor-secret` - The secret for two-factor authentication (String) (Required if two-factor is enabled) (Optional)
        - `--flags` - The flags of the account (Number) (Optional)
        - `--terminated` - Whether or not the account has been terminated (Boolean / 0 or 1) (Optional)
        - `--terminated-reason` - The reason for the account being terminated (String) (Optional)
        - `--disabled` - Whether or not the account has been disabled (Boolean / 0 or 1) (Optional)
    - [ ] Update Account
      - Update an existing account by providing the ID of the account.
        - `--id` - The ID of the account (String) (Required)
        - `--email` - The email address of the account (String) (Optional)
        - `--email-verified` - Whether or not the email address has been verified (Boolean / 0 or 1) (Optional)
        - `--username` - The username of the account (String) (Optional)
        - `--discriminator` - The discriminator of the account (String) (also --tag) (Optional)
        - `--password` - The password of the account (String) (Optional)
        - `--phone` - The phone number of the account (String) (Optional)
        - `--two-factor` - Whether or not the account has two-factor authentication enabled (Boolean / 0 or 1) (Optional)
        - `--two-factor-secret` - The secret for two-factor authentication (String) (Required if two-factor is enabled) (Optional)
        - `--flags` - The flags of the account (Number) (Optional)
        - `--terminated` - Whether or not the account has been terminated (Boolean / 0 or 1) (Optional)
        - `--terminated-reason` - The reason for the account being terminated (String) (Optional)
        - `--disabled` - Whether or not the account has been disabled (Boolean / 0 or 1) (Optional)
        - `--delete` - Delete the account (Boolean / 0 or 1) (Optional)
    - [ ] Force Reset Password
      - Force reset the password of an account by providing the ID of the account.
      - Required Parameters:
        - `--id` - The ID of the account (String) (Required)
        - `--password` - The password of the account (String) (Optional) (If this is not provided, then an email will be sent to the account with a link to reset the password next time they try to login with the old password)
- [ ] CLI Console
  - CLI Console is a REPL that allows you to interact with the database and the project itself when the project is running.
  - Stuff like Disabling routes, Creating accounts, etc.
</details>