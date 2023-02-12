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

export interface Server {
  Port?: number | string;
  CookieSecrets: string[];
  Domain: string;
  WorkerId?: number;
  Cache: {
    ClearInterval: number;
    ClearOnStart: boolean;
  };
  StrictRouting: boolean; // if true then you cannot do like /users/@me/ you have to do /users/@me
  TurnstileSecret: string | null; // cloudflare turnstile secret (for captchas)
  CaptchaEnabled: boolean; // if true then some routes will require captcha (register, login, etc)
}

export interface Encryption {
  Algorithm: string;
  InitVector: string;
  SecurityKey: string;
  JwtKey: string;
}

export interface Ws {
  Url: string;
  User: string;
  Password: string;
}

export interface Redis {
  Host: string;
  Port: number | string;
  User: string;
  Password: string;
  Db: number | string;
}

export interface MongoDB {
  User: string;
  Host: string;
  Port: string | number;
  Password: string;
  Database: string;
  AuthSource: string;
  Uri: string;
}

export interface Config {
  Server: Server;
  Encryption: Encryption;
  Ws: Ws;
  Redis: Redis;
  MongoDB: MongoDB;
  Logger: Logger;
  Snowflake: Snowflake;
}

export interface Regexes {
  password: RegExp;
  email: RegExp;
}