<div>
<div align="center">
  <br />
  <p>
    <a href="https://kastelapp.com"><h1>Kastel</h1></a> 
  </p>
</div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

Kastel is an open-sourced chatting application, Its like [Discord](https://discord.com) but open-sourced and free, It is currently in development and is not ready for use yet, If you want to contribute please read the [Contributing](#contributing) section.

The main focus around it is for the some of the community to help develop and improve it, This will allow the community to have a say in how the application is developed and what features are added, This will also allow the community to help improve the application and make it better for everyone. 

We plan on not storing stuff that is not required.

<details open>
<summary>What we plan on storing</summary>

## User Data

In this table below we explain some data that may be considered sensitive and why we need it, How we store it, How we use it and how you can remove it.

Note, Any Data not listed here can be removed by deleting your account.

| Data              | Why we need it          | How we store it | How we use it                      | How to remove it                       |
| ----------------- | ----------------------- | -------------- | ----------------------------------- | -------------------------------------- |
| ID                | Identify user           | Encrypted      | User identification                 | Delete account                         |
| Email             | Verify account          | Encrypted      | Account verification, communication | Delete account                         |
| Username          | Identify user           | Encrypted      | User identification                 | Delete account                         |
| Password          | Login to account        | Hashed         | User authentication                 | Change password or delete account      |
| Phone number      | Verify account          | Encrypted      | Account verification, communication | Delete account                         |
| Two-factor secret | Verify account          | Encrypted      | Two-factor authentication           | Disable two-factor or delete account   |
| IP addresses      | Account security        | Encrypted      | Session management                  | Log out of all sessions                |

There is some More Data below on what we store, This is stuff like your avatar, tag, flags etc etc

<details>
<summary>More Data</summary>


| Data                      | Why we need it                    | How we store it | How we use it                       | How to remove it                       |
| ------------------------- | --------------------------------- | --------------- | ----------------------------------- | -------------------------------------- |
| Email Verified            | To check if the email is verified | Encrypted       | Account verification                | Delete account                         |
| Tag                       | Identify user                     | Encrypted       | User identification                 | Delete account                         |
| Avatar                    | Identify user                     | Encrypted       | User identification                 | Delete account                         |
| Two-factor enabled        | Verify account                    | Encrypted       | Two-factor authentication           | Disable two-factor or delete account   |
| Two-Factor Verified       | Verify account                    | Encrypted       | Two-factor authentication           | Disable two-factor or delete account   |
| Flags                     | Info about the user               | Encrypted       | User identification                 | Delete account                         |
| Banned                    | Info about the user               | Encrypted       | User identification                 | Request account deletion               |
| Locked                    | Info about the user               | Encrypted       | User identification                 | Request account deletion               |
| AccountDeletionInProgress | Info about the user               | Encrypted       | User identification                 | Wait for account deletion              |

</details>

<br />

### User Settings

So for User Settings this is stuff like Tokens, theme etc etc

| Data              | Why we need it                    | How we store it | How we use it                      | How to remove it                       |
| ----------------- | --------------------------------- | --------------- | ---------------------------------- | -------------------------------------- |
| ID                | Identify user                     | Encrypted       | User identification                | Delete account                         |
| Status            | User status                       | Encrypted       | User status                        | Change status or remove current one    |
| Tokens & Ips      | Account Authentication & Security | Encrypted       | Session management                 | Log out of all sessions                |
| Language          | User language                     | Encrypted       | User language                      | Delete Account                         |
| Message Ids       | For Messages that mention you     | Encrypted       | Message identification             | Delete Account                         |

### Friends

| Data              | Why we need it          | How we store it | How we use it                      | How to remove it                       |
| ----------------- | ----------------------- | -------------- | ----------------------------------- | -------------------------------------- |
| ID                | Identify user           | Encrypted      | User identification                 | Delete account                         |
| Friend ID         | Identify friend         | Encrypted      | Friend identification               | Remove friend                          |
| SenderNickname    | Identify friend         | Encrypted      | Friend identification               | Remove friend                          |
| ReceiverNickname  | Identify friend         | Encrypted      | Friend identification               | Remove friend                          |

### Gifts

| Data              | Why we need it          | How we store it | How we use it                      | How to remove it                       |
| ----------------- | ----------------------- | -------------- | ----------------------------------- | -------------------------------------- |
| UsedBy            | Identify user           | Encrypted      | User identification                 | Delete account                         |

</details>

## Roadmap
### Misc
- [x] Correct Error codes
- [x] Docker File to easily run the backend
- [x] A Snowflake ID System
- [x] Rewrite to TS
    - I want to rewrite the backend to TS, This will make it easier to maintain and add new features
- [ ] Fix Typings
    - I want to fix the typings, This will make it easier to maintain and add new features (They are garbage right now)
- [ ] Different ways to login besides a password
    - I want Users to pick how they login, Allowing them to remove their password and login with other sites, Below are some Ideas
      - [ ] SMS Login
      - [ ] Email Login
      - [ ] Google Login
      - [ ] Github Login

### Database Related
- [x] Database Setup
    - I want to use MongoDB for the Database, I want to use a NoSQL Database because it will be easier to scale and it will be easier to add new features (Though could be slower)
- [x] Database Models
    - I want to make a Database Model for each type of data, This will make it easier to add new features and it will make it easier to maintain the code
    
### Caching Related
- [x] Caching Setup
    - Caching is important, but also bad, Discord uses ScyllaDB which doesn't need caching as its fast, At some point we should move to a database like that, But for now we will use MongoDB which requires caching
### Route Related
- [x] API Endpoints for Creating Accounts, Updating Accounts, Deleting Accounts ETC
- [x] Route Handler/Loader (Loads Routes, Set Routes ETC.)

# Contributing

If you want to contribute fork the development branch, make your changes, verify it works then create a pull request with the changed things, In the Pull request explain what you changed and why you changed it. If you want to make more then one change please do it in one pull request unless they are big things (Like changing Packages, Completely refactoring code etc etc)

## Maintainers

[Darker-Ink](https://github.com/Darker-Ink)

# License

This project is licensed under the GPL-3.0 License, For more info please check [LICENSE.md](/LICENSE.md)

[contributors-shield]: https://img.shields.io/github/contributors/Kastelll/backend.svg?style=for-the-badge
[contributors-url]: https://github.com/Kastelll/backend/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Kastelll/backend.svg?style=for-the-badge
[forks-url]: https://github.com/Kastelll/backend/network/members
[stars-shield]: https://img.shields.io/github/stars/Kastelll/backend.svg?style=for-the-badge
[stars-url]: https://github.com/Kastelll/backend/stargazers
[issues-shield]: https://img.shields.io/github/issues/Kastelll/backend.svg?style=for-the-badge
[issues-url]: https://github.com/Kastelll/backend/issues
[Kastel Code Lines]: https://sloc.xyz/github/Kastelll/backend?category=lines
</div>