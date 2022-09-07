/*
This is all Data that is public stuff that will be gotten from the API

Status: Outdated
*/

const GUILD_DATA = {
    name: "Kastel Chat Support", // The name of the Guild (32 in length)
    id: "33171600011808774", // The ID of the Guild (Unique)
    description: "Welcome to Kastel Chat Support, We welcome you with open arms :D", // The description of the guild (4096 in length)
    info: {
        public: false, // If the guild is Public and will be shown to people
        verified: true, // If the guild is Verified so Users know
        partnered: true, // If the guild is partnered, for like Youtubers, big guilds ETC
        under_investigation: false // If its true the guild is completely Blocked off API wise so Staff can look into a report if its serious (broken laws etc) 
    },
    vanity_url: {
        url: "kastel-support", // The custom invite url (18 in length, Unique)
        uses: 5867
    },
    owner: {
        username: "Mik3.",
        tag: "3808",
        id: "33171631673133808",
        bot: false
    },
    co_owners: [{ // The owner can make users a Co Owner, When you are a Co Owner you have almost the exact same permissions as the owner. (Exactly the same as the owner besides not being able to make more co owners or transfer the guild)
        username: "RandomCoOwner",
        tag: "9767",
        id: "33171628005369767",
        bot: false
      }, {
        username: "RandomCoOwner",
        tag: "5391",
        id: "33171628010115391",
        bot: false
      }],
    channels: [],
    roles: [{
            name: "everyone",
            id: "33171600011808774",
            allowed_nsfw: false, // If the role can Access NSFW channels
            deleteable: false,
            allowed_mentions: ["users"], // Having this role only lets you mention users
            permissions: { // Few Permission Ideas
                READ_MESSAGES: true,
                SEND_MESSAGES: true,
                BAN_USERS: false
            },
            hoisted: false
      },
        {
            name: "Member",
            id: "3930732113074957",
            allowed_nsfw: false,
            deleteable: true,
            allowed_mentions: ["users", "roles", "everyone", "here"],
            permissions: {
                READ_MESSAGES: false,
                SEND_MESSAGES: true,
                BAN_USERS: false
            },
            hoisted: false,
            color: "#3dd5e9"
      }],
    bans: [],
    invites: [],
    audit_log: [],
    members: [{
        username: "RandomMember",
        tag: "3808",
        id: "33171631673133808",
        bot: true,
        bannable: false,
        kickable: false,
        join_date: 1658474124250,
        roles: [{
            name: "Member",
            id: "3930732113074957",
            allowed_nsfw: false,
            deleteable: true,
            allowed_mentions: ["users", "roles", "everyone", "here"],
            permissions: {
                READ_MESSAGES: false,
                SEND_MESSAGES: true,
                BAN_USERS: false
            },
            hoisted: false,
            color: "#3dd5e9"
        }]
      }]
};

const MESSAGE_DATA = {
    author: {
        username: "RandomName",
        tag: "3808",
        id: "33171631673133808",
        bot: false
    },
    id: "1898692152072309",
    content: "SUP",
    embeds: [],
    files: [],
    created_date: 1658474124250,
    updated_date: 1658474124250,
    spoiler: false,
    allowed_mentions: ["users", "roles", "here"],
};

const CHANNEL_DATA = {
    name: "chit chat", // The name (Allows "A-Z[_],.-_")
    id: "33171628010110708",
    description: "Chat with your friends, Start with a simple Hi.", // Channels Description (1024 in length)
    type: "TEXT_CHANNEL", // Types are TEXT_CHANNEL, RULES_CHANNEL, NEWS_CHANNEL, NEW_CHANNEL (Channel New Members see for a set amount of time i.e 24 hours)
    nsfw: false, // If NSFW is true anyone under 18 can't access the channel
    allowed_mentions: ["users", "roles"], // This is the type of mentions users can do in the Channel.
    permissions: [{
        id: "33171600011808774", // The Role ID (or Member ID) relating to the permissions
        overides: {
            READ_MESSAGES: true,
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        }
      }],
    messages: [{
        author: {
            username: "RandomMember",
            tag: "3808",
            id: "33171631673133808",
            bot: false
        },
        id: "33171634958080029",
        content: "omg @here look at this cute cat :)",
        embeds: [],
        files: [{
            name: "cute-cat.png",
            id: "33171778124978411",
            cdn_url: "https://cdn.kastelapp.com/33171628010110708/33171778124978411/cute-cat.png",
            type: "image/png",
            deleted: false
        }],
        created_date: 1658474124250,
        updated_date: 1658474124250, // The date the message was updated
        spoiler: false, // if true frontend will hide the message and images and files
        allowed_mentions: ["users", "roles", "here"], // The messages allowed_mentions default is ["users", "roles", "everyone", "here"]
    }, {
        author: {
            username: "RandomMember two",
            tag: "5330",
            id: "33171778124975330",
            bot: false
        },
        id: "33171778124971789",
        content: "that cat is soooooo cute <33, I love this website as well https://cute-cats.com",
        embeds: [{
            title: "Cute Cats",
            url: "https://cute-cats.com",
            description: "We got the CUTEST cat images you can imagine.",
            fields: [],
            footer: null,
            timestamp: null,
            allowed_mentions: [],
            small_image: null,
            big_images: [],
        }],
        files: [],
        created_date: 1658474124250,
        updated_date: 1658474124250, // The date the message was updated
        spoiler: false, // if true frontend will hide the message and images and files
        allowed_mentions: ["users", "roles", "here"], // The messages allowed_mentions default is ["users", "roles", "everyone", "here"]
    }]
};

