# User
#### ***Status: WIP***
<br>

In this file there will be examples of user data, This includes Public and Private info, It also shows what is expected to be provided by the API ***It can change at any time*** and info on why some stuff is stored.
<br>

# Public User Data

## Fetched Self

When you fetch your self from the API (GET => api/vx/users/@me) It will return the following Info

```json
{
  "id": "178153407742480384",
  "email": "darkerink@kastelapp.org",
  "username": "Darkerink",
  "tag": "1750",
  "creation_date": 1662254341435,
  "email_verified": true,
  "two_fa": false,
  "two_fa_verified": false,
  "ip_verify": false,
  "ip_lock": false,
  "badges": 1004, // Badges are in Bits
  "flags": [], // Flags will Soon be in Bits
  "friends": []
}
```

## Fetched User

When you fetch a user from the API (GET => api/vx/users/:id/fetch) it will return this info.

```json
{
    "id": "5395791986009571328",
    "username": "DarkerInk",
    "tag": "1750",
    "avatar_url": null,
    "bot": false,
    "created_date": 1661117691538,
    "badges": [{
        "name": "Staff",
        "short_description": "Moderates Kastel",
        "small_image": null
    }, {
        "name": "Original User",
        "short_description": "Was one of the first 1000 Users",
        "small_image": null
    }, {
        "name": "Kastel Developer",
        "short_description": "Is a Developer at Kastel/Has made a big Commit to the Project",
        "small_image": null
    }]
}
```

## Internal User

When you create an account these are the things stored. They normally are in different schemas though in this example it will just show everything in one. Most of this stuff is encrypted and or hashed, For this example they are not

```json
{
    "username": "DarkerInk",
    "tag": "1750",
    "id": "5395791986009571328",
    "avatar_url": null,
    "email": "darkerink@zenaxis.org",
    "password": "C@85Ar3V3ryC00!",
    "created_date": 1661117691538,
    "two_fa": true,
    "ip_lock": false,
    "ip_verify": true,
    "ips": ["127.0.0.1"],
    "badges": [{
        "name": "Staff",
        "short_description": "Moderates Kastel",
        "small_image": null
    }, {
        "name": "Original User",
        "short_description": "Was one of the first 1000 Users",
        "small_image": null
    }, {
        "name": "Kastel Developer",
        "short_description": "Is a Maintainer for Kastel or is a contributor",
        "small_image": null
    }],
    "flags": ["STAFF"],
    "friends": [{
        "avatar_url": null,
        "username": "Mik3.",
        "nickname": "Curry",
        "tag": "3808",
        "id": "33171631673133808",
    }],
    "dms": [{
        "avatar_url": null,
        "username": "Mik3.",
        "tag": "3808",
        "id": "33171631673133808",
        "dm_channel_id": "33172345402920010"
    }],
    "guilds": [{ // This does not show all of the guild Data 
        "name": "Kastel Chat Support",
        "id": "33171600011808774",
    }],
    "gifts": [],
    "banned": false,
    "locked": false,
    "ban_reason": null,
    "account_deletion_in_progress": false,
    "email_verified": true,
    "date_of_birth": "976816800000",
    "show_ads": false
}
```