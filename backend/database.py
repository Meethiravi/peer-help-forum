import sqlite3
from datetime import datetime
from typing import Optional
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "forum.db")

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK(role IN ('student', 'instructor')),
            karma INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Categories table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)
    
    # Create Questions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            code_snippet TEXT,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'open' CHECK(status IN ('open', 'escalated', 'closed')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)
    
    # Create Responses table (peer responses)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            responder_id INTEGER NOT NULL,
            concept_involved TEXT NOT NULL,
            hint_guidance TEXT NOT NULL,
            what_to_try_next TEXT,
            ai_rating TEXT CHECK(ai_rating IN ('helpful', 'unhelpful')),
            ai_reason TEXT,
            is_visible INTEGER DEFAULT 1,
            karma_awarded INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES questions(id),
            FOREIGN KEY (responder_id) REFERENCES users(id)
        )
    """)
    
    # Create InstructorAnswers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instructor_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            instructor_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES questions(id),
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()

def seed_data():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    
    # Seed Users (Students and Instructors)
    users = [
        ("Riya", "instructor"),
        ("Amit", "instructor"),
        ("Pooja", "student"),
        ("Rahul", "student"),
        ("Sneha", "student"),
        ("Vikram", "student"),
        ("Priya", "student"),
        ("Arjun", "student"),
    ]
    cursor.executemany("INSERT INTO users (name, role) VALUES (?, ?)", users)
    
    # Seed Categories
    categories = [
        ("Variables",),
        ("Loops",),
        ("Functions",),
        ("Data Structures",),
        ("Conditionals",),
        ("File Handling",),
        ("Error Handling",),
        ("Object-Oriented Programming",),
    ]
    cursor.executemany("INSERT INTO categories (name) VALUES (?)", categories)
    
    conn.commit()
    conn.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    init_database()
    seed_data()
    print("Database initialized and seeded!")
