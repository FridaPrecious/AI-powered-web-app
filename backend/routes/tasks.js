const express = require('express');
const router = express.Router();
const pool = require('../db');
const { processRequest } = require('../services/aiService');
const { calculateRiskScore } = require('../services/riskScoring');

function generateTaskCode() {
    const prefix = 'TASK';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
}

router.post('/tasks', async (req, res) => {
    try {
        const { userInput, isReturningCustomer = false } = req.body;
        
        if (!userInput) {
            return res.status(400).json({ error: 'userInput required' });
        }
        
        const aiResult = await processRequest(userInput);
        const riskScore = calculateRiskScore(aiResult.intent, aiResult.entities, isReturningCustomer);
        
        const taskCode = generateTaskCode();
        const taskResult = await pool.query(
            `INSERT INTO tasks (task_code, intent, entities, risk_score, employee_assignment, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [taskCode, aiResult.intent, aiResult.entities, riskScore, aiResult.employee_assignment, 'Pending']
        );
        
        const taskId = taskResult.rows[0].id;
        
        for (let i = 0; i < aiResult.steps.length; i++) {
            await pool.query(
                'INSERT INTO steps (task_id, step_order, description) VALUES ($1, $2, $3)',
                [taskId, i + 1, aiResult.steps[i]]
            );
        }
        
        const whatsapp = aiResult.whatsapp_message.replace('[TASK_CODE]', taskCode);
        const email = aiResult.email_message.replace('[TASK_CODE]', taskCode);
        const sms = aiResult.sms_message.replace('[TASK_CODE]', taskCode);
        
        await pool.query(
            'INSERT INTO messages (task_id, type, content) VALUES ($1, $2, $3), ($1, $4, $5), ($1, $6, $7)',
            [taskId, 'whatsapp', whatsapp, 'email', email, 'sms', sms]
        );
        
        res.status(201).json({
            task_code: taskCode,
            intent: aiResult.intent,
            risk_score: riskScore,
            employee: aiResult.employee_assignment,
            status: 'Pending',
            steps: aiResult.steps,
            messages: { whatsapp, email, sms }
        });
        
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/tasks', async (req, res) => {
    try {
        const tasks = await pool.query(
            `SELECT t.*, 
                    array_agg(DISTINCT s.description) as steps,
                    jsonb_object_agg(m.type, m.content) as messages
             FROM tasks t
             LEFT JOIN steps s ON t.id = s.task_id
             LEFT JOIN messages m ON t.id = m.task_id
             GROUP BY t.id
             ORDER BY t.created_at DESC`
        );
        res.json(tasks.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NEW ENDPOINT: Get full task details for employees (includes steps and messages)
router.get('/tasks/full/:taskCode', async (req, res) => {
    try {
        const { taskCode } = req.params;
        
        // Get task basic info
        const taskResult = await pool.query('SELECT * FROM tasks WHERE task_code = $1', [taskCode]);
        
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const task = taskResult.rows[0];
        
        // Get steps for this task
        const stepsResult = await pool.query(
            'SELECT description FROM steps WHERE task_id = $1 ORDER BY step_order',
            [task.id]
        );
        
        // Get messages for this task
        const messagesResult = await pool.query(
            'SELECT type, content FROM messages WHERE task_id = $1',
            [task.id]
        );
        
        // Build messages object
        const messages = {};
        for (const msg of messagesResult.rows) {
            messages[msg.type] = msg.content;
        }
        
        // Return full task details
        res.json({
            task_code: task.task_code,
            intent: task.intent,
            status: task.status,
            risk_score: task.risk_score,
            employee_assignment: task.employee_assignment,
            created_at: task.created_at,
            updated_at: task.updated_at,
            entities: task.entities,
            steps: stepsResult.rows.map(s => s.description),
            messages: messages
        });
        
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/tasks/:taskCode/status', async (req, res) => {
    try {
        const { taskCode } = req.params;
        const { status } = req.body;
        
        if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const result = await pool.query(
            'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE task_code = $2 RETURNING *',
            [status, taskCode]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;