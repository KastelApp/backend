const userSchema = require("../../../../../utils/schemas/users/userSchema")
const badgeSchema = require("../../../../../utils/schemas/users/badgeSchema")
const { encrypt, decrypt } = require("../../../../../utils/classes/encryption")
const user = require("../../../../../utils/middleware/user")

module.exports = {
    path: "/",
    method: "get",
    middleWare: [user({
        botsAllowed: true,
        loggedinAllowed: true,
        needed_flags: [],
    })],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        /**
         * @type {String}
         */
        const userId = req?.params?.userId

        if (!userId) {
            res.status(400).send({
                code: 400,
                errors: [{
                    code: "MISSING_USER_ID",
                    message: "No User id provided"
                }]
            })

            return;
        }

        const user = await userSchema.findById(encrypt(userId));

        if (!user) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: "NO_USER_FOUND",
                    message: "No user was found with the provided id"
                }]
            })

            return;
        }

        const badges = await badgeSchema.find({ user: encrypt(userId) });


        res.send({
            id: decrypt(user._id),
            avatar: (user?.avatar_url ?? null),
            username: decrypt(user.username),
            tag: user.tag,
            bot: (user?.bot ?? false),
            creation_date: user.created_date,
            badges: (badges?.map((bad) => bad.name) ?? [])
        })

    },
}