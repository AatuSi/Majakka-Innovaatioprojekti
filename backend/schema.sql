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
DROP TABLE IF EXISTS contact_messages CASCADE;

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

CREATE TABLE iala_lights (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    rhythm      VARCHAR(100) NOT NULL,
    description TEXT,
    config      JSONB        NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE quiz_questions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id       UUID        NOT NULL,
    iala_light_id UUID,
    question_text TEXT,
    explanation   TEXT,
    hint          TEXT,
    position      INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT quiz_questions_quiz_id_fkey
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
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
        ON UPDATE CASCADE ON DELETE CASCADE,
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

CREATE TABLE contact_messages(
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(320) NOT NULL,
    topic      VARCHAR(100) NOT NULL,
    message    TEXT         NOT NULL,  
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()      
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);
CREATE INDEX idx_quiz_questions_iala_light_id ON quiz_questions (iala_light_id);
CREATE INDEX idx_quiz_question_options_question_id ON quiz_question_options (question_id);
CREATE INDEX idx_quiz_question_options_iala_light_id ON quiz_question_options (iala_light_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts (user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_responses_attempt_id ON quiz_responses (attempt_id);

-- One answer per question in an attempt.
CREATE UNIQUE INDEX quiz_responses_attempt_id_question_id_key
    ON quiz_responses (attempt_id, question_id);

CREATE UNIQUE INDEX iala_lights_name_lower_key ON iala_lights (lower(name));
CREATE INDEX idx_iala_lights_category ON iala_lights (category);
CREATE INDEX idx_iala_lights_config ON iala_lights USING gin (config);

--------------------------------------------------------------------------------
-- IALA-loisteet
--------------------------------------------------------------------------------

INSERT INTO iala_lights (name, category, rhythm, description, config) VALUES
(
    'Pohjoinen kardinaalimerkki',
    'Kardinaalimerkit',
    'Q tai VQ',
    'Väri: Musta yläosa, keltainen alaosa.
Ylämerkki: Kaksi mustaa ylöspäin osoittavaa kolmiota.
Valotunnus: Jatkuva pikavilkku tai nopea pikavilkkku (Q or VQ).
Yleissääntönä merkki voidaan kiertää turvallisesti merkin pohjoispuolelta.',
    '{
      "color": "white",
      "rhythm": "VQ",
      "sequence_ms": [200, 200]
    }'::jsonb
),
(
    'Eteläinen kardinaalimerkki',
    'Kardinaalimerkit',
    'VQ(6) + LFl 10s',
    'Väri: Keltainen yläosa, musta alaosa.
Ylämerkki: Kaksi mustaa alaspäin osoittavaa kolmiota.
Valotunnus: Kuusi nopeaa väläystä, jonka jälkeen 1 pitkä valo kymmenen sekunnin aikana (VQ(6) + LFl 10s).
Yleissääntönä merkki voidaan kiertää turvallisesti merkin eteläpuolelta.',
    '{
      "color": "white",
      "rhythm": "VQ(6) + LFl 10s",
      "sequence_ms": [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 2000, 5600]
    }'::jsonb
),
(
    'Itäinen kardinaalimerkki',
    'Kardinaalimerkit',
    'VQ(3) 5s',
    'Väri: Musta ylä- ja alaosa, keltainen keskiosa.
Ylämerkki: Kaksi mustaa kolmiota, joista ylemmän kärki osoittaa ylös, ja alemman alas.
Valotunnus: Kolme nopeaa väläystä 5 sekunnin aikana (VQ(3) 5s).
Yleissääntönä merkki voidaan kiertää turvallisesti merkin itäpuolelta.',
    '{
      "color": "white",
      "rhythm": "VQ(3) 5s",
      "sequence_ms": [200, 200, 200, 200, 200, 4000]
    }'::jsonb
),
(
    'Läntinen kardinaalimerkki',
    'Kardinaalimerkit',
    'VQ(9) 10s',
    'Väri: Keltainen ylä- ja alaosa, musta keskiosa.
Ylämerkki: Kaksi mustaa kolmiota, joiden kärjet osoittavat toisiaan päin.
Valotunnus: Yhdeksän nopeaa väläystä 10 sekunnin aikana (VQ(9) 10s).
Yleissääntönä merkki voidaan kiertää turvallisesti merkin länsipuolelta.',
    '{
      "color": "white",
      "rhythm": "VQ(9) 10s",
      "sequence_ms": [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 6600]
    }'::jsonb
),
(
    'Vasen merkki (A-alue)',
    'Lateraalimerkit',
    'Fl R 3s',
    'Väri: Punainen.
Ylämerkki: Yksi punainen lieriö.
Valotunnus: Punainen valo, yksi väläys kolmen sekunnin aikana(Fl R 3s).
Yleissääntönä IALA A-alueella vasen merkki jätetään aluksen vasemmalle puolelle kuljettaessa satamaa kohti.',
    '{
      "color": "red",
      "rhythm": "Fl R 3s",
      "sequence_ms": [500, 2500]
    }'::jsonb
),
(
    'Oikea merkki (A-alue)',
    'Lateraalimerkit',
    'Fl G 3s',
    'Väri: Vihreä.
Ylämerkki: Yksi vihreä kolmio, joka osoittaa ylös.
Valotunnus: Vihreä valo, yksi väläys kolmen sekunnin aikana(Fl G 3s).
Yleissääntönä IALA A-alueella oikea merkki jätetään aluksen oikealle puolelle kuljettaessa satamaa kohti.',
    '{
      "color": "green",
      "rhythm": "Fl G 3s",
      "sequence_ms": [500, 2500]
    }'::jsonb
),
(
    'Karimerkki',
    'Erikoismerkit',
    'Fl(2) 5s',
    'Väri: Musta yhdellä tai useammalla punaisella raidalla.
Ylämerkki: Kaksi mustaa palloa.
Valotunnus: Kaksi väläystä 5 sekunnin aikana (Fl(2) 5s).
Merkkiä käytetään varoittamaan karista.',
    '{
      "color": "white",
      "rhythm": "Fl(2) 5s",
      "sequence_ms": [500, 500, 500, 3500]
    }'::jsonb
),
(
    'Turvavesimerkki',
    'Erikoismerkit',
    'LFl 10s',
    'Väri: Jaettu pystysuoraan punaiseen ja valkoiseen.
Ylämerkki: Yksi punainen pallo.
Valotunnus: Pitkä kahden sekunnin valo, joka näkyy 10 sekunnin aikana.
Yleissääntönä osoittaa avointa ja turvallista vettä väylän keskellä tai alussa.',
    '{
      "color": "white",
      "rhythm": "LFl 10s",
      "sequence_ms": [2000, 8000]
    }'::jsonb
);

