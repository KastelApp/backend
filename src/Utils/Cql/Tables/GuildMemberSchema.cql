CREATE TYPE IF NOT EXISTS membertimeouts (
	channel_id text,
	timeout_until timestamp,
);

CREATE TABLE IF NOT EXISTS guild_members (
	guild_id text PRIMARY KEY,
	user_id text,
	roles list<text>,
	nickname text,
	joined_at timestamp,
	flags int,
	timeouts list<frozen<membertimeouts>>,
);

CREATE INDEX IF NOT EXISTS guildmembers_user_id ON guild_members (user_id);
