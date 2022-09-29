/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const userSchema = require('../../../../utils/schemas/users/userSchema');
const { encrypt } = require('../../../../utils/classes/encryption');
const user = require('../../../../utils/middleware/user');
const Route = require('../../../../utils/classes/Route');
const ratelimit = require('../../../../utils/middleware/ratelimit');

new Route(__dirname, '/check', 'POST', [user({
    login: {
        loginRequired: true,
    },
}), ratelimit({
    requests: {
        max: 10,
        reset: 1000 * 60 * 60,
    },
})], async (req, res) => {
    /**
     * @type {{username: String, tag: String}}
     */
    const { username, tag } = req.body;

    const usr = await userSchema.findOne({
        username: encrypt(username),
        tag,
    });

    if (usr) {
        res.send({
            code: 200,
            errors: [],
            responses: [{
                code: 'FOUND_USER',
                message: 'There is a user with the provided username and tag',
            }],
        });
    } else {
        res.send({
            code: 200,
            errors: [],
            responses: [{
                code: 'NO_USER_FOUND',
                message: 'There is no user with the provided username and tag',
            }],
        });
    }

    return;
});