-- Alla oleva lisää testiquizin ja yhden kysymyksen testausta varten. Admin-dashboard olisi parempi tulevaisuutta ajatellen
DO $$
DECLARE
    v_quiz_id UUID;
    v_question_id UUID;
    v_north_id UUID;
    v_south_id UUID;
    v_east_id UUID;

BEGIN
    INSERT INTO quizzes (name) VALUES ('Testiquiz') RETURNING id INTO v_quiz_id;

    SELECT id INTO v_north_id FROM iala_lights WHERE name = 'Pohjoinen kardinaalimerkki';
    SELECT id INTO v_south_id FROM iala_lights WHERE name = 'Eteläinen kardinaalimerkki';
    SELECT id INTO v_east_id FROM iala_lights WHERE name = 'Itäinen kardinaalimerkki';

    INSERT INTO quiz_questions (quiz_id, iala_light_id, question_text, position)
    VALUES (
        v_quiz_id, 
        v_north_id, 
        'Mikä näistä IALA-loisteista on pohjoinen kardinaalimerkki?', 
        1
    ) 
    RETURNING id INTO v_question_id;

    INSERT INTO quiz_question_options (question_id, iala_light_id, option_text, is_correct, position)
    VALUES (v_question_id, v_north_id, 'Vaihtoehto 1', TRUE, 1);

    INSERT INTO quiz_question_options (question_id, iala_light_id, option_text, is_correct, position)
    VALUES (v_question_id, v_south_id, 'Vaihtoehto 2', FALSE, 2);

    INSERT INTO quiz_question_options (question_id, iala_light_id, option_text, is_correct, position)
    VALUES (v_question_id, v_east_id, 'Vaihtoehto 3', FALSE, 3);

