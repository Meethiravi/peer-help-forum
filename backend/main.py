from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import os

from database import get_connection, init_database, seed_data
from models import (
    User, UserCreate, UserLogin, UserRole,
    Category,
    Question, QuestionCreate, QuestionUpdate, QuestionStatus,
    Response, ResponseCreate,
    InstructorAnswer, InstructorAnswerCreate,
    KarmaLeaderboard, AnalyticsDashboard, ResponseQualityStats,
    CategoryStats, CommonMisconception
)
from ai_judge import get_ai_judge, configure_ai_judge

#Initialize FastAPI app
app = FastAPI(
    title="Peer Help Forum API",
    description="API for the peer-first triage system in programming education",
    version="1.0.0"
)

#Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Initialize database
@app.on_event("startup")
def startup_event():
    init_database()
    seed_data()

# ============== USER ENDPOINTS ==============

@app.get("/api/users", response_model=List[User])
def get_all_users():
    """Get all users (for login dropdown)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY role, name")
    users = cursor.fetchall()
    conn.close()
    return [dict(u) for u in users]

@app.get("/api/users/{user_id}", response_model=User)
def get_user(user_id: int):
    """Get a specific user by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@app.post("/api/users", response_model=User)
def create_user(user: UserCreate):
    """Create a new user."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, role) VALUES (?, ?)",
            (user.name, user.role.value)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        new_user = cursor.fetchone()
        conn.close()
        return dict(new_user)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

# ============== CATEGORY ENDPOINTS ==============

@app.get("/api/categories", response_model=List[Category])
def get_all_categories():
    """Get all categories."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name")
    categories = cursor.fetchall()
    conn.close()
    return [dict(c) for c in categories]

# ============== QUESTION ENDPOINTS ==============

@app.get("/api/questions", response_model=List[Question])
def get_questions(
    status: Optional[QuestionStatus] = None,
    category_id: Optional[int] = None,
    student_id: Optional[int] = None,
    exclude_student_id: Optional[int] = None
):
    """Get questions with optional filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT q.*, u.name as student_name, c.name as category_name,
        (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.id AND r.is_visible = 1) as response_count
        FROM questions q
        JOIN users u ON q.student_id = u.id
        JOIN categories c ON q.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND q.status = ?"
        params.append(status.value)
    if category_id:
        query += " AND q.category_id = ?"
        params.append(category_id)
    if student_id:
        query += " AND q.student_id = ?"
        params.append(student_id)
    if exclude_student_id:
        query += " AND q.student_id != ?"
        params.append(exclude_student_id)
    
    query += " ORDER BY q.created_at DESC"
    
    cursor.execute(query, params)
    questions = cursor.fetchall()
    conn.close()
    return [dict(q) for q in questions]

@app.get("/api/questions/{question_id}", response_model=Question)
def get_question(question_id: int):
    """Get a specific question by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT q.*, u.name as student_name, c.name as category_name,
        (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.id AND r.is_visible = 1) as response_count
        FROM questions q
        JOIN users u ON q.student_id = u.id
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
    """, (question_id,))
    question = cursor.fetchone()
    conn.close()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return dict(question)

@app.post("/api/questions", response_model=Question)
def create_question(question: QuestionCreate, student_id: int = Query(...)):
    """Create a new question."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify student exists and is a student
    cursor.execute("SELECT role FROM users WHERE id = ?", (student_id,))
    user = cursor.fetchone()
    if not user or user['role'] != 'student':
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    cursor.execute("""
        INSERT INTO questions (student_id, category_id, title, code_snippet, description)
        VALUES (?, ?, ?, ?, ?)
    """, (student_id, question.category_id, question.title, question.code_snippet, question.description))
    conn.commit()
    question_id = cursor.lastrowid
    
    # Fetch the created question
    cursor.execute("""
        SELECT q.*, u.name as student_name, c.name as category_name, 0 as response_count
        FROM questions q
        JOIN users u ON q.student_id = u.id
        JOIN categories c ON q.category_id = c.id
        WHERE q.id = ?
    """, (question_id,))
    new_question = cursor.fetchone()
    conn.close()
    return dict(new_question)

