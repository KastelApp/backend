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

import * as Sentry from '@sentry/node';


export interface Server {
  Port?: number | string;
  CookieSecrets: string[];
  Domain: string;
  Secure: boolean;
  WorkerId?: number;
  Cache: {
    ClearInterval: number;
    ClearOnStart: boolean;
  };
  StrictRouting: boolean; // if true then you cannot do like /users/@me/ you have to do /users/@me
  TurnstileSecret: string | null; // cloudflare turnstile secret (for captchas)
  CaptchaEnabled: boolean; // if true then some routes will require captcha (register, login, etc)
  Sentry: {
    Enabled: boolean;
    Dsn: string;
    TracesSampleRate: number;
    OtherOptions: Exclude<Sentry.NodeOptions, 'dsn' | 'tracesSampleRate'>;
    RequestOptions: Sentry.Handlers.RequestHandlerOptions
}
}

export interface Encryption {
  Algorithm: string;
  InitVector: string;
  SecurityKey: string;
  JwtKey: string;
}

export interface Ws {
  Url: string;
  Password: string;
  version?: number; // not required as most likely will be 0
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

type ShortCode = 'Support' | 'NoReply';

interface User {
  Host: string;
  Port: number;
  Secure: boolean;
  User: string;
  Password: string;
  ShortCode: ShortCode
}

export interface MailServer {
  Enabled: boolean;
  Users: [User, User]
};

export interface EmailTemplates {
  VerifyEmail: VerifyEmail
  ResetPassword: ResetPassword
  DisabledAccount: DisabledAccount
}

interface VerifyEmail {
  Subject: string
  Template: string
  PlaceHolders: {
    Username: string
    VerifyLink: string
    SupportEmail: string
  }
}

interface ResetPassword {
  Subject: string
  Template: string
  PlaceHolders: {
    Username: string
    ResetLink: string
    SupportEmail: string
  }
}

interface DisabledAccount {
  Subject: string
  Template: string
  PlaceHolders: {
    Uusername: string
    SupportEmail: string
    Reason: string
  }
  
}

export interface Regexs {
  Password: RegExp;
  Email: RegExp;
}

export interface Config {
  Server: Server;
  Encryption: Encryption;
  Ws: Ws;
  Redis: Redis;
  MongoDB: MongoDB;
  MailServer: MailServer;
  Regexs: Regexs;
  EmailTemplates: EmailTemplates
}
