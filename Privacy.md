# Privacy
### ***Status: WIP***
<br>

In This file you will find what is stored when you Register, Send a Message, Create a guild and more. This file is a WIP so everything will not be in here.

# User Data

In This field you will find out what gets stored when you, Sign Up, Login, Update your Account and what will happen when you delete your account

<details>

<summary>Signing Up</summary>
<br>

When You First sign up you are required to Input an 'Email', 'Username', 'Password', and a 'Date of Birth'

The Email is used to send a verification email to make sure you aren't a bot, The username is so people can know who you are, The Password is so you can login and the Date Of Birth is to verify you are at least 13+ (Kastel is a 13+ Application)

Then in the backend we Generate a unique ID (A Snowflake) The ID Stores Info like The Date and time it was created, The DataCenter ID (The Data Center of the server that handled the request), The Worker ID (The Worker that handled the request) and the increment of generating IDs on that Worker.

After we Generate the Unique ID We Also Generate a Tag, The tag is a 4 Digit code linked to your username so people can have more then one of the same username.

Once those Steps are Finished we Then Generate the JSON to store the User Data, Here is an example (**Note This is UnEncrypted To Show you what is stored**)

---
<details>
<summary>The User Data</summary>

```json
{
    "_id": "182801556977225728",
    "email": "darkerink@kastelapp.com",
    "email_verified": true,
    "username": "DarkerInk",
    "tag": "1750",
    "avatar_hash": null,
    "password": "$2b$10$A9xyklWIenr48KBJAtWTd.NVHuJHpvq3chokVEG9.BIEl5ZGHSpsW",
    "phone_number": false,
    "created_date": "1662808589521",
    "date_of_birth": "946706400000",
    "two_fa": false,
    "two_fa_verified": false,
    "twofa_secret": null,
    "ip_verify": true,
    "ips": ["127.0.0.1"],
    "flags": 0,
    "badges": 0,
    "guilds": [],
    "dms": [],
    "groupchats": [],
    "bots": [],
    "banned": false,
    "ban_reason": null,
    "locked": false,
    "account_deletion_in_progress": false,
    "bot": false
}
```
</details>

---

<details>
<summary>What is Encrypted and Why its Encrypted</summary>
<br>

We store the Id, Email, Password and Username for Obvious Reasons, Each one of those are Encrypted besides the password that is hashed.

Date of Birth is kept and Encrpyted, If Users really want they can contact support to remove it though this will block access to NSFW Channels (Since it is used to verify age)

The Users Phone Number is also kept and Encrypted, This is used to send Login Codes if the user has 2FA enabled though no Backup codes stored, It will also be used to send alerts (Messages) When someone new Logs into their account. 

Ips, The Ips of the user when they first register is saved and Encrypted, This is for the setting 'ip verify', Its used to verify ips accessing the account (Logging In, Accessing the API Etc)

Some Misc things that are also encrypted and stored is the 2FA Secret, This is so if any bad actor gets access to the database they can't swipe a ton of 2FA Secrets and try logging into accounts they have account info for but no 2FA codes for.
</details>

---

All info that could lead a paper trail to a User is Encrypted to keep all of our uses Secure and safe from bad Actors.

</details>