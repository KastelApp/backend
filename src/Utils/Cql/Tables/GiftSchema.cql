CREATE TABLE IF NOT EXISTS gifts (
	gift_id text PRIMARY KEY,
	user_id text,
	type int,
	max_age timestamp,
	gift_length timestamp,
	used_by text,
);
