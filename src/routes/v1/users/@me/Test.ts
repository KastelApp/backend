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

import { Route } from "@kastelll/core";
import User from "../../../../Middleware/User";
import rateLimit from "../../../../Utils/Classes/TokenBucket";

new Route(
  "/test",
  "GET",
  [
    User({
      AccessType: "LoggedIn",
      AllowedRequesters: "User",
      Flags: [],
    }),
    rateLimit({
        count: 5,
        window: 10000,
        bucket: 'test',
        // failed: {
        //   boost: 1000000,
        //   count: 3
        // },
        error: true,
      }),
    ],
  async (req, res) => {

    res.status(403).send("uwu")

    return;

    // res.send('uwu')
  }
);
