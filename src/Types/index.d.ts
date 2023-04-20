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

import { Cache } from "../Utils/Classes/Cache";
import RequestUtils from "../Utils/Classes/RequestUtils";
import SystemSocket from "../Utils/Classes/System/SystemSocket";
import Turnstile from "../Utils/Classes/Turnstile";
import UserUtils from "../Utils/Classes/MiscUtils/User";
import { LessUser } from "./Users/Users";
import Utils from "../Utils/Classes/MiscUtils/Utils";
import Emails from "../Utils/Classes/Emails";
import { Snowflake } from "@kastelll/util";

declare global {
  namespace Express {
    interface Request {
      clientIp: string;
      user: LessUser
      captcha: Turnstile
      utils: RequestUtils
      mutils: Utils
      NoReply: Emails | null
      Support: Emails | null
    }

    interface Application {
      cache: Cache;
      socket: SystemSocket
      ready: boolean
      snowflake: Snowflake
    }
  }
}
