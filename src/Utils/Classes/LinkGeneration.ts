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

import crypto from 'crypto';
import Base64 from "./Base64";
import { Encryption } from '../../Config';
import { Snowflake as SnowflakeBuilder } from '@kastelll/util';
import Constants from '../../Constants';

const Snowflake = new SnowflakeBuilder(Constants.Snowflake)

class LinkGeneration {
    public static VerifcationLink(snowflakeId: string): string {
        const CurrentDate = Date.now();
        
        const nonce = Base64.OldBase64(crypto.randomBytes(16).toString("base64"));
        const snowflake = Base64.Encode(snowflakeId);
        
        const hmac = crypto.createHmac("sha256", Encryption.JwtKey);

        hmac.update(`${snowflake}.${CurrentDate}.${nonce}`);

        const Secret = Base64.OldBase64(hmac.digest("base64"));

        return Base64.Encode(`${snowflake}.${Base64.Encode(String(CurrentDate))}.${nonce}.${Secret}`)
    }

    public static Verify(link: string): boolean {

        const DecodedLink = Base64.Decode(link)

        const [base64snowflake, base64createdDate, nonce, secret] = DecodedLink.split(".")

        if (!base64snowflake || !base64createdDate || !nonce || !secret) return false;

        const snowflake = Base64.Decode(base64snowflake)
        const CreatedDate = Base64.Decode(base64createdDate);

        console.log('Snowflake', snowflake)
        if (!Snowflake.Validate(snowflake)) return false;

        console.log('Snowflake good')

        const CreatedDateParsed = new Date(CreatedDate);

        // the max age of these will be around 2 weeks (MAX) so just hard code the check here
        if (CreatedDateParsed.getTime() + 1209600000 < Date.now()) return false;

        console.log('Date good')

        const hmac = crypto.createHmac("sha256", Encryption.JwtKey);

        hmac.update(`${base64snowflake}.${base64createdDate}.${nonce}`);

        const Newsecret = Base64.OldBase64(hmac.digest("base64"));

        console.log('New Secret', Newsecret)
        console.log('Old Secret', secret)

        if (Newsecret !== secret) return false;

        console.log('New vs Old = Yes')

        if (link !== Base64.Encode(`${base64snowflake}.${base64createdDate}.${nonce}.${secret}`)) return false;

        console.log("Verified Link")

        return true;
    }

    public static GetSnowflake(link: string): string | null {
        const DecodedLink = Base64.Decode(link)

        const [base64snowflake, base64createdDate, nonce, secret] = DecodedLink.split(".")

        if (!base64snowflake || !base64createdDate || !nonce || !secret) return null;

        const snowflake = Base64.Decode(base64snowflake)

        if (!Snowflake.Validate(snowflake)) return null;

        return snowflake;
    }
};

export { LinkGeneration };

export default LinkGeneration;
