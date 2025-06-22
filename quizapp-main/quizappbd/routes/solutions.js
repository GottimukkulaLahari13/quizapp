// backend/routes/solutions.js (Create this file or add to your main API routes)

import express from 'express';

const router = express.Router();

// GET /api/solutions/:testSessionId
router.get('/:testSessionId', async (req, res) => {
    const { testSessionId } = req.params;
    const db = req.app.locals.db; // Get db from app locals

    try {
        // Fetch all questions and their options for this test session
        const [questionsRows] = await db.execute(`
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
                    user_answer: null
                });
            }
            const question = questionsMap.get(row.question_id);
            if (row.option_id) {
                question.options.push({
                    option_id: row.option_id,
                    option_text: row.option_text,
                    is_correct_option: row.is_correct === 1 // Convert to boolean
                });
            }
        });

        // Fetch user's answers for this session
        const [userAnswersRows] = await db.execute(
            `SELECT question_id, user_selected_option FROM user_answers WHERE test_session_id = ?`,
            [testSessionId]
        );

        const userAnswersMap = new Map();
        userAnswersRows.forEach(row => {
            let selectedOption = row.user_selected_option;
            
            // Handle different formats of user_selected_option
            if (typeof selectedOption === 'string') {
                try {
                    // Try to parse as JSON first
                    const parsed = JSON.parse(selectedOption);
                    selectedOption = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    // If not JSON, check if it's comma-separated
                    if (selectedOption.includes(',')) {
                        selectedOption = selectedOption.split(',').map(s => s.trim());
                    } else {
                        selectedOption = [selectedOption];
                    }
                }
            } else if (typeof selectedOption === 'number') {
                selectedOption = [selectedOption.toString()];
            } else if (Array.isArray(selectedOption)) {
                selectedOption = selectedOption.map(s => s.toString());
            } else {
                selectedOption = [];
            }
            
            userAnswersMap.set(row.question_id, selectedOption);
        });

        // Combine data and include all questions (not just attempted ones)
        const finalQuestionsData = [];
        for (const [questionId, question] of questionsMap.entries()) {
            const questionData = { ...question };
            questionData.user_answer = userAnswersMap.get(questionId) || null;
            finalQuestionsData.push(questionData);
        }

        // Sort questions by question_id
        finalQuestionsData.sort((a, b) => a.question_id - b.question_id);

        res.json(finalQuestionsData);

    } catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ message: 'Internal server error while fetching solutions.' });
    }
});

export default router;