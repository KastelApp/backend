CREATE TABLE IF NOT EXISTS webhooks (
	webhook_id text PRIMARY KEY,
	guild_id text,
	channel_id text,
	username text,
	token_ text,
	allowed_mentions int,
);

CREATE INDEX IF NOT EXISTS webhooks_guild_id_index ON webhooks (guild_id);

CREATE INDEX IF NOT EXISTS webhooks_channel_id_index ON webhooks (channel_id);
