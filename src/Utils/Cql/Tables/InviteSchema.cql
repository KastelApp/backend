CREATE TABLE IF NOT EXISTS invites (
	code text PRIMARY KEY,
	guild_id text,
	channel_id text,
	expires timestamp,
	uses int,
	max_uses int,
	creator_id text,
	deleteable boolean,
);

CREATE INDEX IF NOT EXISTS invites_guild_id_index ON invites (guild_id);

CREATE INDEX IF NOT EXISTS invites_channel_id_index ON invites (channel_id);

