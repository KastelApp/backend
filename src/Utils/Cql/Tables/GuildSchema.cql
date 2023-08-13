CREATE TABLE IF NOT EXISTS guilds (
	guild_id text PRIMARY KEY,
	icon text,
	name text,
	description text,
	flags int,
	owner_id text,
	co_owners list<text>,
	max_members int,
	features list<text>
);

CREATE INDEX IF NOT EXISTS guild_owner_id ON guilds (owner_id);
