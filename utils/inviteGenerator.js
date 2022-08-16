const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";

const inviteGenerator = (length = 15) => {
    let invite = "";

    for (let i = 0; i < length; i++) {
        invite += chars[Math.floor(Math.random() * chars.length)]
    }

    return invite;
}

module.exports = inviteGenerator;