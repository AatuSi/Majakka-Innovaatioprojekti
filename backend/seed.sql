
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
    VALUES ('IALA-tietovisa 1')
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



DO $$
DECLARE
    iala_quiz_id UUID;
    colreg_quiz_id UUID;
    question_id UUID;
BEGIN
    INSERT INTO quizzes (name)
    VALUES ('IALA-tietovisa 2')
    RETURNING id INTO iala_quiz_id;

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mitä väriä on styyrpuurin lateraalimerkki IALA-A-alueella, johon Suomi kuuluu?', 
        'IALA-A-alueella styyrpuuriin (oikean puolen) merkki on vihreä poiju ylöspäin osoittavalla kartiolla ja vihreällä valolla. Muistisääntö on ''punainen paapuuriin, vihreä styyrpuuriin''. IALA-B-alueella, esimerkiksi Amerikoissa ja Japanissa, värit ovat päinvastoin.',
        'Lateraalimerkit',
        1
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options
        (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Punainen', FALSE, 1),
        (question_id, 'Vihreä', TRUE, 2),
        (question_id, 'Keltainen', FALSE, 3),
        (question_id, 'Musta-keltainen', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Poijussa on merkkeinä kaksi kartiota, jotka osoittavat toisiinsa, muodostaen tiimalasikuvion. Poijun päät ovat keltaisia, ja keskus musta. Miltä puolelta merkki ohitetaan?', 
        'Poiju, jonka päät ovat keltaiset ja keskus musta, ja jossa on kaksi toisiinsa osoittavaa kartiota merkitsee länsikardinaalia: kulje merkin länsipuolelta.',
        'Kardinaalimerkit',
        2
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Eteläpuolelta', FALSE, 1),
        (question_id, 'Pohjoispuolelta', FALSE, 2),
        (question_id, 'Itäpuolelta', FALSE, 3),
        (question_id, 'Länsipuolelta', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mitä lyhenne ''VQ'' tarkoittaa loiston tunnuksessa?', 
        'Lyhenne ''VQ'' tulee sanoista Very Quick. Loiste on nopea pikavilkku (80-159 välähdystä/minuutti), tyypillisesti rytmiltään 100 tai 120 välähdystä minuuutissa.',
        'Loistojen rytmit',
        3
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Nopea vilkku, 50–60 välähdystä minuutissa', FALSE, 1),
        (question_id, 'Kiinteä, katkeamaton valo', FALSE, 2),
        (question_id, 'Nopea pikavilkku, 80-150 välähdystä minuutissa', TRUE, 3),
        (question_id, 'Pimennetty, jossa valo palaa pimeyttä kauemmin', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Länsikardinaalin loistotunnus on VQ (9) 10 s. Minkä takia välähdyksiä on 9 kappaletta?', 
        'Kardinaalimerkkien välähdysmäärät noudattavat kellotaulua: kolme idässä (kello 3), kuusi etelässä (kello 6) ja yhdeksän lännessä (kello 9).',
        'Kardinaalimerkit',
        4
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Ei ole loogista syytä, loisterytmejä valitessa valittiin mahdollisimman paljon erilaisia loisteita', FALSE, 1),
        (question_id, 'Yhdeksän välähdystä toimii muistutuksena pitää vähintään 9 jalan turvaväli poijuun', FALSE, 2),
        (question_id, 'Yhdeksän solmua on suositeltu maksiminopeus ohitettaessa poijuja läheltä', FALSE, 3),
        (question_id, 'Kello yhdeksän on kellotaulun vasemmassa reunassa eli lännessä', TRUE, 4);

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
        'Näet yöllä loisteen, jonka loistorytmi on Fl (2) 10 s. Miten kannattaa toimia', 
        'Fl (2) 10 s, eli kaksi välähdystä 10 sekunnin aikana on karimerkin loisto. Merkin kohdalla on karille ajamisen riski.',
        'Eristetty vaaramerkki',
        6
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Kyseessä on yleisesti käytetty hätämerkki, ja aluksen kuljettajan on autettava hädässä olevaa alusta', FALSE, 1),
        (question_id, 'Loiste viittaa kariin. Loisteen ympärillä on turvallista vettä.', TRUE, 2),
        (question_id, 'Kierrä loiste pohjoispuolelta', FALSE, 3),
        (question_id, 'Kierrä loiste itäpuolelta', FALSE, 4);

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
        'Loiston tunnus on ''Fl(2+1)''. Mitä se kertoo valon rytmistä?', 
        'Suluissa oleva luku kertoo ryhmän välähdysten määrän ja niiden rytmin. Fl tarkoittaa vilkkuvaloa, ja (2+1) kertoo siitä, että ensiksi tulee kaksi välähdystä, ja pienen tauon jälkeen vielä yksi välähdys. Näitä seuraa pidempi tauko, ja rytmi toistuu.', 
        'Loistojen rytmit',
        8
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Valo palaa kaksi sekuntia, jota seuraa yhden sekunnin pimeys', FALSE, 1),
        (question_id, 'Poijussa on kolme valoa, joista kaksi vilkkuu eri rytmillä kuin kolmas', FALSE, 2),
        (question_id, 'Valo välkkyy kolmen välähdyksen rytmissä. Kaksi ensimmäistä ovat pidempiä välähdyksiä, ja viimeinen välähdys on lyhyempi', FALSE, 3),
        (question_id, 'Kaksi välähdystä, pieni tauko ja yksi välähdys. Näitä seuraa pidempi tauko', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Kuuluuko Ahvenanmaa IALA-A vai IALA-B-alueeseen', 
        'IALA-B-alueeseen kuuluu molemmat Amerikat, Japani, Korea, Taiwan ja Filippiinit, kaikki muut kuuluvat IALA-A-alueeseen',
        'IALA-alueet',
        9
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'IALA-A', TRUE, 1),
        (question_id, 'IALA-B', FALSE, 2),
        (question_id, 'IALA-A, mutta Ahvenanmaalla noudatetaan poikkeavia karimerkkien loisteita', FALSE, 3),
        (question_id, 'Ahvenanmaalla noudatetaan omia paikallisia merimerkkisääntöjä, tunnetaan myös IALA-C-alueena', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        iala_quiz_id, 
        'Mikä on tasarytmivalon lyhenne (Tasarytmivalossa valo ja pimeä vuorottelevat yhtä pitkissä jaksoissa)?', 
        'Lyhenne tulee englannin kielisestä termistä ''Isophase light''', 
        'Loistojen rytmit',
        10
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'F', FALSE, 1),
        (question_id, 'Iso', TRUE, 2),
        (question_id, 'Oc', FALSE, 3),
        (question_id, 'LFI', FALSE, 4);

    INSERT INTO quizzes (name)
    VALUES ('COLREG-tietovisa 2')
    RETURNING id INTO colreg_quiz_id;

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus näyttää kolme ympärinäkyvää valoa pystysuorassa linjassa: ylin ja alin ovat punaisia, keskimmäinen valkoinen. Mikä alus on kyseessä?', 
        'Punainen-valkoinen-punainen pystysuorassa linjassa on ohjailukyvyltään rajoitetun aluksen tunnus (esimerkiksi ruoppaaja, kaapelinlaskija tai poijutöitä tekevä alus). Syväyksensä vuoksi rajoittunut alus puolestaan näyttää kolme punaista valoa päällekkäin.',
        'Kulkuvalot',
        1
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Ohjailukyvytön alus', FALSE, 1),
        (question_id, 'Ohjailukyvyltään rajoitettu alus', TRUE, 2),
        (question_id, 'Syväyksensä vuoksi rajoittunut alus', FALSE, 3),
        (question_id, 'Karilla oleva alus', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kaksi purjealusta lähestyy toisiaan eri halsseilla siten, että yhteentörmäämisen vaara on olemassa. Kumpi väistää sääntö 12:n mukaan?', 
        'Sääntö 12 määrää, että kun purjealuksilla on tuuli eri puolilta, vasemmalta puolelta tuulta saava alus (paapuurin halssilla kulkeva) väistää oikealta puolelta tuulta saavaa (styyrpuurin halssilla kulkevaa) alusta.', 
        'Väistämissäännöt',
        2
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Se, jolla on tuuli oikealta puolelta', FALSE, 1),
        (question_id, 'Tuulen yläpuolella oleva alus', FALSE, 2),
        (question_id, 'Se, jolla on tuuli vasemmalta puolelta', TRUE, 3),
        (question_id, 'Suurempi purjealus', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus näyttää valkoisen ympärinäkyvän valon punaisen ympärinäkyvän valon yläpuolella. Mikä alus on kyseessä?', 
        'Valkoinen valo punaisen yläpuolella on luotsialuksen tunnus sen ollessa luotsaustehtävässä (muistisääntö: valkoinen lakki, punainen nenä). Muu kuin troolaava kalastusalus näyttää päinvastoin punaisen valkoisen yläpuolella.', 
        'Kulkuvalot',
        3
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Muu kuin troolaava kalastusalus', FALSE, 1),
        (question_id, 'Luotsialus luotsaustehtävässä', TRUE, 2),
        (question_id, 'Hinaava alus', FALSE, 3),
        (question_id, 'Miinanraivaaja', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kuinka laajalla sektorilla konealuksen valkoinen mastovalo näkyy?', 
        'Mastovalo näkyy 225° sektorilla suoraan eteenpäin ja molemmille sivuille 22,5° poikkisuunnan taakse. Tämä vastaa täsmälleen molempien sivuvalojen yhteenlaskettua sektoria (112,5° + 112,5°).', 
        'Valosektorit',
        4
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, '112,5° suoraan eteenpäin', FALSE, 1),
        (question_id, '135° taaksepäin', FALSE, 2),
        (question_id, '360° eli ympärinäkyvästi', FALSE, 3),
        (question_id, '225° keulasta 22,5° poikkisuunnan taakse kummallekin puolelle', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Konealus ja purjealus ovat risteävillä kursseilla avovedellä siten, että yhteentörmäämisen vaara on olemassa. Kumpi väistää sääntö 18:n mukaan?', 
        'Sääntö 18:n vastuujärjestyksen mukaan kulussa oleva konealus väistää purjealusta, ellei purjealus ole ohittamassa konealusta tai kyseessä ole kapea kulkuväylä, jossa purjealus ei saa estää vain väylässä kulkemaan pystyvän aluksen kulkua.', 
        'Väistämissäännöt',
        5
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Konealus väistää purjealusta', TRUE, 1),
        (question_id, 'Purjealus väistää konealusta', FALSE, 2),
        (question_id, 'Se, jolla toinen on oikealla puolella', FALSE, 3),
        (question_id, 'Hitaampi alus väistää', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Konealus näyttää kahta valkoista mastovaloa päällekkäin sekä sivuvaloja ja perävaloa. Mitä kaksi mastovaloa päällekkäin kertoo?', 
        'Kaksi mastovaloa päällekkäin (yhdistettynä sivuvaloihin ja perävaloon) tarkoittaa hinaavaa alusta, kun hinauksen pituus hinaajan perästä hinattavan perään on enintään 200 metriä. Yli 200 metrin hinauksessa mastovaloja on kolme päällekkäin.',
        'Kulkuvalot',
        6
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Alus on yli 50 metriä pitkä', FALSE, 1),
        (question_id, 'Alus hinaa toista alusta ja hinauksen pituus on enintään 200 metriä', TRUE, 2),
        (question_id, 'Alus on karilla', FALSE, 3),
        (question_id, 'Alus on luotsialus', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kaksi purjealusta lähestyy toisiaan samalla halssilla (tuuli samalta puolelta) siten, että yhteentörmäämisen vaara syntyy. Kumpi väistää?', 
        'Kun molemmilla purjealuksilla on tuuli samalta puolelta, tuulen yläpuolella (tuulen puolella) oleva alus väistää suojan puolella (tuulen alapuolella) olevaa alusta.', 
        'Väistämissäännöt',
        7
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Suojan puolella eli tuulen alapuolella oleva alus', FALSE, 1),
        (question_id, 'Takana oleva alus kaikissa tilanteissa', FALSE, 2),
        (question_id, 'Tuulen puolella eli tuulen yläpuolella oleva alus', TRUE, 3),
        (question_id, 'Kevyempi purjealus', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Purjealus kulkee sekä purjeet ylhäällä että koneen voimalla. Mitä merkkikuviota sen on näytettävä päiväsaikaan?', 
        'Purjeilla kulkeva alus, joka käyttää samanaikaisesti konetta, katsotaan konealukseksi. Päiväsaikaan sen on näytettävä keulassa yhtä kartiota kärki alaspäin paikassa, jossa se parhaiten näkyy.', 
        'Päivämerkit',
        8
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Kahta palloa päällekkäin', FALSE, 1),
        (question_id, 'Yhtä palloa keulassa', FALSE, 2),
        (question_id, 'Lieriötä', FALSE, 3),
        (question_id, 'Kartiota kärki alaspäin', TRUE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Alus antaa näköpiirissä ollessaan yhden lyhyen äänimerkin. Mitä se tarkoittaa?', 
        'Sääntö 34:n mukaan alusten ollessa toistensa näköpiirissä yksi lyhyt äänimerkki tarkoittaa ”muutan kurssiani oikealle”, kaksi lyhyttä ”muutan kurssiani vasemmalle” ja kolme lyhyttä ”koneeni käy taaksepäin”.', 
        'Äänimerkit',
        9
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, 'Muutan kurssiani oikealle', TRUE, 1),
        (question_id, 'Muutan kurssiani vasemmalle', FALSE, 2),
        (question_id, 'Koneeni käy taaksepäin', FALSE, 3),
        (question_id, 'Aion ohittaa teidät vasemmalta puolelta', FALSE, 4);

    INSERT INTO quiz_questions (quiz_id, question_text, explanation, hint, position)
    VALUES (
        colreg_quiz_id, 
        'Kuinka laajalla sektorilla valkoinen perävalo näkyy?', 
        'Perävalo on valkoinen valo, joka on sijoitettu mahdollisimman lähelle perää ja näkyy katkeamattomana 135° sektorilla — eli 67,5° suoraan perästä kummallekin puolelle.', 
        'Valosektorit',
        10
    )
    RETURNING id INTO question_id;

    INSERT INTO quiz_question_options (question_id, option_text, is_correct, position)
    VALUES
        (question_id, '112,5° suoraan taaksepäin', FALSE, 1),
        (question_id, '135° eli 67,5° suoraan perästä kummallekin puolelle', TRUE, 2),
        (question_id, '225° suoraan taaksepäin', FALSE, 3),
        (question_id, '360° eli ympärinäkyvästi', FALSE, 4);

END $$;
COMMIT;