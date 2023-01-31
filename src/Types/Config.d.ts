export interface Server {
  port?: number | string;
  cookieSecrets: string[];
  domain: string;
  workerId?: number;
  cache: {
    clearInterval: number;
    clearOnStart: boolean;
  };
}

export interface Encryption {
  algorithm?: string;
  initVector: string;
  securityKey: string;
  jwtKey: string;
}

export interface Ws {
  url: string;
  user: string;
  password: string;
}

export interface Redis {
  host?: string;
  port?: number | string;
  user?: string;
  password?: string;
  db?: number | string;
}

export interface MongoDB {
  user: string;
  host: string;
  port: string | number;
  password: string;
  database: string;
  authSource: string;
  uri: string;
}

export interface ColorChoices {
  debug: string;
  info: string;
  log: string;
  warn: string;
  error: string;
  loaded: string;
}

export interface Colors {
  level: ColorChoices;
  message: ColorChoices;
}

export interface Logger {
  loggerEnabled: boolean;
  timeStartUp: boolean;
  saveInFiles: boolean;
  path: string;
  format: string;
  color: boolean;
  log: boolean;
  logRoutes: boolean;
  logLogo: boolean;
  logErrors: boolean;
  logInfo: boolean;
  date_type: string;
  colors: Colors;
}

export interface Snowflake {
  epoch?: number;
  workerId?: number;
  datacenterId?: number;
  workerId_Bytes?: number;
  datacenterId_Bytes?: number;
  sequence_Bytes?: number;
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