/*
Just some Misc Data, Like permissions, flags, badges ETC
*/

const CHANNEL_PERMISSIONS = {
    READ_MESSAGES: true,
    SEND_MESSAGES: true,
    SEND_EMOJIS: true,
    SEND_FILES: true,
    BYPASS_COOLDOWN: true
}

const ROLE_PERMISSIONS = {
    READ_MESSAGES: true,
    SEND_MESSAGES: true,
    SEND_EMOJIS: true,
    SEND_FILES: true,
    BYPASS_COOLDOWN: true, // Allows to send messages and bypass the cooldown of the channel
    // Moderator permissions
    MANAGE_GUILD: true,
    MANAGE_CHANNELS: true,
    MANAGE_ROLES: true,
    MANAGE_MEMBERS: true,
    MANAGE_MESSAGES: true,
    MANAGE_BANS: true, // The difference between this and ban members is it can Unban people & change the ban reason & change the ban length
    BAN_MEMBERS: true,
    KICK_MEMBERS: true,
    MUTE_MEMBERS: true,
    // Suggest only giving this to very trusted people.
    ADMINISTRATOR: true // All of the permissions above
}

const ALL_CURRENT_BADGES = [{
    name: "Kastel Staff",
    short_description: "Moderates Kastel",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171801624550004.png"
}, {
    name: "Kastel Developer",
    short_description: "Is a Developer at Kastel/Has made a big Commit to the Project",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171809644780990.png"
}, {
    name: "Original User",
    short_description: "Was one of the first 1000 Users :)",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171802224557975.png"
}, {
    name: "Verified Bot Developer",
    short_description: "Has a Verified Bot (A bot in more then 2500 guilds)",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171808450230326.png"
}, {
    name: "Partner",
    short_description: "Has a Partnered Guild",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171808450238398.png"
}, {
    name: "Ghost User",
    short_description: "This User has Deleted their Account",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171822999046600.png"
}, {
    name: "Major Bug Hunter",
    short_description: "Has found a Major Bug",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171822999040000.png"
}, {
    name: "Minor Bug Hunter",
    short_description: "Has found a Minor Bug.",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171822999049222.png"
}, {
    name: "Trustworthy Moderator",
    short_description: "Trustworthy to moderate your guilds.",
    small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33172750946551140.png"
}];


const ALL_CURRENT_FLAGS = [
     "STAFF", // Lets the API know you are staff
     "SYSTEM", // For Messages the system sent out, Used to verify announcement DMs
     "BOT", // Lets the API know that its a bot
     "GHOST", // Given when you delete your account
     "SPAMMER",
     "BROKE_TOS", // If you break ToS this flag will be given, only removed if it was added by mistake
     
     // Lets the API know the user is not allowed to create guilds, add friends or create Group chats
     "CREATING_GUILDS_BAN",
     "ADDING_FRIENDS_BAN",
     "CREATING_GROUP_CHATS_BAN"
];