@app.patch("/api/questions/{question_id}/status")
def update_question_status(question_id: int, status: QuestionStatus):
    """Update question status (escalate or close)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE questions SET status = ? WHERE id = ?", (status.value, question_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    if affected == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": f"Question status updated to {status.value}"}

@app.post("/api/questions/{question_id}/escalate")
def escalate_question(question_id: int):
    """Escalate a question to instructors (student clicks 'I still need help')."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE questions SET status = 'escalated' WHERE id = ?", (question_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    if affected == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question escalated to instructors"}

# ============== RESPONSE ENDPOINTS ==============

@app.get("/api/questions/{question_id}/responses", response_model=List[Response])
def get_responses(question_id: int, include_hidden: bool = False):
    """Get all responses for a question."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT r.*, u.name as responder_name
        FROM responses r
        JOIN users u ON r.responder_id = u.id
        WHERE r.question_id = ?
    """
    if not include_hidden:
        query += " AND r.is_visible = 1"
    query += " ORDER BY r.created_at ASC"
    
    cursor.execute(query, (question_id,))
    responses = cursor.fetchall()
    conn.close()
    return [dict(r) for r in responses]

@app.post("/api/responses", response_model=Response)
def create_response(response: ResponseCreate, responder_id: int = Query(...)):
    """Create a new peer response (automatically evaluated by AI)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify responder exists and is a student
    cursor.execute("SELECT role FROM users WHERE id = ?", (responder_id,))
    user = cursor.fetchone()
    if not user or user['role'] != 'student':
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid responder ID")
    
    # Verify question exists
    cursor.execute("""
        SELECT q.*, c.name as category_name 
        FROM questions q 
        JOIN categories c ON q.category_id = c.id 
        WHERE q.id = ?
    """, (response.question_id,))
    question = cursor.fetchone()
    if not question:
        conn.close()
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if responder is not the question author
    if question['student_id'] == responder_id:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot respond to your own question")
    
    # Evaluate response using AI judge
    ai_judge = get_ai_judge()
    evaluation = ai_judge.evaluate_response(
        question_title=question['title'],
        question_description=question['description'],
        code_snippet=question['code_snippet'] or "",
        concept_involved=response.concept_involved,
        hint_guidance=response.hint_guidance,
        what_to_try_next=response.what_to_try_next or ""
    )
    
    # Insert response
    is_visible = 1 if evaluation.rating.value == "helpful" else 0
    cursor.execute("""
        INSERT INTO responses 
        (question_id, responder_id, concept_involved, hint_guidance, what_to_try_next,
         ai_rating, ai_reason, is_visible, karma_awarded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        response.question_id, responder_id,
        response.concept_involved, response.hint_guidance, response.what_to_try_next,
        evaluation.rating.value, evaluation.reason, is_visible, evaluation.karma_change
    ))
    conn.commit()
    response_id = cursor.lastrowid
    
    # Update responder's karma
    cursor.execute(
        "UPDATE users SET karma = karma + ? WHERE id = ?",
        (evaluation.karma_change, responder_id)
    )
    conn.commit()
    
    # Fetch the created response
    cursor.execute("""
        SELECT r.*, u.name as responder_name
        FROM responses r
        JOIN users u ON r.responder_id = u.id
        WHERE r.id = ?
    """, (response_id,))
    new_response = cursor.fetchone()
    conn.close()
    
    return dict(new_response)

@app.get("/api/users/{user_id}/responses", response_model=List[Response])
def get_user_responses(user_id: int):
    """Get all responses made by a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, u.name as responder_name
        FROM responses r
        JOIN users u ON r.responder_id = u.id
        WHERE r.responder_id = ?
        ORDER BY r.created_at DESC
    """, (user_id,))
    responses = cursor.fetchall()
    conn.close()
    return [dict(r) for r in responses]

# ============== INSTRUCTOR ANSWER ENDPOINTS ==============

@app.get("/api/questions/{question_id}/instructor-answer")
def get_instructor_answer(question_id: int):
    """Get instructor answer for a question."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ia.*, u.name as instructor_name
        FROM instructor_answers ia
        JOIN users u ON ia.instructor_id = u.id
        WHERE ia.question_id = ?
    """, (question_id,))
    answer = cursor.fetchone()
    conn.close()
    if not answer:
        return None
    return dict(answer)

