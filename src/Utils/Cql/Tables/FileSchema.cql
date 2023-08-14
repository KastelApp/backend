CREATE TABLE IF NOT EXISTS files (
	file_id text PRIMARY KEY,
	message_id text,
	name text,
	cdn_token text,
	type text,
	deleted boolean,
);
