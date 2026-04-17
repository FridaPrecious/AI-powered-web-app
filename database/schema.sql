
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_code VARCHAR(20) UNIQUE NOT NULL,
    intent VARCHAR(50) NOT NULL,
    entities JSONB NOT NULL,
    risk_score INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    employee_assignment VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Steps table
CREATE TABLE steps (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    description TEXT NOT NULL
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- whatsapp, email, sms
    content TEXT NOT NULL
);

-- Sample tasks (5 tasks with complete data)
INSERT INTO tasks (task_code, intent, entities, risk_score, status, employee_assignment) VALUES
('TASK-001', 'send_money', '{"amount": 50000, "recipient": "John Mwangi", "urgency": "high"}', 75, 'Completed', 'Finance'),
('TASK-002', 'hire_service', '{"service_type": "cleaner", "location": "Nairobi", "urgency": "medium"}', 30, 'In Progress', 'Operations'),
('TASK-003', 'verify_document', '{"document_type": "land_title", "owner": "Mary Wanjiku"}', 85, 'Pending', 'Legal'),
('TASK-004', 'send_money', '{"amount": 10000, "recipient": "Peter Odhiambo", "urgency": "low"}', 20, 'Completed', 'Finance'),
('TASK-005', 'hire_service', '{"service_type": "lawyer", "location": "Mombasa", "urgency": "high"}', 60, 'Pending', 'Operations');

-- Insert steps for sample tasks
INSERT INTO steps (task_id, step_order, description) VALUES
(1, 1, 'Verify sender identity'), (1, 2, 'Confirm recipient details'), (1, 3, 'Process transfer'), (1, 4, 'Send confirmation'),
(2, 1, 'Find available cleaner'), (2, 2, 'Schedule appointment'), (2, 3, 'Confirm with customer'),
(3, 1, 'Receive document copy'), (3, 2, 'Verify with land registry'), (3, 3, 'Generate report'), (3, 4, 'Send results'),
(4, 1, 'Verify identity'), (4, 2, 'Process transfer'), (4, 3, 'Send receipt'),
(5, 1, 'Find lawyer'), (5, 2, 'Schedule consultation'), (5, 3, 'Send confirmation');

-- Insert messages for sample tasks
INSERT INTO messages (task_id, type, content) VALUES
(1, 'whatsapp', ' Money sent to John Mwangi! Amount: 50,000 KES. Task: TASK-001 '),
(1, 'email', 'Dear Customer,\n\nYour money transfer of 50,000 KES to John Mwangi has been completed.\nTask Code: TASK-001\nStatus: Completed\n\nThank you for using Vunoh Global.'),
(1, 'sms', 'TASK-001: 50K KES sent to John Mwangi. Completed.'),
(2, 'whatsapp', ' Cleaner scheduled in Nairobi. Task: TASK-002. We''ll update you!'),
(2, 'email', 'Dear Customer,\n\nYour service request for a cleaner in Nairobi is In Progress.\nTask Code: TASK-002\n\nWe will notify you once matched.'),
(2, 'sms', 'TASK-002: Cleaner request in progress. Nairobi.'),
(3, 'whatsapp', ' Land title verification for Mary Wanjiku. Task: TASK-003. High risk - processing.'),
(3, 'email', 'Dear Customer,\n\nDocument verification for land title (Owner: Mary Wanjiku) is Pending.\nTask Code: TASK-003\nRisk Score: 85\n\nWe will update you within 48 hours.'),
(3, 'sms', 'TASK-003: Land title verification pending. High risk.'),
(4, 'whatsapp', ' 10,000 KES sent to Peter Odhiambo. Task: TASK-004 '),
(4, 'email', 'Dear Customer,\n\nYour transfer of 10,000 KES to Peter Odhiambo is Completed.\nTask Code: TASK-004\n\nThank you.'),
(4, 'sms', 'TASK-004: 10K KES sent to Peter. Complete.'),
(5, 'whatsapp', ' Lawyer requested in Mombasa. Task: TASK-005. Finding matches...'),
(5, 'email', 'Dear Customer,\n\nYour lawyer request in Mombasa is Pending.\nTask Code: TASK-005\nRisk Score: 60\n\nWe will match you shortly.'),
(5, 'sms', 'TASK-005: Lawyer request pending. Mombasa.');




