const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"

const inviteGenerator = () => {
    let invite = "";

    for (let i = 0; i < 15; i++) {
        invite += chars[Math.floor(Math.random() * chars.length)]
    }

    return invite;
}

module.exports = inviteGenerator;