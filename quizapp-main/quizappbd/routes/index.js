// routes/index.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for testSessionId generation
import authRouter from './auth.js';
import solutionsRouter from './solutions.js';

/**
 * Sets up all API routes for the Express application.
 * @param {express.Application} app - The Express application instance.
 * @param {object} db - The MySQL database connection pool.
 * @param {string} SECRET_KEY - The secret key used for JWT signing and verification.
 */
const setupRoutes = (app, db, SECRET_KEY) => {
    // Make db available to all routes via app.locals
    app.locals.db = db;
    
    // Mount the auth router
    app.use('/api/auth', authRouter);
    
    // Mount the solutions router
    app.use('/api/solutions', solutionsRouter);

    /**
     * Middleware to verify admin JWT token.
     * Extracts token from Authorization header (Bearer token).
     * Verifies the token using the SECRET_KEY.
     * If valid, decodes the admin info and attaches it to req.admin.
     * If invalid, sends a 401 Unauthorized response.
     */
    const verifyAdmin = (req, res, next) => {
        // Get the token from the Authorization header (e.g., "Bearer YOUR_TOKEN")
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            // Verify the token using the provided SECRET_KEY
            const decoded = jwt.verify(token, SECRET_KEY);
            req.admin = decoded; // Attach the decoded admin payload to the request object
            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Invalid token.' });
        }
    };

    // --- API Endpoints ---

    // Root/Health Check Endpoint
    app.get('/', (req, res) => {
        res.status(200).json({ message: 'Welcome to the Quiz Application API!' });
    });

    // Admin Login Endpoint
    app.post('/api/admin/login', async (req, res) => {
        console.log('--- Admin Login Attempt ---');
        console.log('Received req.body:', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            console.log('Error: Username or password missing in request body.');
            return res.status(400).json({ message: 'Username and password are required' });
        }

        try {
            console.log(`Attempting to query 'admin' table for username: "${username}"`);
            // Fetch admin user by username from the database
            const [rows] = await db.execute('SELECT id, username, password AS hashed_password FROM admin WHERE username = ?', [username]);
            
            console.log('DB Query Result (rows):', rows);

            if (rows.length === 0) {
                console.log('Login failed: No admin user found with that username.');
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            const adminUser = rows[0];
            console.log('Admin user found in DB:', adminUser);
            console.log('Plain password from frontend:', password);
            console.log('Hashed password from DB:', adminUser.hashed_password);

            // Compare provided password with hashed password
            const isPasswordValid = await bcrypt.compare(password, adminUser.hashed_password);
            console.log('Bcrypt comparison result (isPasswordValid):', isPasswordValid);

            if (isPasswordValid) {
                console.log('Admin login successful for username:', adminUser.username);
                // Generate JWT token for admin
                const token = jwt.sign({ adminId: adminUser.id }, SECRET_KEY, { expiresIn: "2h" });
                
                res.json({
                    message: 'Admin login successful',
                    token: token,
                    admin: {
                        id: adminUser.id,
                        username: adminUser.username
                    }
                });
            } else {
                console.log('Login failed: Password mismatch for username:', username);
                res.status(401).json({ message: 'Invalid admin credentials' });
            }
        } catch (error) {
            console.error('Error during admin login process:', error);
            res.status(500).json({ message: 'Server error during admin login. Please try again later.' });
        }
    });

    // --- Admin Tests Management Endpoints ---

    // Get all tests for admin dashboard (fetch from database)
    app.get('/api/admin/tests', verifyAdmin, async (req, res) => {
        try {
            const [tests] = await db.execute('SELECT id, name, description, status, created_at, type FROM tests');
            res.json(tests);
        } catch (error) {
            console.error('Error fetching tests:', error);
            res.status(500).json({ message: 'Error fetching tests' });
        }
    });

    // Create new test (currently just logs and returns success)
    app.post('/api/admin/tests', verifyAdmin, async (req, res) => {
        try {
            const { name, description } = req.body;
            
            if (!name || !description) {
                return res.status(400).json({ message: 'Name and description are required' });
            }
            
            console.log('New test created:', { name, description });
            
            // In a real application, you would insert this into a 'tests' table
            res.json({ message: "Test created successfully", id: Date.now() });
        } catch (error) {
            console.error('Error creating test:', error);
            res.status(500).json({ message: 'Error creating test' });
        }
    });

    // Delete test (currently just logs and returns success)
    app.delete('/api/admin/tests/:id', verifyAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            
            console.log('Test deleted:', id);
            
            // In a real application, you would delete this from a 'tests' table
            res.json({ message: "Test deleted successfully" });
        } catch (error) {
            console.error('Error deleting test:', error);
            res.status(500).json({ message: 'Error deleting test' });
        }
    });

    // Update test (edit)
    app.put('/api/admin/tests/:id', verifyAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            if (!name || !description) {
                return res.status(400).json({ message: 'Name and description are required' });
            }
            // Update the test in the database
            await db.execute('UPDATE tests SET name = ?, description = ? WHERE id = ?', [name, description, id]);
            res.json({ message: 'Test updated successfully' });
        } catch (error) {
            console.error('Error updating test:', error);
            res.status(500).json({ message: 'Error updating test' });
        }
    });

    // Test Email Endpoint (for development/testing purposes, consider removing in production)
    app.post('/api/test-email', async (req, res) => {
        try {
            const { email, name } = req.body;
            
            if (!email || !name) {
                return res.status(400).json({ message: 'Email and name are required' });
            }
            
            // Configure nodemailer transporter using environment variables
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Using Gmail service
                auth: {
                    user: process.env.EMAIL_USER, // Sender email address
                    pass: process.env.EMAIL_PASS, // Sender email password/app-specific password
                },
            });

            // Email content
            const mailOptions = {
                from: `"nDMatrix Team" <${process.env.EMAIL_USER}>`,
                to: email, // Recipient email
                subject: 'Test Submission Confirmation - nDMatrix',
                html: `
                    <p>Dear ${name},</p>
                    <p>Your test has been successfully submitted.</p>
                    <p><strong>Course Name:</strong> GATE - 2025</p>
                    <p><strong>Test Name:</strong> GATE 2025 Mock Test</p>
                    <br>
                    <p>Best Regards,</p>
                    <p>nDMatrix</p>
                `,
            };

            await transporter.sendMail(mailOptions); // Send the email
            console.log(`Test email sent to: ${email}`);
            
            res.json({ message: 'Test email sent successfully' });
        } catch (error) {
            console.error('Error sending test email:', error);
            res.status(500).json({ message: 'Error sending test email' });
        }
    });

    // Fetch all questions with their options
    app.get('/api/questions', async (req, res) => {
        try {
            // Fetch all questions
            const [questions] = await db.execute('SELECT question_id, type, question_text, solution, marks, correct_nat_answer FROM questions');
            // Fetch all options
            const [options] = await db.execute('SELECT option_id, question_id, option_text, is_correct FROM options');

            // Map options to their respective questions
            const questionsWithOptions = questions.map(q => {
                const questionOptions = options.filter(opt => opt.question_id === q.question_id)
                                                .map(opt => ({
                                                    option_id: opt.option_id,
                                                    option_text: opt.option_text,
                                                    is_correct: opt.is_correct === 1 // Convert tinyint(1) to boolean
                                                }));
                // Find correct answer(s)
                let correct_answer = null;
                if (q.type === 'MCQ') {
                    const correctOpt = questionOptions.find(opt => opt.is_correct);
                    correct_answer = correctOpt ? { option_id: correctOpt.option_id, option_text: correctOpt.option_text } : null;
                } else if (q.type === 'MSQ') {
                    correct_answer = questionOptions.filter(opt => opt.is_correct).map(opt => ({ option_id: opt.option_id, option_text: opt.option_text }));
                } else if (q.type === 'NAT') {
                    correct_answer = q.correct_nat_answer;
                }
                return {
                    ...q,
                    options: questionOptions,
                    correct_answer
                };
            });

            res.json({ questions: questionsWithOptions });
        } catch (error) {
            console.error('Error fetching questions:', error);
            res.status(500).json({ message: 'Error fetching questions from database' });
        }
    });

    // Start a test session (track start time)
    app.post('/api/start-test-session', async (req, res) => {
        const { userId, testId, testSessionId } = req.body;

        if (!userId || !testId || !testSessionId) {
            return res.status(400).json({ message: 'Missing required data for starting test session' });
        }

        try {
            // Ensure the 'test_sessions' table exists. This is idempotent.
            await db.execute(`
                CREATE TABLE IF NOT EXISTS test_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    test_id VARCHAR(50) NOT NULL,
                    test_session_id VARCHAR(255) NOT NULL UNIQUE,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    submitted_at TIMESTAMP NULL,
                    time_taken_seconds INT NULL,
                    INDEX idx_user_session (user_id, test_session_id)
                )
            `);

            // Insert a new test session record or update existing if testSessionId already exists
            await db.execute(
                `INSERT INTO test_sessions (user_id, test_id, test_session_id, started_at) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE started_at = NOW()`, // Update timestamp if session already exists
                [userId, testId, testSessionId]
            );

            res.json({ message: 'Test session started successfully' });
        } catch (error) {
            console.error('Error starting test session:', error);
            res.status(500).json({ message: 'Error starting test session' });
        }
    });

    // Endpoint for submitting user answers to the database
    app.post('/api/submit-answers', async (req, res) => {
        const { userId, testId, testSessionId, userAnswers, timeTaken } = req.body;

        if (!userId || !testId || !testSessionId || !Array.isArray(userAnswers)) {
            return res.status(400).json({ message: 'Missing required submission data' });
        }

        let connection; // Declare connection variable for transaction management
        try {
            connection = await db.getConnection(); // Get a connection from the pool
            await connection.beginTransaction(); // Start a transaction

            // SQL query to insert user answers
            const insertQuery = `
                INSERT INTO user_answers
                (user_id, test_session_id, question_id, user_selected_option, is_correct, marks_obtained, answered_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            // Process each submitted answer (if any)
            if (userAnswers.length > 0) {
                for (const answer of userAnswers) {
                    const { question_id, user_selected_option } = answer;

                    // Fetch question details to determine correctness and marks
                    const [questionRows] = await connection.execute(
                        'SELECT type, solution, marks, correct_nat_answer FROM questions WHERE question_id = ?',
                        [question_id]
                    );

                    if (questionRows.length === 0) {
                        console.warn(`Question ID ${question_id} not found. Skipping this answer.`);
                        continue; // Skip to next answer if question not found
                    }

                    const question = questionRows[0];
                    let isCorrect = false;
                    let marksObtained = 0;
                    let finalUserSelectedOption = null;

                    // Logic for evaluating correctness based on question type
                    if (question.type === 'MCQ') {
                        const [correctOptionRows] = await connection.execute(
                            'SELECT option_id FROM options WHERE question_id = ? AND is_correct = 1',
                            [question_id]
                        );
                        const correctOptionId = correctOptionRows.length > 0 ? correctOptionRows[0].option_id : null;
                        isCorrect = (user_selected_option == correctOptionId); // Use loose equality as user_selected_option might be string
                        finalUserSelectedOption = user_selected_option;

                    } else if (question.type === 'MSQ') {
                        const [correctOptionRows] = await connection.execute(
                            'SELECT option_id FROM options WHERE question_id = ? AND is_correct = 1',
                            [question_id]
                        );
                        const correctOptionIds = correctOptionRows.map(opt => opt.option_id).sort();
                        
                        // Parse user answer (comma-separated string from frontend)
                        let selectedOptionsArray = [];
                        if (typeof user_selected_option === 'string' && user_selected_option) {
                            selectedOptionsArray = user_selected_option.split(',').map(Number).sort();
                        }

                        // Check if all correct options are selected and no incorrect ones
                        isCorrect = (
                            correctOptionIds.length > 0 &&
                            correctOptionIds.length === selectedOptionsArray.length &&
                            correctOptionIds.every((id, index) => id === selectedOptionsArray[index])
                        );
                        finalUserSelectedOption = user_selected_option;

                    } else if (question.type === 'NAT') {
                        const userAnswer = String(user_selected_option || '').trim();
                        const correctAnswer = String(question.correct_nat_answer || '').trim();
                        isCorrect = (userAnswer !== '' && userAnswer === correctAnswer);
                        finalUserSelectedOption = String(user_selected_option);
                    }

                    // Assign marks based on correctness and question type
                    if (isCorrect) {
                        marksObtained = question.marks; // Full marks for correct answer
                    } else {
                        // Negative marking only for MCQ questions
                        if (question.type === 'MCQ') {
                            marksObtained = -(question.marks / 3); // Negative 1/3rd of marks for incorrect MCQ
                        } else {
                            marksObtained = 0; // No negative marking for MSQ/NAT
                        }
                    }

                    // Insert the user's answer into the database
                    await connection.execute(
                        insertQuery,
                        [userId, testSessionId, question_id, finalUserSelectedOption, isCorrect, marksObtained]
                    );
                }
            } else {
                console.log("No answers provided - submitting empty test session");
            }

            // Update the test session with submission time and total time taken
            if (timeTaken) {
                await connection.execute(
                    `UPDATE test_sessions 
                     SET submitted_at = NOW(), time_taken_seconds = ? 
                     WHERE test_session_id = ? AND user_id = ?`,
                    [timeTaken, testSessionId, userId]
                );
            }

            await connection.commit(); // Commit the transaction if all operations are successful
            
            // --- Send email notification after successful submission (non-blocking) ---
            try {
                // Fetch user details for email notification
                const [userRows] = await connection.execute(
                    'SELECT full_name, email FROM users WHERE id = ?',
                    [userId]
                );
                
                if (userRows.length > 0) {
                    const { full_name, email } = userRows[0];
                    
                    // Determine test name based on testId (can be fetched from a 'tests' table in a real app)
                    let testName = "Test - 1"; // Default
                    let courseName = "GATE - 2025"; // Default
                    
                    if (testId == 101) {
                        testName = "GATE 2025 Mock Test";
                        courseName = "GATE - 2025";
                    }
                    
                    // Configure nodemailer for sending email
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        },
                    });

                    // Email content for submission confirmation
                    const mailOptions = {
                        from: `"nDMatrix Team" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: 'Test Submission Confirmation - nDMatrix',
                        html: `
                            <p>Dear ${full_name},</p>
                            <p>Your test has been successfully submitted.</p>
                            <p><strong>Course Name:</strong> ${courseName}</p>
                            <p><strong>Test Name:</strong> ${testName}</p>
                            <br>
                            <p>Best Regards,</p>
                            <p>nDMatrix</p>
                        `,
                    };

                    await transporter.sendMail(mailOptions);
                    console.log(`Test submission confirmation email sent to: ${email}`);
                }
            } catch (emailError) {
                // Log email error but do not fail the main API response
                console.error('Error sending test submission email:', emailError);
            }
            
            res.status(200).json({ message: 'Answers submitted successfully' });

        } catch (error) {
            if (connection) await connection.rollback(); // Rollback transaction on error
            console.error('Error submitting answers:', error);
            res.status(500).json({ message: 'Failed to submit answers due to a server error. Please try again.' });
        } finally {
            if (connection) connection.release(); // Always release connection back to the pool
        }
    });

    // Performance Report Endpoint for a specific user and test session
    app.get('/api/results/:userId/:testSessionId', async (req, res) => {
        const { userId, testSessionId } = req.params;

        console.log("Backend: Received request for performance report with:");
        console.log("  userId (from params):", userId);
        console.log("  testSessionId (from params):", testSessionId);

        try {
            // Fetch test session duration
            const [testSessionRows] = await db.execute(
                `SELECT time_taken_seconds, started_at, submitted_at 
                 FROM test_sessions 
                 WHERE user_id = ? AND test_session_id = ?`,
                [userId, testSessionId]
            );

            let timeTakenSeconds = 0;
            let timeTakenFormatted = "00:00:00";
            
            if (testSessionRows.length > 0) {
                timeTakenSeconds = testSessionRows[0].time_taken_seconds || 0;
                // Format total seconds into HH:MM:SS
                const hours = Math.floor(timeTakenSeconds / 3600);
                const minutes = Math.floor((timeTakenSeconds % 3600) / 60);
                const seconds = timeTakenSeconds % 60;
                timeTakenFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            // Fetch all questions from the database to compare against user answers
            const [allQuestions] = await db.execute(
                `SELECT
                    q.question_id,
                    q.type AS question_type,
                    q.question_text,
                    q.solution AS question_solution,
                    q.marks AS total_marks_possible,
                    q.correct_nat_answer
                FROM
                    questions q
                ORDER BY q.question_id ASC`
            );

            if (allQuestions.length === 0) {
                console.warn(`No questions found in the database.`);
                return res.status(404).json({ message: 'No questions found in the database to generate a report.' });
            }

            // Fetch user's answers for this specific test session
            const [userAnswersRaw] = await db.execute(
                `SELECT
                    question_id,
                    user_selected_option,
                    is_correct,
                    marks_obtained
                FROM
                    user_answers
                WHERE
                    user_id = ? AND test_session_id = ?`,
                [userId, testSessionId]
            );

            // Create a map for quick lookup of user answers by question ID
            const userAnswersMap = new Map();
            userAnswersRaw.forEach(ans => userAnswersMap.set(ans.question_id, ans));

            // Get all unique question IDs to fetch their options efficiently
            const questionIds = allQuestions.map(q => q.question_id);
            let optionsMap = {};

            // Fetch all options related to the questions retrieved
            if (questionIds.length > 0) {
                const placeholders = questionIds.map(() => '?').join(','); // Create placeholders for IN clause
                const [allOptions] = await db.execute(
                    `SELECT option_id, question_id, option_text, is_correct FROM options WHERE question_id IN (${placeholders})`,
                    questionIds // Pass array of question IDs for parameterization
                );
                // Organize options by question_id for easy access
                allOptions.forEach(opt => {
                    if (!optionsMap[opt.question_id]) {
                        optionsMap[opt.question_id] = [];
                    }
                    optionsMap[opt.question_id].push(opt);
                });
            }

            // Format results for the frontend, combining question, user answer, and correct answer info
            const formattedResults = allQuestions.map(question => {
                const userAnswer = userAnswersMap.get(question.question_id);

                let correctOptionsText = [];
                let userSelectedOptionsText = [];
                let correctNATAnswer = null;
                let userNATAnswer = null;
                let isCorrect = false;
                let marksObtained = 0;
                let hasUserAnswered = false; // Flag to indicate if the user provided any answer for this question

                // Determine correct options/NAT answer based on question type
                if (question.question_type === 'MCQ' || question.question_type === 'MSQ') {
                    const questionOptions = optionsMap[question.question_id] || [];
                    const correctOptions = questionOptions.filter(opt => opt.is_correct === 1);
                    correctOptionsText = correctOptions.map(opt => opt.option_text);
                } else if (question.question_type === 'NAT') {
                    correctNATAnswer = question.correct_nat_answer;
                }
                
                // Process user's submitted answer if available
                if (userAnswer) {
                    hasUserAnswered = true;
                    isCorrect = userAnswer.is_correct === 1;
                    marksObtained = Number(userAnswer.marks_obtained) || 0;

                    if (question.question_type === 'MCQ' || question.question_type === 'MSQ') {
                        const questionOptions = optionsMap[question.question_id] || [];
                        let selectedOptionIds = [];
                        try {
                            // Handle various formats of user_selected_option (number, string, stringified array)
                            if (typeof userAnswer.user_selected_option === 'string') {
                                try {
                                    // Try parsing as JSON array (for MSQ)
                                    selectedOptionIds = JSON.parse(userAnswer.user_selected_option);
                                    if (!Array.isArray(selectedOptionIds)) {
                                        // If it was a stringified single number (for MCQ)
                                        selectedOptionIds = [selectedOptionIds];
                                    }
                                } catch (parseError) {
                                    // If it's a plain string that's not JSON (e.g., "123" for single MCQ)
                                    selectedOptionIds = [Number(userAnswer.user_selected_option)];
                                }
                            } else if (typeof userAnswer.user_selected_option === 'number') {
                                selectedOptionIds = [userAnswer.user_selected_option];
                            } else if (Array.isArray(userAnswer.user_selected_option)) {
                                selectedOptionIds = userAnswer.user_selected_option;
                            }
                        } catch (e) {
                               console.error(`Error parsing user_selected_option for question ${question.question_id}:`, e);
                               selectedOptionIds = []; // Default to empty if parsing fails
                        }

                        // Map selected option IDs to their text for display
                        userSelectedOptionsText = questionOptions
                            .filter(opt => selectedOptionIds.includes(opt.option_id))
                            .map(opt => opt.option_text);
                    } else if (question.question_type === 'NAT') {
                        userNATAnswer = userAnswer.user_selected_option; // Directly use NAT answer
                    }
                }

                // Return a structured object for each question
                return {
                    question_id: question.question_id,
                    question_text: question.question_text,
                    question_type: question.question_type,
                    options: optionsMap[question.question_id] || [], // All options for the question
                    user_selected_option: userAnswer ? userAnswer.user_selected_option : null, // Raw value from DB
                    user_selected_options_text: userSelectedOptionsText, // Formatted text for MCQ/MSQ
                    user_nat_answer: userNATAnswer, // Formatted text for NAT
                    is_correct: isCorrect, // Whether user answered correctly
                    marks_obtained: marksObtained,
                    total_marks_possible: question.total_marks_possible,
                    correct_options_text: correctOptionsText, // Formatted text for MCQ/MSQ correct answers
                    correct_nat_answer: correctNATAnswer, // Formatted text for NAT correct answer
                    solution: question.question_solution, // Solution for the question
                    has_user_answered: hasUserAnswered // Indicate if the user attempted this question
                };
            });

            // Calculate overall summary statistics
            const totalQuestionsCount = formattedResults.length;
            const totalMarksPossibleOverall = formattedResults.reduce((sum, q) => sum + q.total_marks_possible, 0);
            const totalMarksObtainedOverall = formattedResults.reduce((sum, q) => sum + q.marks_obtained, 0);
            
            const rightMarksTotal = formattedResults
                .filter(q => q.is_correct)
                .reduce((sum, q) => sum + q.marks_obtained, 0);

            // Calculate negative marks from incorrect MCQ answers
            const negativeMarksTotal = formattedResults
                .filter(q => q.question_type === 'MCQ' && !q.is_correct && q.has_user_answered)
                .reduce((sum, q) => sum + Math.abs(q.marks_obtained), 0);
            
            const maxMarks = totalMarksPossibleOverall;
            const scorePercentageOverall = maxMarks > 0
                ? (totalMarksObtainedOverall / maxMarks) * 100
                : 0;

            res.json({
                testSessionId: testSessionId,
                totalQuestions: totalQuestionsCount,
                correctAnswersCount: formattedResults.filter(q => q.is_correct).length,
                incorrectAnswersCount: formattedResults.filter(q => !q.is_correct && q.has_user_answered).length,
                unansweredQuestionsCount: formattedResults.filter(q => !q.has_user_answered).length,
                totalMarksObtained: totalMarksObtainedOverall,
                maxMarks: maxMarks,
                timeTaken: timeTakenFormatted,
                rightMarks: rightMarksTotal,
                negativeMarks: negativeMarksTotal,
                results: formattedResults,
                overallScore: scorePercentageOverall
            });

        } catch (error) {
            console.error('Error fetching comprehensive test results:', error);
            res.status(500).json({ message: 'Error fetching results due to a server error.' });
        }
    });

    // Endpoint for fetching a user's historical test sessions (summary)
    app.get('/api/user/:userId/test-sessions', async (req, res) => {
        const { userId } = req.params;
        try {
            // Select distinct test sessions for a given user, ordered by submission time
            const [testSessions] = await db.execute(
                `SELECT DISTINCT ts.test_session_id, ts.user_id, ts.submitted_at AS answered_at, ts.test_id
                 FROM test_sessions ts
                 WHERE ts.user_id = ? AND ts.submitted_at IS NOT NULL
                 ORDER BY ts.submitted_at DESC`,
                [userId]
            );
            res.json({ testSessions });
        } catch (error) {
            console.error('Error fetching user test sessions:', error);
            res.status(500).json({ message: 'Error fetching test sessions.' });
        }
    });

    // --- NEW: Change Password Endpoint ---
    app.post('/api/change-password', async (req, res) => {
        const { userId, currentPassword, newPassword } = req.body;

        // Basic input validation
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields (userId, currentPassword, newPassword) are required.' });
        }

        try {
            // 1. Fetch user's current hashed password from the database
            const [rows] = await db.execute('SELECT password AS hashed_password FROM users WHERE id = ?', [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const user = rows[0];

            // 2. Verify the provided current password against the stored hashed password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.hashed_password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }

            // 3. Hash the new password before storing it
            const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 salt rounds is a good default

            // 4. Update the user's password in the database with the new hashed password
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

            res.status(200).json({ message: 'Password updated successfully.' });

        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Server error updating password. Please try again later.' });
        }
    });

    // Admin: Get all registered users
    app.get('/api/admin/users', verifyAdmin, async (req, res) => {
        try {
            const [users] = await db.execute('SELECT id, full_name, email, phone, college_name, college_id, profile_pic, id_card, created_at FROM users ORDER BY created_at DESC');
            res.json({ users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Error fetching users from database' });
        }
    });

    // Admin: Change password
    app.post('/api/admin/change-password', verifyAdmin, async (req, res) => {
        const { adminId, currentPassword, newPassword } = req.body;
        if (!adminId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        try {
            // Fetch current hashed password
            const [rows] = await db.execute('SELECT password FROM admin WHERE id = ?', [adminId]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Admin not found.' });
            }
            const admin = rows[0];
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.execute('UPDATE admin SET password = ? WHERE id = ?', [hashedPassword, adminId]);
            res.status(200).json({ message: 'Password updated successfully.' });
        } catch (error) {
            console.error('Error changing admin password:', error);
            res.status(500).json({ message: 'Server error updating password.' });
        }
    });

    // Admin: Get count of test submissions
    app.get('/api/admin/submissions-count', verifyAdmin, async (req, res) => {
        try {
            const [rows] = await db.execute('SELECT COUNT(*) AS count FROM test_sessions WHERE submitted_at IS NOT NULL');
            res.json({ count: rows[0].count });
        } catch (error) {
            console.error('Error fetching submissions count:', error);
            res.status(500).json({ message: 'Error fetching submissions count' });
        }
    });
};

export default setupRoutes;
