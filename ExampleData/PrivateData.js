/*
Most of this Data/Example JSON is for Internal stuff, Things a normal user will never 

*/

const PRIVATE_USER_DATA = {
    avatar_url: "https://cdn.kastelapp.org/33168888888888888/33170000000000000.png", // The Users Avatar, Any Image Type.
    username: "DarkerInk", // The Username, Supports any Char, (Max Length 46 Chars)
    tag: "8888", // The original tag is the four randomly generated numbers of your id. If its taken will be randomly generated again
    id: "33168888888888888", // Unqiue ID, Adds the date of it being generated and the start date (setable in .env) then four randomly generated numbers
    email: "darkerink@staff.kastelapp.org", // The Users Email (Will be Encrypted & hashed)
    password: "CatsAreVeryCool1234!!!", // A Hashed and Encrypted Password. Nobody will know it besides the User
    created_date: 1658352496290,
    privacy_settings: {
        two_fa: true, // If the user must require a 2FA code on Login, Password Reset, Email Change ETC
        ip_lock: false, // If true will lock the account to one ip only (All API requests will Fail if its wrong). The only way to access it from a different IP is requesting it then clicking on the email that was sent
        ip_verifiy: true, // If true and a Different IP is found trying to login will force them to verify by clicking the email that is sent to them
    },
    ip: "127.0.0.1", // A Hashed IP Address, Only stored for @PRIVATE_USER_DATA#ip_lock @PRIVATE_USER_DATA#ip_verifiy
    badges: [{ // The Badges are kept UnEncrypted. There isn't much you can do with them.
        name: "Kastel Staff",
        short_description: "Moderates Kastel",
        small_image: "https://cdn.kastelapp.org/33171801624545077/33171801624550422/33171801624550004.png"
    }, {
        name: "Original User",
        short_description: "Was one of the first 1000 Users :)",
        small_image: "https://cdn.kastelapp.org/33171802224545005/33171802224547277/33171802224557975.png"
    }, {
        name: "Kastel Developer",
        short_description: "Is a Developer at Kastel/Has made a big Commit to the Project",
        small_image: "https://cdn.kastelapp.org/33171802224545005/33171801624550422/33171809644780990.png"
    }],
    flags: ["STAFF"],
    friends: [{ // The users friends, Limit is 100, They can also set a custom nickname for them. The Username, Nickname and ID are completely encrypted
        avatar_url: null,
        username: "Mik3.",
        nickname: "Curry",
        tag: "3808",
        id: "33171631673133808",
    }],
    dms: [{ // Their DMS, Username, ID and Channel ID are Encrypted
        avatar_url: null,
        username: "Mik3.",
        tag: "3808",
        id: "33171631673133808",
        dm_channel_id: "33172345402920010"
    }],
    guilds: [{ // Just some simple guild Data (Max of 50)
        name: "Kastel Chat Support",
        id: "33171600011808774",
    }],
    gifts: [],
    misc: {
        banned: false,
        locked: false,
        ban_reason: null,
        account_deletion_in_progress: false,
        email_verified: true,
        date_of_birth: "976816800000", // The Users Birthday, Completely Encrypted
        show_ads: false // If the user wants to see ads or not
    }
};

/**
 * @STAFF The staff flag just lets the API know you are a staff member.
 * @SYSTEM System Is for messages that did not come from a User/Bot/Webhook.
 * @GHOST The Ghost flag is for when someone deletes there account. 
 * @SPAMMER N/A
 * @BROKE_TOS N/A
 * @CREATING_GUILDS_BAN N/A
 * @ADDING_FRIENDS_BAN N/A
 * @CREATING_GROUP_CHATS_BAN N/A
 * @UNDER_WATCH **N/A**
 */
const ALL_CURRENT_FLAGS = ["STAFF", "SYSTEM", "GHOST", "SPAMMER", "BROKE_TOS", "CREATING_GUILDS_BAN", "ADDING_FRIENDS_BAN", "CREATING_GROUP_CHATS_BAN", "UNDER_WATCH"];

// When you delete your account most data is removed, The only things stored is the old ID
// Message content is also removed (See @DELETED_ACCOUNT_MESSAGE_DATA#content)
const DELETED_ACCOUNT_DATA = {
    avatar_url: null,
    username: "Ghost",
    tag: "0000",
    id: "33168888888888888",
    email: null, // Remove the Email to follow laws relating user data
    password: null, // Remove the password as no point in storing it
    privacy_settings: null, // privacy settings are nulled since again no point in storing them
    ip: null, // the ip is also removed due to laws releating user data
    badges: [{ // Removes all the badges but adds the Ghost user Badge.
        name: "Ghost User",
        short_description: "A User that has Deleted their Account",
        small_image: "https://cdn.kastelapp.org/33171802224545005/33171801624550422/33171808450238398.png"
    }],
    flags: ["GHOST"],
};

// When you request your account to be deleted after 168 hours All your messages should be come as below
const DELETED_ACCOUNT_MESSAGE_DATA = {
    author: { // The username and tag will become the ghost ones
        username: "Ghost",
        tag: "0000",
        id: "33168888888888888", // The ID stays but there will be no way it relates to you
        bot: false // Bot tag will stay the same
    },
    id: "1898692152072309",
    content: "[Removed]", // Content gets changed to "[Removed]", This way message history doesn't look weird (like someone talking to themself)
    embeds: [], // All embeds get removed
    files: [], // So Do all files
    created_date: 1658474124250,
    updated_date: 1658645195914, // Updated date is changed to when its removed from the API
    spoiler: false, // Spoiler is changed to false
    allowed_mentions: [], // The allowed mentions will become an empty array
};

const GIFT_DATA = {
    type: "ROSE", // Types are sunflower, Rose, bouquet, and PROMO (Sunflower would be $3 Rose would be $6 and bouquet would be $15)
    max_age: 1658826027117, // Max age is 24 hours on Subscription Gifts (Promos last longer)
    gift_length: 2592000000, // This gift lasts 30 days (one month)
    gift_url: "https://kastelapp.org/gifts/McOqLPWH118MF8Mcsbwtllw6aJHwNlfmH6Ra7IDe", // Randomly made gift url, accepting it (since its rose) will give you access to the monthly subscription for free
    used_by: {
        username: "Mik3",
        tag: "3808",
        id: "33171631673133808"
    }
}