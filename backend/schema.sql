-- This works only on Postgresql!
BEGIN;

DROP TABLE IF EXISTS quiz_responses CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_question_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS iala_lights CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS result CASCADE;
DROP TABLE IF EXISTS account CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('admin', 'user');

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));

CREATE TABLE quizzes (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE quiz_questions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       UUID        NOT NULL,
    iala_light_id UUID,
    question_text TEXT,
    position      INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT quiz_questions_quiz_id_fkey
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    CONSTRAINT quiz_questions_iala_light_id_fkey
        FOREIGN KEY (iala_light_id) REFERENCES iala_lights (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE quiz_question_options (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID        NOT NULL,
    iala_light_id UUID,
    option_text TEXT,
    is_correct  BOOLEAN     NOT NULL DEFAULT FALSE,
    position    INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT quiz_question_options_question_id_fkey
        FOREIGN KEY (question_id) REFERENCES quiz_questions (id)
        ON UPDATE CASCADE ON DELETE CASCADE
    CONSTRAINT quiz_question_options_iala_light_id_fkey
        FOREIGN KEY (iala_light_id) REFERENCES iala_lights (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE quiz_attempts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL,
    quiz_id    UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT quiz_attempts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT quiz_attempts_quiz_id_fkey
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE quiz_responses (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id         UUID        NOT NULL,
    question_id        UUID        NOT NULL,
    selected_option_id UUID        NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT quiz_responses_attempt_id_fkey
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT quiz_responses_question_id_fkey
        FOREIGN KEY (question_id) REFERENCES quiz_questions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT quiz_responses_selected_option_id_fkey
        FOREIGN KEY (selected_option_id) REFERENCES quiz_question_options (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE iala_lights (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    description TEXT,
    config      JSONB        NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);
CREATE INDEX idx_quiz_questions_iala_light_id ON quiz_questions (iala_light_id);
CREATE INDEX idx_quiz_question_options_question_id ON quiz_question_options (question_id);
CREATE INDEX idx_quiz_question_options_iala_light_id ON quiz_question_options (iala_light_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts (user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_responses_attempt_id ON quiz_responses (attempt_id);

CREATE UNIQUE INDEX iala_lights_name_lower_key ON iala_lights (lower(name));
CREATE INDEX idx_iala_lights_category ON iala_lights (category);
CREATE INDEX idx_iala_lights_config ON iala_lights USING gin (config);

COMMIT;