@app.post("/api/instructor-answers", response_model=InstructorAnswer)
def create_instructor_answer(answer: InstructorAnswerCreate, instructor_id: int = Query(...)):
    """Create an instructor answer and close the question."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify instructor exists and is an instructor
    cursor.execute("SELECT role FROM users WHERE id = ?", (instructor_id,))
    user = cursor.fetchone()
    if not user or user['role'] != 'instructor':
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid instructor ID")
    
    # Insert answer
    cursor.execute("""
        INSERT INTO instructor_answers (question_id, instructor_id, content)
        VALUES (?, ?, ?)
    """, (answer.question_id, instructor_id, answer.content))
    conn.commit()
    answer_id = cursor.lastrowid
    
    # Close the question
    cursor.execute("UPDATE questions SET status = 'closed' WHERE id = ?", (answer.question_id,))
    conn.commit()
    
    # Fetch the created answer
    cursor.execute("""
        SELECT ia.*, u.name as instructor_name
        FROM instructor_answers ia
        JOIN users u ON ia.instructor_id = u.id
        WHERE ia.id = ?
    """, (answer_id,))
    new_answer = cursor.fetchone()
    conn.close()
    
    return dict(new_answer)

# ============== ANALYTICS ENDPOINTS ==============

@app.get("/api/analytics/karma-leaderboard", response_model=List[KarmaLeaderboard])
def get_karma_leaderboard():
    """Get karma leaderboard for all students."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            u.id as user_id,
            u.name,
            u.karma,
            (SELECT COUNT(*) FROM responses r WHERE r.responder_id = u.id AND r.ai_rating = 'helpful') as helpful_responses,
            (SELECT COUNT(*) FROM responses r WHERE r.responder_id = u.id AND r.ai_rating = 'unhelpful') as unhelpful_responses
        FROM users u
        WHERE u.role = 'student'
        ORDER BY u.karma DESC
    """)
    leaderboard = cursor.fetchall()
    conn.close()
    return [dict(l) for l in leaderboard]

@app.get("/api/analytics/dashboard", response_model=AnalyticsDashboard)
def get_analytics_dashboard():
    """Get comprehensive analytics for instructors."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Response quality stats
    cursor.execute("SELECT COUNT(*) as total FROM responses")
    total_responses = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as count FROM responses WHERE ai_rating = 'helpful'")
    helpful_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM responses WHERE ai_rating = 'unhelpful'")
    unhelpful_count = cursor.fetchone()['count']
    
    helpful_percentage = (helpful_count / total_responses * 100) if total_responses > 0 else 0
    
    response_quality = ResponseQualityStats(
        total_responses=total_responses,
        helpful_count=helpful_count,
        unhelpful_count=unhelpful_count,
        helpful_percentage=round(helpful_percentage, 1)
    )
    
    # Average resolution time (for closed questions)
    cursor.execute("""
        SELECT AVG(
            (julianday(ia.created_at) - julianday(q.created_at)) * 24
        ) as avg_hours
        FROM questions q
        JOIN instructor_answers ia ON q.id = ia.question_id
        WHERE q.status = 'closed'
    """)
    avg_resolution = cursor.fetchone()['avg_hours']
    
    # Category stats
    cursor.execute("""
        SELECT 
            c.id as category_id,
            c.name as category_name,
            COUNT(q.id) as question_count,
            COALESCE(AVG(
                (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.id)
            ), 0) as avg_responses_per_question
        FROM categories c
        LEFT JOIN questions q ON c.id = q.category_id
        GROUP BY c.id, c.name
        ORDER BY question_count DESC
    """)
    category_stats = [dict(c) for c in cursor.fetchall()]
    
    # Common misconceptions (based on unhelpful response patterns by category)
    
    cursor.execute("""
        SELECT 
            c.name as category_name,
            r.ai_reason as misconception,
            COUNT(*) as occurrence_count
        FROM responses r
        JOIN questions q ON r.question_id = q.id
        JOIN categories c ON q.category_id = c.id
        WHERE r.ai_rating = 'unhelpful'
        GROUP BY c.name, r.ai_reason
        HAVING COUNT(*) > 0
        ORDER BY occurrence_count DESC
        LIMIT 10
    """)
    misconceptions = [dict(m) for m in cursor.fetchall()]
    
    conn.close()
    
    return AnalyticsDashboard(
        response_quality=response_quality,
        avg_resolution_time_hours=round(avg_resolution, 1) if avg_resolution else None,
        category_stats=category_stats,
        common_misconceptions=misconceptions
    )

@app.get("/api/analytics/all-responses", response_model=List[Response])
def get_all_responses(include_hidden: bool = True):
    """Get all responses (for instructor review)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT r.*, u.name as responder_name
        FROM responses r
        JOIN users u ON r.responder_id = u.id
    """
    if not include_hidden:
        query += " WHERE r.is_visible = 1"
    query += " ORDER BY r.created_at DESC"
    
    cursor.execute(query)
    responses = cursor.fetchall()
    conn.close()
    return [dict(r) for r in responses]

# ============== AI CONFIGURATION ENDPOINT ==============

@app.post("/api/config/ai")
def configure_ai(api_key: str, provider: str = "gemini"):
    """Configure the AI judge (gemini or claude)."""
    if provider not in ["gemini", "claude", "mock"]:
        raise HTTPException(status_code=400, detail="Provider must be 'gemini' or 'mock'")
    configure_ai_judge(api_key=api_key, provider=provider)
    return {"message": f"AI judge configured to use {provider}"}

# ============== HEALTH CHECK ==============

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
