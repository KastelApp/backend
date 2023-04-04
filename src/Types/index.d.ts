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

import { Cache } from "../utils/Classes/Cache";
import RequestUtils from "../Utils/Classes/RequestUtils";
import SystemSocket from "../Utils/Classes/System/SystemSocket";
import Turnstile from "../Utils/Classes/Turnstile";
import UserUtils from "../Utils/Classes/MiscUtils/User";
import { LessUser } from "./Users/Users";
import Utils from "../Utils/Classes/MiscUtils/Utils";

declare global {
  namespace Express {
    interface Request {
      clientIp: string;
      user: LessUser
      captcha: Turnstile
      utils: RequestUtils
      mutils: Utils
    }

    interface Application {
      cache: Cache;
      socket: SystemSocket
      ready: boolean
    }
  }
}
