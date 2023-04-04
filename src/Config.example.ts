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

import type { Encryption, MongoDB, Redis, Regexes, Server, Ws } from "./Types/Config";


const Server: Server = {
    Port: 62250,
    CookieSecrets: [''],
    Domain: '',
    WorkerId: 1,
    Cache: {
        ClearInterval: 1000 * 60 * 60 * 6, // six hours
        ClearOnStart: false,
    },
    StrictRouting: true,
    CaptchaEnabled: false,
    TurnstileSecret: null
};

const Encryption: Encryption = {
    Algorithm: '',
    InitVector: '',
    SecurityKey: '',
    JwtKey: '',
};

const Ws: Ws = {
    Url: '',
    Password: ''
};

const Redis: Redis = {
    Host: '',
    Port: '',
    User: '',
    Password: '',
    Db: '',
};

const MongoDB: MongoDB = {
    User: '',
    Host: '',
    Port: '80',
    Password: '',
    Database: 'kastel',
    AuthSource: '',
    Uri: '',
};

const Regexs: Regexes = {
    // Source: https://regexr.com/2rhq7
    email: new RegExp(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/),
    // Source: https://regexr.com/3bfsi
    password: new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
};

const Config = {
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Regexs,
}

export {
    Config,
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Regexs,
}

export default { 
    Config,
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Regexs,
}