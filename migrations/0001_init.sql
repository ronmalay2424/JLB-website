-- Initial schema for the JLB website.
-- Applied with:  npm run db:migrate:local   (local)
--                npm run db:migrate:remote  (production)

-- Mailing list subscribers (double opt-in).
CREATE TABLE IF NOT EXISTS subscribers (
	id              INTEGER PRIMARY KEY AUTOINCREMENT,
	email           TEXT NOT NULL UNIQUE,
	-- 'pending'   : signed up, confirmation email sent, not yet confirmed
	-- 'confirmed' : clicked the confirmation link
	-- 'unsubscribed'
	status          TEXT NOT NULL DEFAULT 'pending',
	-- Opaque token used for both the confirm and unsubscribe links.
	token           TEXT,
	-- Where the signup came from (e.g. 'footer', 'shows-page').
	source          TEXT,
	created_at      TEXT NOT NULL DEFAULT (datetime('now')),
	confirmed_at    TEXT,
	unsubscribed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status);
CREATE INDEX IF NOT EXISTS idx_subscribers_token  ON subscribers (token);

-- Contact / booking form submissions. Emailed on receipt and also stored here
-- as a durable record.
CREATE TABLE IF NOT EXISTS contact_messages (
	id         INTEGER PRIMARY KEY AUTOINCREMENT,
	name       TEXT NOT NULL,
	email      TEXT NOT NULL,
	subject    TEXT,
	message    TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	-- 0 = new, 1 = handled. Useful if an admin view is added later.
	handled    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages (created_at);
