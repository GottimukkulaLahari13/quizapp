// backend/routes/questions.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust if path is different

// GET /api/questions
// Fetches all questions (MCQ/NAT) excluding correct answers
router.get('/questions', async (req, res) => {
  try {
    // Fetch all questions
    const [questions] = await db.execute(
      'SELECT question_id, question_text, type, marks FROM questions'
    );

    const questionIds = questions.map((q) => q.question_id);

    // Fetch all options for those questions
    let options = [];
    if (questionIds.length > 0) {
      // Use the proper syntax for IN clause with mysql2: expand array or use placeholders
      const placeholders = questionIds.map(() => '?').join(',');
      const [optionsData] = await db.query(
        `SELECT question_id, option_id, option_text FROM options WHERE question_id IN (${placeholders})`,
        questionIds
      );
      options = optionsData;
    }

    // Format the result
    const formattedQuestions = questions.map((q) => {
      return {
        question_id: q.question_id,
        question_text: q.question_text,
        type: q.type,
        marks: q.marks,
        options: options
          .filter((opt) => opt.question_id === q.question_id)
          .map((opt) => ({
            option_id: opt.option_id,
            option_text: opt.option_text,
          })),
      };
    });

    res.status(200).json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

module.exports = router;
