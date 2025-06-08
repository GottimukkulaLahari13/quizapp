// backend/routes/solutions.js (Create this file or add to your main API routes)

const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your database connection pool

// GET /api/solutions/:testSessionId
router.get('/:testSessionId', async (req, res) => {
    const { testSessionId } = req.params;

    try {
        // Step 1: Get all unique question_ids associated with this test_session_id from user_answers.
        // This assumes that ALL questions for a test session *are* recorded in user_answers,
        // even if not attempted, or that there's another table linking test sessions to questions.
        // If not all questions are in user_answers, you'll need a 'test_questions' table
        // or a way to get the full list of questions for a 'test_id'.
        // For now, let's assume all relevant questions will show up in user_answers.
        // If some questions were entirely skipped and not recorded in user_answers,
        // you'd need a `test_questions` table to get the complete list of questions for a given `test_id`.
        // For robustness, I'm fetching all questions that exist and then trying to map user answers to them.

        // Get all questions from the 'questions' table.
        // If you have a 'tests' and 'test_questions' table, you'd filter by test_id here.
        // For demonstration, we'll fetch all questions for now and match them.
        // **IMPORTANT**: You need a way to link `testSessionId` to the actual set of questions
        // for that test. A `test_questions` table is highly recommended.
        // For this example, let's assume we fetch all questions that were part of *any* test session where an answer was recorded.
        // A better approach would be to fetch questions linked to `test_id` derived from `testSessionId`.

        // Let's assume `testSessionId` implies a set of questions.
        // We'll fetch all questions that exist and then try to get their details.
        // For the sake of getting all 65, we'll make a more comprehensive fetch.

        // Fetch all questions and their options
        const [questionsRows] = await pool.query(`
            SELECT
                q.question_id,
                q.type,
                q.question_text,
                q.solution,
                q.marks,
                q.correct_nat_answer,
                o.option_id,
                o.option_text,
                o.is_correct
            FROM
                questions q
            LEFT JOIN
                options o ON q.question_id = o.question_id
            ORDER BY q.question_id, o.option_id
        `);

        // Group options by question
        const questionsMap = new Map();
        questionsRows.forEach(row => {
            if (!questionsMap.has(row.question_id)) {
                questionsMap.set(row.question_id, {
                    question_id: row.question_id,
                    type: row.type,
                    question_text: row.question_text,
                    solution: row.solution,
                    marks: row.marks,
                    correct_nat_answer: row.correct_nat_answer,
                    options: [],
                    correct_answer: null, // Will be option_id(s) for MCQ/MSQ
                    user_answer: null // Will be user_selected_option from user_answers
                });
            }
            const question = questionsMap.get(row.question_id);
            if (row.option_id) { // Only add option if it exists (for MCQ/MSQ)
                question.options.push({
                    option_id: row.option_id,
                    option_text: row.option_text,
                    is_correct_option: row.is_correct // This property is useful for frontend
                });
                if (row.is_correct) {
                    if (question.type === 'MSQ') {
                        if (!Array.isArray(question.correct_answer)) {
                            question.correct_answer = [];
                        }
                        question.correct_answer.push(row.option_id);
                    } else if (question.type === 'MCQ') {
                        question.correct_answer = row.option_id;
                    }
                }
            } else if (question.type === 'NAT') {
                question.correct_answer = row.correct_nat_answer; // For NAT, correct_answer is correct_nat_answer
            }
        });

        // Step 2: Fetch user's answers for this session
        const [userAnswersRows] = await pool.query(
            `SELECT question_id, user_selected_option FROM user_answers WHERE test_session_id = ?`,
            [testSessionId]
        );

        const userAnswersMap = new Map();
        userAnswersRows.forEach(row => {
            let selectedOption = row.user_selected_option;
            // If MSQ, user_selected_option might be a comma-separated string, convert to array
            if (questionsMap.get(row.question_id)?.type === 'MSQ' && typeof selectedOption === 'string') {
                selectedOption = selectedOption.split(','); // Assuming comma-separated
            }
            userAnswersMap.set(row.question_id, selectedOption);
        });

        // Step 3: Combine all data
        const finalQuestionsData = Array.from(questionsMap.values()).map(question => {
            const userSelected = userAnswersMap.get(question.question_id);
            // Ensure user_answer for MSQ is an array, even if not answered
            if (question.type === 'MSQ' && userSelected === undefined) {
                question.user_answer = [];
            } else {
                 question.user_answer = userSelected !== undefined ? userSelected : null;
            }
            return question;
        });

        // Sort questions by their question_id or another logical order
        finalQuestionsData.sort((a, b) => {
            // Assuming question_id can be compared numerically or alphabetically
            if (typeof a.question_id === 'number' && typeof b.question_id === 'number') {
                return a.question_id - b.question_id;
            }
            return a.question_id.localeCompare(b.question_id);
        });


        res.json(finalQuestionsData);

    } catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ message: 'Internal server error while fetching solutions.' });
    }
});

module.exports = router;