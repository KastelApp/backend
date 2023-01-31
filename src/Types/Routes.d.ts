export type Methods =
  | "all"
  | "ALL"
  | "get"
  | "GET"
  | "delete"
  | "DELETE"
  | "head"
  | "HEAD"
  | "options"
  | "OPTIONS"
  | "post"
  | "POST"
  | "put"
  | "PUT"
  | "patch"
  | "PATCH"
  | "purge"
  | "PURGE";

export interface UserMiddleware {
  Requesters: {
    Type: "USER" | "BOT";
    Allowed: boolean; // If they are allowed to access the endpoint
  }[];
  Flags: number; // The flags required to access the endpoint (Default: 0)
  Login: {
    // If you need to be logged in to access the endpoint
    AccessType: "All" | "LoggedIn" | "LoggedOut";
  };
}

interface RateLimitObjectItem {
  increment: number;
  date: number;
}

interface RateLimitObject {
  id: string;
  method: Methods;
  regex: string;
  increment: number;
  lastRequest: number;
  requests: RateLimitObjectItem[];
}

interface RequestOptions {
  max?: number;
  reset?: number;
}

interface FlagOptions {
  flag: number;
  bypass: boolean;
}

interface Options {
  requests: RequestOptions;
  flags: FlagOptions[];
}