const WEBHOOK_DATA = { // Webhook post requests can be made by doing a HTTP post request to "https://kastelapp.com/api/v1/guilds/33171600011808774/webhooks/33172310315275745" and the token is used to verify requests.
    username: "cute cats webhook", // The Username, Supports any Char, (Max Length 46 Chars)
    id: "33172310315275745", // Randomly Generated ID
    avatar_url: "https://cdn.kastelapp.com/33171600011808774/33172310315275745/33172311792240004.png", // The Avatar URL
    token: "LC_vhQGLKkyLy8JyEaIUAHbB3Czp5mDfEK2tb3TYAs3BZvM5r7JM78vGnAx56cCFNqDuh6yx1rk", // The token to make requests
    allowed_mentions: ["users"] // only allow the webhook mention users (can be "users", "roles", "everyone", "here")
};

const EMBED_DATA = {
    title: "Cute Cats", // The title of embed. (Will only show 32 Chars, Supports Some Markdown)
    url: "https://cute-cats.com", // If a valid url (has HTTPS, HTTP or kastelapp://) the title will be clickable leading to the website
    description: "We got the CUTEST cat images you can imagine.", // The Description of the embed (4096 in length, Supports Most Markdown)
    fields: [{
        name: "Cute Cats", // Same as @EMBED_DATA#title
        content: "look at that cute cat", // Same as @EMBED_DATA#description though only 2048 chars in length
        image: null // Same as @FILE_DATA
    }],
    footer: null, // Same as @EMBED_DATA#title but Supports No Markdown
    timestamp: null, // The timestamp the embed wants to show
    allowed_mentions: [], // The mentions in the embed, Does not work with Website Embeds.
    small_image: null, // a Single small image is allowed in the embed (Same as @FILE_DATA)
    big_images: [], // Big Images are allowed in the embed, Will be stacked (Same as @FILE_DATA)
};

const FILE_DATA = { // The file is Downloaded via the CDN to not leak users IPs
    name: "cute-cat.png", // The name is just any name the file had when uploaded defaults to "unknown"
    id: "33171778124978411", // A random ID
    cdn_url: "https://cdn.kastelapp.com/33171628010110708/33171778124978411/cute-cat.png", // The cdn url if the /channel_id/file_id/file_name
    type: "image/png", // The file type
    deleted: false // if true it means the CDN url has been deleted and or removed for ToS reasons or PP reasons
};


const PUBLIC_USER_DATA = { // This is data that is Completely Public anyone can access with your userID
    avatar_url: "https://cdn.kastelapp.com/33168888888888888/33170000000000000.png",
    username: "DarkerInk",
    tag: "8888",
    id: "33168888888888888",
    bot: false,
    badges: [{
        name: "Staff",
        short_description: "Works for Kastelapp",
        small_image: "https://cdn.kastelapp.com/33171801624545077/33171801624550422/33171801624550004.png"
    }, {
        name: "Original User",
        short_description: "Was one of the first 1000 Users :)",
        small_image: "https://cdn.kastelapp.com/33171802224545005/33171802224547277/33171802224557975.png"
    }, {
        name: "Kastelapp Developer",
        short_description: "Is a Developer at Kastelapp/Has made a big Commit to the Project",
        small_image: "https://cdn.kastelapp.com/33171802224545005/33171801624550422/33171809644780990.png"
    }],
    flags: ["STAFF"],
};


const GUILD_MEMBER_DATA = {
    username: "RandomMember",
    tag: "3808",
    id: "33171631673133808",
    bot: false,
    bannable: false,
    kickable: false,
    join_date: 1658474124250,
    roles: [],
};

const ROLE_DATA = {};

const BAN_DATA = {
    user: { // the person that got banned
        avatar_url: "https://cdn.kastelapp.com/33168888888888888/33170000000000000.png",
        username: "DarkerInk",
        tag: "8888",
        id: "33168888888888888",
        bot: false
    },
    banner: { // the person that banned
        username: "Mik3.",
        tag: "3808",
        id: "33171631673133808",
        bot: false
    },
    reason: "Is a dumb dumb", // The reason the user was banned, (Max length is 4096)
    banned_date: 1658697364480, // The Date the user got banned
    unban_date: 1659302201121, // The Date the user will be auto unbanned
};

// Not Finished
const AUDIT_LOG_DATA = {};

const INVITE_DATA = {
    creator: {
        username: "DarkerInk",
        tag: "1750",
        id: "33168888888888888"
    },
    code: "bgFcPKOCJ4FN", // The Invite code
    expires: null, // When the invite Expires, Null for never expiring, can go up to 30 days
    uses: 0, // How many uses the invite code has
    max_uses: null // null for Infinity
};