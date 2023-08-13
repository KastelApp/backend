CREATE TYPE IF NOT EXISTS author (
    name text,
    iconurl text
);

CREATE TYPE IF NOT EXISTS footer (
    text text,
    timestamp_ timestamp
);

CREATE TYPE IF NOT EXISTS field (
    title text,
    description text
);

CREATE TYPE IF NOT EXISTS main_object (
    title text,
    description text,
    url text,
    color text,
    author frozen<author>,
    footer frozen<footer>,
    fields list<frozen<field>>,
    thumbnail_url text,
    image_url text
);

CREATE TABLE IF NOT EXISTS messages (
	message_id text PRIMARY KEY,
	author_id text,
	content text,
	allowed_mentions int,
	updated_date timestamp,
	channel_id text,
	nonce text,
	flags int,
	mentions list<text>,
	mention_roles list<text>,
	mention_channels list<text>,
	embeds list<frozen<main_object>>,
	attachments list<text>,
	replying_to text,
);

CREATE INDEX IF NOT EXISTS messages_channel_id_index ON messages (channel_id);

CREATE INDEX IF NOT EXISTS messages_nonce_index ON messages (nonce);
