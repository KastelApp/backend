import type { Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import ChannelUtils from './ChannelUtils';
import UserUtils from './User';

class Utils {
	Token: any;

	User: UserUtils;

	Channel: ChannelUtils;

	req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;

	res: Response<any, Record<string, any>>;

	constructor(
		Token: string,
		req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
		res: Response<any, Record<string, any>>,
	) {
		this.Token = Token;
		this.req = req;
		this.res = res;

		this.User = new UserUtils(Token, req, res, this);

		this.Channel = new ChannelUtils(Token, req, res, this);
	}
}

export default Utils;

export { Utils };
