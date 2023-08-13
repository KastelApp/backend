CREATE TABLE IF NOT EXISTS bans (
	guild_id text,
	user_id text PRIMARY KEY,
	banner_id text,
	reason text,
	banned_date timestamp,
	unban_date timestamp,
);

CREATE INDEX IF NOT EXISTS bans_guild_id_idx ON bans (guild_id);
