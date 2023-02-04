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

import type { Flags } from "../Constants";

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
  AllowedRequesters: 'Bot' | 'User' | 'All'; // The type of user that can access the endpoint (Default: 'All')
  Flags?: (keyof typeof Flags)[]; // The flags required to access the endpoint (Default: null)
  // If you need to be logged in to access the endpoint
  AccessType: "All" | "LoggedIn" | "LoggedOut";
  DisallowedFlags?: (keyof typeof Flags)[]; // The flags that are not allowed to access the endpoint (Default: null)
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