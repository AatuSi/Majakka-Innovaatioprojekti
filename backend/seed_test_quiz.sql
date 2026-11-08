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