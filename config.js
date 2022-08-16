// Allow users to completely configure the names of badges and flags

module.exports.BADGES = {
    STAFF: {
        name: "Kastel Staff",
        short_description: "Moderates Kastel",
        small_image: "temp"
    },
    DEVELOPER: {
        name: "Kastel Developer",
        short_description: "Is a Developer at Kastel/Has made a big Commit to the Project",
        small_image: "temp"
    },
    VERIFIED_DEVELOPER: {
        name: "Verified Bot Developer",
        short_description: "Has a Verified Bot (A bot in more then 2500 guilds)",
        small_image: "temp"
    },
    ORIGINAL_USER: {
        name: "Original User",
        short_description: "Was one of the first 1000 Users :)",
        small_image: "temp"
    },
    PARTNER: {
        name: "Partner",
        short_description: "Has a Partnered Guild",
        small_image: "temp"
    },
    GHOST: {
        name: "Ghost User",
        short_description: "This User has Deleted their Account",
        small_image: "temp"
    },
    MAJOR_HUNTER: {
        name: "Major Bug Hunter",
        short_description: "Has found a Major Bug",
        small_image: "temp"
    },
    MINOR_HUNTER: {
        name: "Minor Bug Hunter",
        short_description: "Has found a Minor Bug.",
        small_image: "temp"
    },
    MODERATOR: {
        name: "Trustworthy Moderator",
        short_description: "Trustworthy to moderate your guilds.",
        small_image: "temp"
    },
    SPONSOR: {
        name: "Sponsor",
        short_description: "Sponsored Kastel",
        small_image: "temp"
    }
}

module.exports.FLAGS = {
    BETA_TESTER: "BETA_TESTER",
    STAFF: "STAFF",
    BOT: "BOT",
    VERIFIED_BOT: "VERIFIED_BOT",
    SYSTEM: "SYSTEM",
    GHOST: "GHOST",
    SPAMMER: "SPAMMER",
    TOS: "BROKE_TOS",
    GUILD_BAN: "CREATING_GUILDS_BAN",
    FRIEND_BAN: "ADDING_FRIENDS_BAN",
    GROUPCHAT_BAN: "CREATING_GROUP_CHATS_BAN"
}