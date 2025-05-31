// backend/routes/test.js
const express = require('express');
const db = require('../db'); // Your DB connection
const router = express.Router();

// Route to submit a user's answer for a question
router.post('/submit-answer', async (req, res) => {
    // You'll need to send userId and testSessionId from the frontend (e.g., from user context or session)
    // For now, let's use dummy values or assume you'll pass them from the client
    const { userId, testSessionId, questionId, userAnswer, questionType } = req.body;

    // Basic validation
    if (!userId || !testSessionId || !questionId || userAnswer === undefined || !questionType) {
        return res.status(400).json({ error: 'Missing required fields for answer submission.' });
    }

    try {
        // 1. Fetch the correct answer and marks for the question from the 'questions' table
        const [questionRow] = await new Promise((resolve, reject) => {
            const query = 'SELECT type, correct_answer, marks FROM questions WHERE question_id = ?';
            db.query(query, [questionId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!questionRow) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        const { type: dbQuestionType, correct_answer: dbCorrectAnswer, marks: questionMarks } = questionRow;

        let isCorrect = false;
        let marksObtained = 0;

        // 2. Determine if the user's answer is correct based on question type
        if (dbQuestionType === 'MCQ') {
            // For MCQ, userAnswer is typically an index (number)
            // dbCorrectAnswer is stored as JSON, so you might need to parse it if it's a string, or it will be directly a number
            const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer); // Assuming it's stored as a JSON string
            isCorrect = (userAnswer === parsedCorrectAnswer);
        } else if (dbQuestionType === 'MSQ') {
            // For MSQ, userAnswer is an array of selected indices
            // dbCorrectAnswer is an array of correct indices
            const userSelectionsSorted = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
            const correctSelectionsSorted = Array.isArray(JSON.parse(dbCorrectAnswer)) ? [...JSON.parse(dbCorrectAnswer)].sort() : [];
            isCorrect = JSON.stringify(userSelectionsSorted) === JSON.stringify(correctSelectionsSorted);
        } else if (dbQuestionType === 'NAT') {
            // For NAT, userAnswer is a string or number
            // dbCorrectAnswer is also a string or number
            // Be careful with string comparison for numbers (trimming, type conversion)
            const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer); // Assuming it's stored as a JSON string
            isCorrect = (String(userAnswer).trim() === String(parsedCorrectAnswer).trim());
        }

        if (isCorrect) {
            marksObtained = questionMarks;
        }

        // 3. Store the user's answer in the 'user_answers' table
        // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both new answers and updates to existing answers
        // This requires a UNIQUE constraint on (user_id, test_session_id, question_id) in your user_answers table.
        // Make sure you've added this unique constraint as discussed in the previous response's SQL.
        const insertUpdateQuery = `
            INSERT INTO user_answers (user_id, test_session_id, question_id, user_selected_option, is_correct, marks_obtained)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                user_selected_option = VALUES(user_selected_option),
                is_correct = VALUES(is_correct),
                marks_obtained = VALUES(marks_obtained),
                answered_at = NOW();
        `;
        const values = [
            userId,
            testSessionId,
            questionId,
            JSON.stringify(userAnswer), // Store userAnswer as a JSON string
            isCorrect,
            marksObtained
        ];

        await new Promise((resolve, reject) => {
            db.query(insertUpdateQuery, values, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log(`Answer saved/updated for User ${userId}, Question ${questionId}, Type ${dbQuestionType}`);
        return res.json({ message: 'Answer saved successfully', isCorrect, marksObtained });

    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;