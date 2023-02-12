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

Kastel is an open-source and privacy-focused communication platform that allows you to connect with your friends, colleagues, and communities. It's similar to popular chat apps like Discord and Guilded, but with an added emphasis on data security and encryption. Whether you're looking to build a gaming community, manage a team, or just chat with friends, Kastel provides a safe and secure environment to connect and communicate.


## Roadmap
### Misc
- [x] Correct Error codes
- [x] Docker File to easily run the backend
- [x] A Snowflake ID System
- [x] Rewrite to TS
    - I want to rewrite the backend to TS, This will make it easier to maintain and add new features
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
</div>