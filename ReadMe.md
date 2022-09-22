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

Kastel Is a Chatting App like <a href="https://discord.com">Discord</a> & <a href="https://guilded.gg">Guilded</a>, Though its Open Sourced & Data is encrypted

## Roadmap
### Misc
- [x] Correct Error codes
- [ ] Docker File to easily run the backend
- [x] A Snowflake ID System
- [ ] Routing to Different servers
    - If you are in Canada, Route to a US server if there are no canada servers ETC
- [ ] Rewrite to TS & Fastify
    - I have plans on Rewriting most of this project into TS and Using Fastify instead of Express.JS, When this will happen I'm not sure.
- [ ] Different ways to login besides a password
    - I want Users to pick how they login, Allowing them to remove their password and login with other sites, Below are some Ideas
        - Google
        - Github
        - Apple
### Database Related
- [x] Start MongoDB Stuff (Creating Schemas, Using it for Creating accounts ETC)
- [x] Encrypting User Data and messages, Username, ID ETC & Hashing Passwords, Emails and IPS
### Caching Related
- [ ] Advanced Caching system using redis
    - Caching system to make API requests faster
### Route Related
- [x] API Endpoints for Creating Accounts, Updating Accounts, Deleting Accounts ETC
- [x] Route Handler/Loader (Loads Routes, Set Routes ETC.)

# Credits

[Robin][robin-github] - For Helping with the Schemas & giving tips about them.

# Contributing

If you want to contribute fork the development branch, make your changes, verify it works then create a pull request with the changed things, In the Pull request explain what you changed and why you changed it. If you want to make more then one change please do it in one pull request unless they are big things (Like changing Packages, Completely refactoring code etc etc)


# User Security

As of 8/15/2022 User Data Is Encrypted with AES (AES is the default) As seen in the [User Schema](/src/utils/schemas/users/userSchema.js) What is Encrypted or hashed is pointed out. If it doesn't have a '// Encrypted' or '// Hashed' next to it means it isn't hashed or encrypted. If you got any questions please email 'security@kastelapp.com' for more info.

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
[robin-github]: https://github.com/Robin-Sch
</div>
