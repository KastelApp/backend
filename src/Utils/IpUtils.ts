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

import type { Request } from "express";

const GetIp = (req: Request): string => {
  let Ip: string | undefined | string[] =
    req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"] || req.ip;

  if (typeof Ip === "string") {
    Ip = Ip.split(",")[0];
  }

  return (Ip as string).replace("::ffff:", "");
};

export default GetIp;

export { GetIp };
