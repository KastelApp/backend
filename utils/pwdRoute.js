const crypto = require('crypto');

const pass = (p) => crypto.createHmac('sha1', 'tJnHUuC5JhdX4dnfNXzX7exFB5pum1m1F3BHNmgtb1wCLdc4Du2gqHuwPsdarkersuxUBf2p767ZCnNrO92Gp4Sheqj2').update(p).digest('hex');

/**
 * Simple Middleware to protect routes with a password (Password will be set in ENV file)
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
const pwdRoute = (req, res, next) => {
    const ip = (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip).replace("::ffff:", "");

    let requestPassword = req?.body?.password || req?.body?.pass || req?.headers?.password || req?.headers?.pass || req?.query?.password || req?.query?.pass
    
    if (!requestPassword) {
        logger.warn(`${ip} Attempted to access a protected route without a password (${req.path})`);
        return res.status(401).send("Unauthorized");
    }

    if (crypto.timingSafeEqual(Buffer.from(pass(requestPassword), "utf8"), Buffer.from(pass(process.env.password), "utf8"))) {
        logger.info(`${ip} Accessed a protected route (${req.path})`);
        next();
    } else {
        logger.warn(`${ip} Attempted to access a protected route with a invalid password (${req.path})`);
        return res.status(401).send("Unauthorized");
    }
}

module.exports = pwdRoute;