CREATE TYPE IF NOT EXISTS friends_interactions (
	user_id text,
	target_id text,
	target_nickname text,
	flags int,
);

CREATE TABLE IF NOT EXISTS friends (
	friend_id text PRIMARY KEY,
	users list<text>,
	interactions list<frozen<friends_interactions>>,
);

CREATE INDEX IF NOT EXISTS friends_users_index ON friends (users);
