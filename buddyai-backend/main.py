import os
import json
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from db_client import (
    get_user_by_id,
    get_chapter_by_id,
    get_chapter_by_title,
    get_any_chapter,
    get_weak_topics,
    update_test_question,
    update_weak_topic,
    init_db,
    get_connection
)
from graph import run_chat_sync
from state import BuddyState

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_SECRET_KEY = os.getenv("API_SECRET_KEY", "buddyai_secret_key_123")

def verify_api_key(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.replace("Bearer ", "")
    
    if token != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return token

class ChatRequest(BaseModel):
    chapter_id: str
    chapter_title: Optional[str] = None
    messages: List[dict]
    student_id: str

class EvaluateRequest(BaseModel):
    question_id: str
    student_answer: str
    correct_answer: str
    topic_tag: str
    chapter_id: str
    student_id: str

class TestCompleteRequest(BaseModel):
    attempt_id: str
    chapter_id: str
    student_id: str

class TestGenerateRequest(BaseModel):
    chapter_id: str
    student_id: str

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
def health():
    return {"status": "ok", "message": "BuddyAI Backend running"}

@app.get("/chapters/{chapter_id}")
def get_chapter(chapter_id: str):
    chapter = get_chapter_by_id(chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter.get("key_topics"):
        try:
            chapter["key_topics"] = json.loads(chapter["key_topics"])
        except:
            chapter["key_topics"] = []
    else:
        chapter["key_topics"] = []
    
    return chapter

@app.post("/chat")
async def chat(body: ChatRequest, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")

    print(f"===== DEBUG START =====")
    print(f"Request: chapter_id='{body.chapter_id}', chapter_title='{body.chapter_title}'")
    
    # Priority 1: Use chapter_title if provided
    chapter = None
    if body.chapter_title:
        print(f"Trying title lookup: '{body.chapter_title}'")
        chapter = get_chapter_by_title(body.chapter_title)
        if chapter:
            print(f"FOUND by title: {chapter['title']}")
        else:
            print(f"Not found by title")
    
    # Priority 2: If title not found, try chapter_id
    if not chapter:
        print(f"Trying ID lookup: '{body.chapter_id}'")
        chapter = get_chapter_by_id(body.chapter_id)
        if chapter:
            print(f"FOUND by ID: {chapter['title']}")
        else:
            print(f"Not found by ID")
    
    # Priority 3: Last resort
    if not chapter:
        print(f"Using fallback chapter")
        chapter = get_any_chapter()
    
    print(f"===== FINAL CHAPTER: {chapter.get('title') if chapter else 'NOT FOUND'} =====")
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    weak_topics = get_weak_topics(body.student_id, body.chapter_id)
    
    key_topics = chapter.get("key_topics", [])
    if isinstance(key_topics, str):
        try:
            key_topics = json.loads(key_topics)
        except:
            key_topics = []

    state = BuddyState(
        student_id=body.student_id,
        chapter_id=body.chapter_id,
        chapter_title=chapter.get("title", ""),
        chapter_content=chapter.get("content", ""),
        key_topics=key_topics,
        weak_topics=weak_topics,
        messages=body.messages,
        mode="chat",
        session_id=None,
        test_attempt_id=None
    )

    try:
        result = await asyncio.to_thread(run_chat_sync, state)
        last_msg = result.get("messages", [])[-1] if result.get("messages") else {}
        return {
            "message": last_msg,
            "mode": result.get("mode", "chat"),
            "test_attempt_id": result.get("test_attempt_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.post("/test/evaluate")
async def evaluate(body: EvaluateRequest, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")

    is_correct = body.student_answer.upper() == body.correct_answer.upper()
    
    update_test_question(body.student_answer, is_correct, body.question_id)
    update_weak_topic(body.student_id, body.chapter_id, body.topic_tag, is_correct)
    
    return {"is_correct": is_correct}

@app.get("/test/attempt/{attempt_id}")
def get_test_questions(attempt_id: str, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, question_number, question_type, question_text, options, 
               correct_answer, explanation, topic_tag, student_answer, is_correct
        FROM test_questions 
        WHERE attempt_id = ?
        ORDER BY question_number
    """, (attempt_id,))
    rows = cursor.fetchall()
    conn.close()
    
    questions = []
    for row in rows:
        r = dict(row)
        if r.get("options"):
            try:
                r["options"] = json.loads(r["options"].replace("'", '"'))
            except:
                r["options"] = {}
        questions.append(r)
    
    return {"questions": questions}

@app.post("/test/complete")
async def complete_test(body: TestCompleteRequest, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct FROM test_questions WHERE attempt_id = ?",
                (body.attempt_id,))
    row = cursor.fetchone()
    total = row["total"] if row else 0
    correct = row["correct"] if row else 0
    score_percent = round((correct / total) * 100, 2) if total > 0 else 0
    
    cursor.execute("""
        UPDATE test_attempts SET status = 'completed', score = ?, score_percent = ?, completed_at = datetime('now')
        WHERE id = ?
    """, (correct, score_percent, body.attempt_id))
    
    cursor.execute("""
        INSERT OR REPLACE INTO chapter_progress (student_id, chapter_id, status, best_score_percent, last_accessed_at)
        VALUES (?, ?, 'tested', ?, datetime('now'))
        ON CONFLICT(student_id, chapter_id) DO UPDATE SET
            status = 'tested',
            best_score_percent = MAX(best_score_percent, excluded.best_score_percent),
            last_accessed_at = datetime('now')
    """, (body.student_id, body.chapter_id, score_percent))
    
    conn.commit()
    conn.close()
    
    return {"score": correct, "score_percent": score_percent, "total_questions": total}

@app.post("/test/generate")
async def generate_test(body: TestGenerateRequest, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    from db_client import create_test_attempt, insert_test_questions
    from nodes import generate_test_questions
    
    chapter = get_chapter_by_id(body.chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    key_topics = chapter.get("key_topics", [])
    if isinstance(key_topics, str):
        try:
            key_topics = json.loads(key_topics)
        except:
            key_topics = []
    
    attempt_id = create_test_attempt(body.student_id, body.chapter_id)
    questions = generate_test_questions(chapter.get("title", ""), chapter.get("content", ""), key_topics, attempt_id)
    
    return {"test_attempt_id": attempt_id, "questions": questions}

@app.get("/progress/{student_id}/{chapter_id}")
def get_progress(student_id: str, chapter_id: str, authorization: str = Header(...)):
    try:
        verify_api_key(authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM chapter_progress WHERE student_id = ? AND chapter_id = ?", 
                  (student_id, chapter_id))
    progress = cursor.fetchone()
    
    cursor.execute("SELECT topic_name, times_wrong, times_correct FROM weak_topics WHERE student_id = ? AND chapter_id = ?",
                 (student_id, chapter_id))
    weak = cursor.fetchall()
    
    conn.close()
    
    return {
        "progress": dict(progress) if progress else None,
        "weak_topics": [dict(w) for w in weak]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)