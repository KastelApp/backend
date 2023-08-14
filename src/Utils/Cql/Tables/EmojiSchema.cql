CREATE TABLE IF NOT EXISTS emojis (
	emoji_id text PRIMARY KEY,
	guild_id text,
	creator_id text,
	name text,
	emoji_hash text,
	disabled boolean,
	public boolean,
);

CREATE INDEX IF NOT EXISTS emojis_guild_id ON emojis (guild_id);
