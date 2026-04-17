# Vunoh Global - Diaspora Assistant

AI-powered web application helping Kenyans living abroad manage tasks back home including money transfers, service hiring, and document verification.

## Tech Stack

- Backend: Node.js, Express
- Database: PostgreSQL
- Frontend: Vanilla HTML, CSS, JavaScript
- AI: Groq API (Llama 3.1)

## Setup Instructions

### Prerequisites
- Node.js installed
- PostgreSQL installed and running
- Groq API key from console.groq.com (free)

### Database Setup
```bash
psql -U postgres
CREATE DATABASE diaspora_assistant;
\c diaspora_assistant
\i database/schema.sql
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add database password and Groq API key to .env
node server.js
```

### Frontend Setup
```bash
cd frontend
python -m http.server 8000
```

### Access Application
Open browser to `http://localhost:8000`

## Features

- AI intent recognition from natural language
- Risk scoring based on amount, urgency, and document type
- Task creation and tracking
- Three message formats: WhatsApp, Email, SMS
- Auto-assignment to Finance, Operations, or Legal teams
- Dashboard with status updates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tasks | Create new task |
| GET | /api/tasks | Get all tasks |
| PATCH | /api/tasks/:code/status | Update task status |

## Decisions I Made and Why

### AI Tools Used
- Groq API (Llama 3.1) - Chose for free tier availability
- GitHub Copilot - Used for boilerplate code generation

### System Prompt Design
- Specified exact intent categories for consistent outputs
- Included entity extraction for amount, recipient, location
- Requested JSON format for reliable parsing

### One Override of AI Suggestion
AI suggested OpenAI GPT-4 with paid credits. I overrode this and switched to Groq's free Llama 3.1 API because the project has zero budget.

### One Thing That Did Not Work
Supabase cloud database gave DNS resolution errors (ENOTFOUND). I switched to local PostgreSQL which eliminated network issues and provided reliable connections.

## Sample Tasks Included

5 sample tasks covering send_money, hire_service, and verify_document intents with complete steps, messages, and risk scores.

