CREATE TABLE IF NOT EXISTS bot (
	user_id text,
    application_id text PRIMARY KEY,
    name text,
    description text,
    icon_hash text,
    summary text,
    owner_id text
);

CREATE INDEX IF NOT EXISTS bot_user_id_index ON bot (user_id);

CREATE INDEX IF NOT EXISTS bot_owner_id_index ON bot (owner_id);
