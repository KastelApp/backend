CREATE TABLE IF NOT EXISTS verifcationlink (
	code text PRIMARY KEY,
	user_id text,
	created_date timestamp,
	expire_date timestamp,
	ip text,
	flags int,
);

CREATE INDEX IF NOT EXISTS verifcationlink_ip_index ON verifcationlink (ip);

CREATE INDEX IF NOT EXISTS verifcationlink_flags_index ON verifcationlink (flags);
