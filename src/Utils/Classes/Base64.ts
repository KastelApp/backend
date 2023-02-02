class Base64 {
  static Encode(string: string): string {
    // Convert the string to base64
    const base64 = Buffer.from(string).toString("base64");

    // Replace + with F, / with q, and = with zT
    return base64.replace(/\+/g, "F").replace(/\//g, "q").replace(/=+$/, "zT");
  }

  static Decode(string: string): string {
    // Replace F with +, q with /, and zT with =
    const base64 = string
      .replace(/F/g, "+")
      .replace(/q/g, "/")
      .replace(/zT$/, "");

    // Convert the base64 to string
    return Buffer.from(base64, "base64").toString("utf8");
  }
}

export default Base64;

export { Base64 };