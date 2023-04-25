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

import type {
  Encryption,
  MongoDB,
  Redis,
  Regexs,
  Server,
  Ws,
  MailServer,
  Config,
  EmailTemplates,
} from "./Types/Config";

const Server: Server = {
  Port: 62250,
  CookieSecrets: [""],
  Domain: "", // DO NOT INCLDE HTTP OR HTTPS (Thats for the Secure part :3)
  Secure: false, // https or http
  WorkerId: 1,
  Cache: {
    ClearInterval: 1000 * 60 * 60 * 6, // six hours
    ClearOnStart: false,
  },
  StrictRouting: true,
  CaptchaEnabled: false,
  TurnstileSecret: null,
  Sentry: {
    Enabled: false,
    Dsn: "",
    TracesSampleRate: 1.0,
    OtherOptions: {},
    RequestOptions: {}
  },
};

const Encryption: Encryption = {
  Algorithm: "",
  InitVector: "",
  SecurityKey: "",
  JwtKey: "",
};

const Ws: Ws = {
  Url: "",
  Password: "",
};

const Redis: Redis = {
  Host: "",
  Port: "",
  User: "",
  Password: "",
  Db: "",
};

const MongoDB: MongoDB = {
  User: "",
  Host: "",
  Port: "80",
  Password: "",
  Database: "kastel",
  AuthSource: "",
  Uri: "",
};

const MailServer: MailServer = {
  Enabled: false,
  Users: [
    {
      Host: "",
      Port: 465,
      Secure: true,
      User: "",
      Password: "",
      ShortCode: "Support",
    },
    {
      Host: "",
      Port: 465,
      Secure: true,
      User: "",
      Password: "",
      ShortCode: "NoReply",
    },
  ],
};

const EmailTemplates: EmailTemplates = {
  VerifyEmail: {
    Subject: "Verify your email",
    Template: "https://example.com", // can be a url or a file path
    PlaceHolders: {
      Username: "{{USERNAME}}",
      VerifyLink: "{{VERIFY_LINK}}",
      SupportEmail: "{{SUPPORT_EMAIL}}",
    },
  },
  ResetPassword: {
    Subject: "Reset your password",
    Template: "https://example.com", // can be a url or a file path
    PlaceHolders: {
      Username: "{{USERNAME}}",
      ResetLink: "{{RESET_LINK}}",
      SupportEmail: "{{SUPPORT_EMAIL}}",
    },
  },
  DisabledAccount: {
    Subject: "Your account has been disabled",
    Template: "https://example.com", // can be a url or a file path
    PlaceHolders: {
      Uusername: "{{USERNAME}}",
      SupportEmail: "{{SUPPORT_EMAIL}}",
      Reason: "{{REASON}}", // Can Be HTML
    },
  },
};

const Regexs: Regexs = {
  // Source: https://regexr.com/2rhq7
  Email: new RegExp(
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  ),
  // Source: https://regexr.com/3bfsi
  Password: new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,72}$/),
};

const Config: Config = {
  Server,
  Encryption,
  Ws,
  Redis,
  MongoDB,
  Regexs,
  MailServer,
  EmailTemplates,
};

export {
  Config,
  Server,
  Encryption,
  Ws,
  Redis,
  MongoDB,
  Regexs,
  MailServer,
  EmailTemplates,
};

export default {
  Config,
  Server,
  Encryption,
  Ws,
  Redis,
  MongoDB,
  Regexs,
  MailServer,
  EmailTemplates,
};
