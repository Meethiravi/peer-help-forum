# Peer Help Forum

A peer-first triage system for programming education, where students can ask questions, get help from peers, and escalate to instructors when needed.

## Features

### For Students
- **Ask Questions**: Post programming questions with code snippets
- **Browse & Help**: Answer other students' questions to earn karma
- **AI-Evaluated Responses**: Responses are automatically evaluated for quality
- **Escalation**: Request instructor help when peer responses aren't enough
- **Karma System**: Track your helpfulness score

### For Instructors
- **Analytics Dashboard**: View response quality, resolution times, and misconceptions
- **All Questions**: Browse all forum activity (read-only)
- **Escalated Queue**: Answer questions that need instructor attention
- **Karma Leaderboard**: See which students are most helpful

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: SQLite
- **AI Judge**: Mock (can be configured for Gemini or Claude API)

## Project Structure

```
peer-help-forum/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── database.py       # SQLite database setup
│   ├── models.py         # Pydantic models
│   ├── ai_judge.py       # AI evaluation logic
│   └── requirements.txt  # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service
│   │   ├── context/      # React context (auth)
│   │   ├── App.jsx       # Main app with routing
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# Or with uvicorn for hot reload:
uvicorn main:app --reload --port 8000
```

The backend will start at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start at `http://localhost:3000`

## Default Users

The system comes pre-seeded with these users:

**Instructors:**
- Riya
- Amit

**Students:**
- Pooja
- Rahul
- Sneha
- Vikram
- Priya
- Arjun

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID

### Categories
- `GET /api/categories` - Get all categories

### Questions
- `GET /api/questions` - Get questions (with filters)
- `GET /api/questions/{id}` - Get single question
- `POST /api/questions` - Create question
- `POST /api/questions/{id}/escalate` - Escalate to instructor

### Responses
- `GET /api/questions/{id}/responses` - Get responses for question
- `POST /api/responses` - Create response (AI evaluated)

### Instructor Answers
- `GET /api/questions/{id}/instructor-answer` - Get instructor answer
- `POST /api/instructor-answers` - Create instructor answer

### Analytics
- `GET /api/analytics/karma-leaderboard` - Get karma rankings
- `GET /api/analytics/dashboard` - Get analytics data

## AI Judge Configuration

By default, the system uses a mock AI judge with heuristic rules. To use real AI:

```bash
# Configure via API
curl -X POST "http://localhost:8000/api/config/ai?api_key=YOUR_KEY&provider=gemini"
```

Supported providers:
- `mock` - Default, uses heuristics
- `gemini` - Google Gemini API
- `claude` - Anthropic Claude API

## AI Evaluation Criteria

Responses are evaluated against:
1. **Incorrect** - Contains wrong information
2. **Direct Solution** - Gives away the code/answer
3. **Uninformative** - Too vague to be useful
4. **Misfocused** - Doesn't address the actual problem
5. **Unclear** - Hard to understand

**Karma Awards:**
- +1 for helpful responses
- -1 for harmful responses (direct solutions, incorrect info)
- 0 for low-quality but not harmful

## Future Improvements

- Email notifications for escalations and instructor responses
- Real-time updates with WebSockets
- More sophisticated AI evaluation
- Integration with existing course management systems
- Code execution for testing solutions
- Peer rating system alongside AI evaluation

## Screenshots

(Add screenshots of your running application here)

## Based On

This project implements the "Peer-First Triage System" proposed for improving student help-seeking in programming education, drawing insights from:

1. **AVT (Assessment via Teaching)** - Malik et al., SIGCSE 2024
2. **Closing the Loop** - Phung et al., 2025

## License

MIT License
