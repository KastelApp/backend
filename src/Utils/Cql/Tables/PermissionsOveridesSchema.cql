CREATE TABLE IF NOT EXISTS permissionsoverides (
	permission_id text PRIMARY KEY,
	id text,
	allow_ bigint,
	deny bigint,
	type text,
	editable boolean,
	slowmode int,
);

CREATE INDEX IF NOT EXISTS permissionsoverides_id_index ON permissionsoverides (id);
