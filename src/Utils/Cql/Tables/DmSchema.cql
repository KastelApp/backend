CREATE TYPE IF NOT EXISTS dm_recipients (
	user_id text,
	flags int,
);

CREATE TABLE IF NOT EXISTS dm (
	dm_id text PRIMARY KEY,
	recipients list<frozen<dm_recipients>>,
	channel_id text,
	flags int,
);
