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

class Base64 {
  static Encode(string: string): string {
    // Convert the string to base64
    const base64 = Buffer.from(string).toString("base64");

    // Replace + with F, / with q, and = with zT
    return base64.replace(/\+/g, "F").replace(/\//g, "q").replace(/=+$/, "zT");
  }

  static Decode(string: string): string {
    // Replace F with +, q with /, and zT with =
    let base64 = string
      .replace(/F/g, "+")
      .replace(/q/g, "/")
      .replace(/zT$/, "");

    if (base64.match(/[^a-zA-Z0-9\.-]/)) base64 = string;

    // Convert the base64 to string
    return Buffer.from(base64, "base64").toString("utf8");
  }

  static OldBase64(string: string): string {
    return string.replace(/\+/g, "F").replace(/\//g, "q").replace(/=+$/, "zT");
  }
}

export default Base64;

export { Base64 };