END $$;
--------------------------------------------------------------------------------
-- IALA-quiz & COLREG-quiz
--------------------------------------------------------------------------------

DO $$
DECLARE
    iala_quiz_id UUID;
    colreg_quiz_id UUID;
    question_id UUID;
BEGIN
    INSERT INTO quizzes (name)
    VALUES ('IALA-tietovisa')
    RETURNING id INTO iala_quiz_id;

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mitä väriä on paapuurin lateraalimerkki IALA-A-alueella, johon Suomi kuuluu?', 
        'IALA-A-alueella paapuurin (vasemman puolen) merkki on punainen tynnyripoiju punaisella valolla. Muistisääntö on ''punainen paapuuriin, vihreä styyrpuuriin''. IALA-B-alueella, esimerkiksi Amerikoissa ja Japanissa, värit ovat päinvastoin.',
        'Lateraalimerkit',
        1
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options
        (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Punainen', TRUE, 1),
        (question_id, 'Vihreä', FALSE, 2),
        (question_id, 'Keltainen', FALSE, 3),
        (question_id, 'Musta-keltainen', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Poijussa on kaksi ylöspäin osoittavaa kartiota huippumerkkinä. Miltä puolelta merkki ohitetaan?', 
        'Kaksi ylöspäin osoittavaa kartiota merkitsee pohjoiskardinaalia: kulje merkin pohjoispuolelta. Kartiot osoittavat samaan suuntaan kuin se ilmansuunta, jolta merkki ohitetaan.',
        'Kardinaalimerkit',
        2
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Eteläpuolelta', FALSE, 1),
        (question_id, 'Pohjoispuolelta', TRUE, 2),
        (question_id, 'Itäpuolelta', FALSE, 3),
        (question_id, 'Länsipuolelta', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mitä lyhenne ''Iso'' tarkoittaa loiston tunnuksessa?', 
        'Isofaasiloistossa valo palaa täsmälleen puolet ajasta ja on sammuneena puolet. Täysin tasapainoinen rytmi tekee siitä helposti tunnistettavan merellä.',
        'Loistojen rytmit',
        3
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Nopea välkky, 50–60 välähdystä minuutissa', FALSE, 1),
        (question_id, 'Kiinteä, katkeamaton valo', FALSE, 2),
        (question_id, 'Isofaasi — yhtä pitkät valo- ja pimeäjaksot', TRUE, 3),
        (question_id, 'Pimennetty, jossa valo palaa pimeyttä kauemmin', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Eteläkardinaalin loistotunnus on Np(6)+PVl. Miksi välähdyksiä on juuri kuusi?', 
        'Kardinaalimerkkien välähdysmäärät noudattavat kellotaulua: kolme idässä (kello 3), kuusi etelässä (kello 6) ja yhdeksän lännessä (kello 9). Etelämerkin pitkä välkky erottaa sen läntisestä yhdeksän välähdyksen merkistä.',
        'Kardinaalimerkit',
        4
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Merkin syvyys on kuusi metriä', FALSE, 1),
        (question_id, 'Merkki ohitetaan kuuden solmun nopeudella', FALSE, 2),
        (question_id, 'Kuusi tarkoittaa kuutta turvallista väylää', FALSE, 3),
        (question_id, 'Kello kuusi on kellotaulun alhaalla eli etelässä', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Punavalkoinen pystyraidallinen pallopoiju, jonka valo on Mo(A). Mitä se tarkoittaa?', 
        'Turvavesimerkki osoittaa, että sen ympärillä on turvallista kulkuvettä joka suuntaan. Se merkitsee usein väylän keskilinjan tai maatumiskohdan. Valo on Morse A, pitkä välkky tai isofaasi, aina valkoinen.',
        'Turvavesimerkki',
        5
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Turvallista kulkuvettä joka suuntaan', TRUE, 1),
        (question_id, 'Eristetty vaara, jonka ympäri kuljetaan', FALSE, 2),
        (question_id, 'Erikoisalue, esimerkiksi kaapeli tai putkisto', FALSE, 3),
        (question_id, 'Väylän styyrpuurin puoli', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Poijussa on kaksi mustaa palloa päällekkäin huippumerkkinä. Mikä merkki on kyseessä?', 
        'Kaksi mustaa palloa päällekkäin on eristetyn vaaramerkin huippumerkki. Runko on musta-punainen vaakaraidallinen ja valo valkoinen ryhmävälkky Vl(2). Merkin ympärillä on turvallista vettä.',
        'Eristetty vaaramerkki',
        6
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Turvavesimerkki', FALSE, 1),
        (question_id, 'Eristetty vaaramerkki', TRUE, 2),
        (question_id, 'Pohjoiskardinaali', FALSE, 3),
        (question_id, 'Erikoismerkki', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Minkä värinen on erikoismerkin runko ja valo?', 
        'Erikoismerkki on keltainen ja sen valo on keltainen. Huippumerkkinä on keltainen X. Se merkitsee merikortissa mainittua erityisaluetta, kuten kaapelia, putkistoa, vesiviljelyä tai harjoitusaluetta.',
        'Erikoismerkit',
        7
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Musta runko ja valkoinen valo', FALSE, 1),
        (question_id, 'Vihreä runko ja vihreä valo', FALSE, 2),
        (question_id, 'Keltainen runko ja keltainen valo', TRUE, 3),
        (question_id, 'Punavalkoinen runko ja valkoinen valo', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Loiston tunnus on ''Vl(3) 7s''. Mitä se kertoo valon rytmistä?', 
        'Suluissa oleva luku kertoo ryhmän välähdysten määrän ja perässä oleva aika koko jakson pituuden. Vl(3) 7s tarkoittaa siis kolmea nopeaa välähdystä, joiden jälkeen seuraa pimeä jakso, ja koko kuvio toistuu 7 sekunnin välein.', 
        'Loistojen rytmit',
        8
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Kolmen sekunnin välähdys 7 kertaa minuutissa', FALSE, 1),
        (question_id, 'Seitsemän välähdystä kolmen sekunnin välein', FALSE, 2),
        (question_id, 'Valo palaa 3 sekuntia ja on pimeänä 7 sekuntia', FALSE, 3),
        (question_id, 'Kolme välähdystä ryhmässä, jakso toistuu 7 sekunnin välein', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mikä on ainoa ero IALA-A- ja IALA-B-alueiden välillä?', 
        'Kardinaali-, turvavesi-, erikois- ja vaaramerkit ovat samanlaisia kaikkialla. Ainoastaan lateraalimerkkien punainen ja vihreä vaihtavat paikkaa: IALA-A-alueella punainen on paapuurissa, IALA-B-alueella styyrpuurissa.',
        'IALA-alueet',
        9
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Punaisen ja vihreän värin sijoittelu lateraalimerkeissä', TRUE, 1),
        (question_id, 'Kardinaalimerkkien huippumerkkien suunta', FALSE, 2),
        (question_id, 'Turvavesimerkin väritys', FALSE, 3),
        (question_id, 'Loistojen välähdysrytmit', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mikä loistotyyppi palaa kauemmin kuin on pimeänä, eli lyhyt pimennys katkaisee tasaisen valon?', 
        'Pimennetty loisto on välkkyvän vastakohta: valoa on enemmän kuin pimeyttä. Sitä käytetään yleisesti johtoloistoissa ja sektorivaroitusloistoissa.', 
        'Loistojen rytmit',
        10
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Välkkyvä (Vl)', FALSE, 1),
        (question_id, 'Pimennetty (Pim)', TRUE, 2),
        (question_id, 'Nopea (Np)', FALSE, 3),
        (question_id, 'Pitkä välkky (PVl)', FALSE, 4);

    INSERT INTO quizzes (name)
    VALUES ('COLREG-tietovisa')
    RETURNING id INTO colreg_quiz_id;

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Näet pimeällä edessäsi sekä punaisen että vihreän sivuvalon ja niiden yläpuolella valkoisen valon. Mitä se kertoo?', 
        'Molemmat sivuvalot näkyvät vain suoraan edestä. Punainen on aluksen paapuurissa ja vihreä styyrpuurissa, joten alus on tulossa kohti — kyseessä on vastaantulotilanne.',
        'Kulkuvalot',
        1
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Alus tulee suoraan kohti', TRUE, 1),
        (question_id, 'Alus menee poispäin', FALSE, 2),
        (question_id, 'Alus on ankkurissa', FALSE, 3),
        (question_id, 'Alus risteää oikealta vasemmalle', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kaksi konealusta kohtaa suoraan vastakkain. Mitä sääntö 14 edellyttää?', 
        'Vastaantulotilanteessa molemmat alukset kääntävät kurssiaan oikealle, jolloin ne ohittavat toisensa paapuuri paapuuria vasten. Sääntö on symmetrinen: kumpikaan ei jää odottamaan toisen liikettä.', 
        'Väistämissäännöt',
        2
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Molemmat kääntyvät vasemmalle eli paapuuriin', FALSE, 1),
        (question_id, 'Molemmat kääntyvät oikealle eli styyrpuuriin', TRUE, 2),
        (question_id, 'Pienempi alus väistää aina', FALSE, 3),
        (question_id, 'Kumpikaan ei muuta kurssia', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kaksi konealusta risteää. Kumpi väistää sääntö 15:n mukaan?', 
        'Risteävässä tilanteessa väistää se alus, jolla toinen on oikealla eli styyrpuurin puolella — se näkee toisen punaisen sivuvalon. Väistämisen tulee olla selvä ja ajoissa tehty.', 
        'Väistämissäännöt',
        3
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Se, jolla toinen alus on omalla paapuurin puolella', FALSE, 1),
        (question_id, 'Nopeampi alus', FALSE, 2),
        (question_id, 'Se, jolla toinen alus on omalla styyrpuurin puolella', TRUE, 3),
        (question_id, 'Se, joka havaitsi toisen ensin', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Mitkä valot purjealus näyttää purjeilla kulkiessaan?', 
        'Purjealus näyttää vain sivuvalot ja perävalon. Valkoinen mastovalo kuuluu konealukselle, joten sen puuttuminen erottaa purjealuksen konealuksesta. Jos purjealus käyttää konetta, se on konealus ja näyttää myös mastovalon.', 
        'Kulkuvalot',
        4
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Sivuvalot, perävalo ja mastovalo', FALSE, 1),
        (question_id, 'Pelkkä ympärinäkyvä valkoinen valo', FALSE, 2),
        (question_id, 'Kaksi punaista ympärinäkyvää valoa', FALSE, 3),
        (question_id, 'Sivuvalot ja perävalo, ei mastovaloa', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kuinka laajalla sektorilla sivuvalot näkyvät?', 
        'Sivuvalot näkyvät 112,5° sektorilla keulasta taaksepäin kummallakin puolella. Mastovalon sektori on 225° ja perävalon 135°. Yhdessä ne kattavat täyden ympyrän.', 
        'Valosektorit',
        5
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, '112,5° kummallakin puolella', TRUE, 1),
        (question_id, '225° kummallakin puolella', FALSE, 2),
        (question_id, '135° kummallakin puolella', FALSE, 3),
        (question_id, '360° eli ympärinäkyvästi', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus näyttää kaksi punaista ympärinäkyvää valoa päällekkäin. Mitä se tarkoittaa?', 
        'Kaksi punaista ympärinäkyvää valoa päällekkäin tarkoittaa ohjailukyvytöntä alusta, joka ei poikkeuksellisen tilanteen vuoksi pysty väistämään. Jos alus liikkuu vedessä, se näyttää lisäksi sivuvalot ja perävalon.',
        'Kulkuvalot',
        6
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Ankkurissa oleva alus', FALSE, 1),
        (question_id, 'Ohjailukyvytön alus', TRUE, 2),
        (question_id, 'Kalastava alus', FALSE, 3),
        (question_id, 'Luotsialus', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus lähestyy toista takaviistosta yli 22,5° peräsuunnan takaa. Kuka väistää?', 
        'Kyseessä on ohittaminen, ja sääntö 13 on yksiselitteinen: ohittava alus väistää ohitettavaa, kunnes se on selvästi ohitse. Ohittava alus näkee ohitettavan perävalon eikä sivuvaloja.', 
        'Väistämissäännöt',
        7
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Ohitettava alus väistää aina', FALSE, 1),
        (question_id, 'Konealus väistää purjealusta', FALSE, 2),
        (question_id, 'Ohittava alus väistää aina', TRUE, 3),
        (question_id, 'Kumpikaan ei väistä', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus näyttää ympärinäkyvän vihreän valon valkoisen yläpuolella. Mikä alus on kyseessä?', 
        'Vihreä valkoisen päällä tarkoittaa troolaavaa alusta. Muu kuin troolaava kalastusalus näyttää punaisen valkoisen päällä, ja luotsialus valkoisen punaisen päällä.', 
        'Kulkuvalot',
        8
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Luotsialus', FALSE, 1),
        (question_id, 'Ohjailukyvytön alus', FALSE, 2),
        (question_id, 'Syväyksensä vuoksi rajoittunut alus', FALSE, 3),
        (question_id, 'Troolaava kalastusalus', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alle 50-metrinen alus on ankkurissa. Mitä valoa se näyttää?', 
        'Ankkurissa oleva alle 50-metrinen alus näyttää yhden ympärinäkyvän valkoisen valon siellä, missä se parhaiten näkyy. Vähintään 50-metrinen alus näyttää lisäksi toisen, alemman valon perässä.', 
        'Kulkuvalot',
        9
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Yhtä ympärinäkyvää valkoista valoa keulassa', TRUE, 1),
        (question_id, 'Kahta punaista valoa päällekkäin', FALSE, 2),
        (question_id, 'Sivuvaloja ja perävaloa', FALSE, 3),
        (question_id, 'Mastovaloa ja perävaloa', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Näet aluksen perästä pelkän valkoisen valon etkä lainkaan sivuvaloja. Mitä se kertoo?', 
        'Perävalo näkyy 135° sektorilla suoraan takaa, eivätkä sivuvalot ulotu sinne. Pelkkä valkoinen valo ilman sivuvaloja tarkoittaa siis, että katsot alusta takaa ja olet mahdollisesti ohittamassa sitä.', 
        'Kulkuvalot',
        10
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Alus tulee suoraan kohti', FALSE, 1),
        (question_id, 'Näet aluksen perävalon eli alus menee poispäin', TRUE, 2),
        (question_id, 'Alus on ohjailukyvytön', FALSE, 3),
        (question_id, 'Alus risteää vasemmalta oikealle', FALSE, 4);

END $$;
COMMIT;
