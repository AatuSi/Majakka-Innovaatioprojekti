-- This works only on Postgresql!

BEGIN;

DROP TABLE IF EXISTS result CASCADE;
DROP TABLE IF EXISTS account CASCADE;
 
CREATE TABLE account (
    account_id     BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username       VARCHAR(32)  NOT NULL,
    password_hash  TEXT         NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
 
    CONSTRAINT account_username_format
        CHECK (username ~ '^[A-Za-z0-9_.-]{3,32}$'),
    CONSTRAINT account_password_hash_not_blank
        CHECK (length(password_hash) > 0)
);


-- Indexes speed up search queries.
CREATE UNIQUE INDEX account_username_lower_key
    ON account (lower(username));


CREATE TABLE result (
    result_id    BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id   BIGINT       NOT NULL,
    results      TEXT         NOT NULL,
    recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
 
    CONSTRAINT result_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES account (account_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- One more index for looking up users, indexes account id -> recorded_at, iirc you must search first for the account_id then recorded_at for it to work.
CREATE INDEX result_account_recorded_idx
    ON result (account_id, recorded_at DESC);


COMMIT;
