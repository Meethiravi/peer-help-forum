from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    student = "student"
    instructor = "instructor"

class QuestionStatus(str, Enum):
    open = "open"
    escalated = "escalated"
    closed = "closed"

class AIRating(str, Enum):
    helpful = "helpful"
    unhelpful = "unhelpful"

# User Models
class UserBase(BaseModel):
    name: str
    role: UserRole

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    karma: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    user_id: int

# Category Models
class Category(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

# Question Models
class QuestionCreate(BaseModel):
    category_id: int
    title: str
    code_snippet: Optional[str] = None
    description: str

class QuestionUpdate(BaseModel):
    status: QuestionStatus

class Question(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    title: str
    code_snippet: Optional[str] = None
    description: str
    status: QuestionStatus
    created_at: datetime
    response_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# Response Models (Peer Responses)
class ResponseCreate(BaseModel):
    question_id: int
    concept_involved: str
    hint_guidance: str
    what_to_try_next: Optional[str] = None

class Response(BaseModel):
    id: int
    question_id: int
    responder_id: int
    responder_name: Optional[str] = None
    concept_involved: str
    hint_guidance: str
    what_to_try_next: Optional[str] = None
    ai_rating: Optional[AIRating] = None
    ai_reason: Optional[str] = None
    is_visible: bool
    karma_awarded: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Instructor Answer Models
class InstructorAnswerCreate(BaseModel):
    question_id: int
    content: str

class InstructorAnswer(BaseModel):
    id: int
    question_id: int
    instructor_id: int
    instructor_name: Optional[str] = None
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Evaluation Models
class AIEvaluation(BaseModel):
    rating: AIRating
    reason: str
    karma_change: int

# Analytics Models
class KarmaLeaderboard(BaseModel):
    user_id: int
    name: str
    karma: int
    helpful_responses: int
    unhelpful_responses: int

class ResponseQualityStats(BaseModel):
    total_responses: int
    helpful_count: int
    unhelpful_count: int
    helpful_percentage: float

class CategoryStats(BaseModel):
    category_id: int
    category_name: str
    question_count: int
    avg_responses_per_question: float
    avg_resolution_time_hours: Optional[float] = None

class CommonMisconception(BaseModel):
    category_name: str
    misconception: str
    occurrence_count: int

class AnalyticsDashboard(BaseModel):
    response_quality: ResponseQualityStats
    avg_resolution_time_hours: Optional[float]
    category_stats: List[CategoryStats]
    common_misconceptions: List[CommonMisconception]
