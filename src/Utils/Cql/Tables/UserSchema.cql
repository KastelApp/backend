CREATE TABLE IF NOT EXISTS users (
	user_id text PRIMARY KEY,
	email text,
	username text,
	tag text,
	avatar text,
	password text,
	phone_number text,
	two_fa_secret text,
	ips list<text>,
	flags text,
	guilds list<text>,
	global_nickname text,
);

CREATE INDEX IF NOT EXISTS users_email_index ON users (email);

CREATE INDEX IF NOT EXISTS users_username_index ON users (username);

CREATE INDEX IF NOT EXISTS users_tag_index ON users (tag);
