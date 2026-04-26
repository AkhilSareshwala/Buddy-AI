import sqlite3
import os
import uuid
from pathlib import Path

DB_PATH = Path(__file__).parent / "buddyai.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            grade TEXT,
            streak INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            grade INTEGER NOT NULL,
            icon_emoji TEXT,
            display_order INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id TEXT PRIMARY KEY,
            subject_id TEXT REFERENCES subjects(id),
            chapter_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_summary TEXT,
            key_topics TEXT,
            is_published INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            subject TEXT,
            topic TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES sessions(id),
            user_id TEXT REFERENCES users(id),
            role TEXT CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chapter_sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES users(id),
            chapter_id TEXT REFERENCES chapters(id),
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, chapter_id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_attempts (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES users(id),
            chapter_id TEXT REFERENCES chapters(id),
            attempt_number INTEGER DEFAULT 1,
            status TEXT DEFAULT 'in_progress',
            score INTEGER,
            total_questions INTEGER DEFAULT 10,
            score_percent REAL,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_questions (
            id TEXT PRIMARY KEY,
            attempt_id TEXT REFERENCES test_attempts(id),
            question_number INTEGER NOT NULL,
            question_type TEXT NOT NULL,
            question_text TEXT NOT NULL,
            options TEXT,
            correct_answer TEXT NOT NULL,
            explanation TEXT,
            topic_tag TEXT,
            student_answer TEXT,
            is_correct INTEGER,
            answered_at TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weak_topics (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES users(id),
            chapter_id TEXT REFERENCES chapters(id),
            topic_name TEXT NOT NULL,
            times_wrong INTEGER DEFAULT 1,
            times_correct INTEGER DEFAULT 0,
            is_resolved INTEGER DEFAULT 0,
            last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, chapter_id, topic_name)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chapter_progress (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES users(id),
            chapter_id TEXT REFERENCES chapters(id),
            status TEXT DEFAULT 'not_started',
            messages_count INTEGER DEFAULT 0,
            best_score_percent REAL,
            last_accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, chapter_id)
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def get_user_by_id(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_chapter_by_id(chapter_id: str):
    print(f"[DEBUG] get_chapter_by_id called with: {chapter_id}")
    
    conn = get_connection()
    cursor = conn.cursor()
    row = None

    # 1. Try exact ID match first (works for both UUIDs and slug IDs like 'math-9')
    cursor.execute("SELECT * FROM chapters WHERE id = ?", (chapter_id,))
    row = cursor.fetchone()

    if not row:
        # 2. Try exact title match
        cursor.execute("SELECT * FROM chapters WHERE LOWER(title) = LOWER(?)", (chapter_id,))
        row = cursor.fetchone()

    if not row:
        # 3. Try partial title match
        cursor.execute("SELECT * FROM chapters WHERE LOWER(title) LIKE LOWER(?)", (f"%{chapter_id}%",))
        row = cursor.fetchone()

    conn.close()
    result = dict(row) if row else None
    print(f"[DEBUG] get_chapter_by_id returning: {result.get('title') if result else None}")
    return result

def get_chapter_by_title(title: str):
    print(f"[DEBUG] get_chapter_by_title called with: {title}")
    conn = get_connection()
    cursor = conn.cursor()
    # Try exact match first
    cursor.execute("SELECT * FROM chapters WHERE LOWER(title) = LOWER(?)", (title,))
    row = cursor.fetchone()
    if not row:
        # Try partial match
        cursor.execute("SELECT * FROM chapters WHERE LOWER(title) LIKE LOWER(?)", (f"%{title}%",))
        row = cursor.fetchone()
    conn.close()
    result = dict(row) if row else None
    print(f"[DEBUG] get_chapter_by_title returning: {result.get('title') if result else None}")
    return result

def get_any_chapter():
    print(f"[DEBUG] get_any_chapter called")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapters WHERE is_published = 1 LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    result = dict(row) if row else None
    print(f"[DEBUG] get_any_chapter returning: {result}")
    return result

def get_chapter_fuzzy(query: str):
    print(f"[DEBUG] get_chapter_fuzzy called with: {query}")
    conn = get_connection()
    cursor = conn.cursor()
    # Try partial match in title
    cursor.execute("SELECT * FROM chapters WHERE LOWER(title) LIKE LOWER(?)", (f"%{query}%",))
    row = cursor.fetchone()
    conn.close()
    result = dict(row) if row else None
    print(f"[DEBUG] get_chapter_fuzzy returning: {result}")
    return result

def get_weak_topics(student_id: str, chapter_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT topic_name FROM weak_topics 
        WHERE student_id = ? AND chapter_id = ? AND is_resolved = 0
    """, (student_id, chapter_id))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r)["topic_name"] for r in rows] if rows else []

def create_test_attempt(student_id: str, chapter_id: str):
    import uuid
    conn = get_connection()
    cursor = conn.cursor()
    attempt_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO test_attempts (id, student_id, chapter_id, attempt_number, started_at)
        VALUES (?, ?, ?, 1, datetime('now'))
    """, (attempt_id, student_id, chapter_id))
    conn.commit()
    conn.close()
    return attempt_id

def insert_test_questions(questions: list):
    conn = get_connection()
    cursor = conn.cursor()
    for q in questions:
        cursor.execute("""
            INSERT INTO test_questions (id, attempt_id, question_number, question_type, 
                question_text, options, correct_answer, explanation, topic_tag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            q.get("id"), q.get("attempt_id"), q.get("question_number"), q.get("question_type"),
            q.get("question_text"), str(q.get("options", {})).replace("'", '"'), q.get("correct_answer"),
            q.get("explanation"), q.get("topic_tag")
        ))
    conn.commit()
    conn.close()

def update_test_question(student_answer: str, is_correct: bool, question_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE test_questions 
        SET student_answer = ?, is_correct = ?, answered_at = datetime('now')
        WHERE id = ?
    """, (student_answer, 1 if is_correct else 0, question_id))
    conn.commit()
    conn.close()

def update_weak_topic(student_id: str, chapter_id: str, topic_name: str, is_correct: bool):
    conn = get_connection()
    cursor = conn.cursor()
    if not is_correct:
        cursor.execute("""
            INSERT OR REPLACE INTO weak_topics (id, student_id, chapter_id, topic_name, times_wrong, last_updated_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'))
        """, (str(uuid.uuid4()), student_id, chapter_id, topic_name))
    else:
        cursor.execute("""
            SELECT * FROM weak_topics WHERE student_id = ? AND chapter_id = ? AND topic_name = ?
        """, (student_id, chapter_id, topic_name))
        existing = cursor.fetchone()
        if existing:
            new_correct = existing["times_correct"] + 1
            is_resolved = 1 if new_correct >= 2 else 0
            cursor.execute("""
                UPDATE weak_topics SET times_correct = ?, is_resolved = ?, last_updated_at = datetime('now')
                WHERE id = ?
            """, (new_correct, is_resolved, existing["id"]))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_chapters()

def seed_chapters():
    import uuid
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as cnt FROM chapters")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    
    subjects = [
        ("math-9", "Mathematics", 9, "📐"),
        ("sci-9", "Science", 9, "🔬"),
        ("eng-9", "English", 9, "📖"),
        ("sst-9", "Social Science", 9, "🌍"),
        ("hin-9", "Hindi", 9, "🔤"),
        ("math-10", "Mathematics", 10, "📐"),
        ("sci-10", "Science", 10, "🔬"),
    ]
    
    for s in subjects:
        cursor.execute("INSERT OR IGNORE INTO subjects (id, name, grade, icon_emoji) VALUES (?, ?, ?, ?)", s)
    
    chapters = [
        ("math-9", "math-9", 1, "Number Systems", "Chapter 1: Number Systems\n\nIntroduction:\nThe number system is the foundation of mathematics. In this chapter, we learn about different types of numbers that we use in our daily lives. Numbers help us count, measure, and compare things around us. Understanding number systems is essential for solving mathematical problems.\n\nIn Class 9, we focus on real numbers, which include both rational and irrational numbers. Rational numbers can be written as a fraction (like 3/4 or 7/2), while irrational numbers cannot be expressed as a simple fraction (like sqrt(2) or pi).\n\nKey Concepts:\n1. Rational Numbers: Numbers that can be expressed as a fraction p/q where q is not zero. Examples: 3, -5, 2/7, 0.75\n2. Irrational Numbers: Numbers that cannot be written as a fraction. Examples: sqrt(2), sqrt(3), pi\n3. Real Numbers: All rational and irrational numbers together form real numbers\n4. Laws of Exponents: a^m x a^n = a^(m+n), (a^m)^n = a^(mn)\n\nSummary:\nReal numbers include both rational and irrational numbers. We learned to identify and represent them on the number line.", "Real numbers include rational and irrational numbers.", '["Number Systems","Rational Numbers","Irrational Numbers","Laws of Exponents"]'),
        ("sci-9", "sci-9", 1, "Matter in Our Surroundings", "Chapter 1: Matter in Our Surroundings\n\nIntroduction:\nEverything around us is made of matter. Matter is anything that has mass and occupies space. In this chapter, we explore the physical properties of matter and the three states in which it exists: solid, liquid, and gas.\n\nUnderstanding matter helps us explain everyday observations like ice melting, water boiling, and how clouds form. Matter behaves differently under different conditions of temperature and pressure.\n\nKey Concepts:\n1. Physical Nature of Matter: Matter is made up of particles (atoms and molecules) with spaces between them\n2. Three States of Matter: Solid (definite shape and volume), Liquid (definite volume, no definite shape), Gas (no definite shape or volume)\n3. Intermolecular Forces: Forces between particles that hold them together\n4. Effect of Heat: Adding heat increases particle movement, changing matter from solid to liquid to gas\n5. Evaporation: Process where liquid changes to gas at any temperature\n\nImportant Facts:\n- Matter is made of tiny particles\n- Particles are in continuous motion\n- Heat energy converts solid -> liquid -> gas\n- Evaporation causes cooling\n\nSummary:\nMatter exists in three states due to the arrangement and movement of particles.", "Matter exists in three states due to particle arrangement.", '["Physical Nature of Matter","Three States of Matter","Intermolecular Forces","Effect of Heat"]'),
    ]
    
    for c in chapters:
        cursor.execute("""
            INSERT OR IGNORE INTO chapters (id, subject_id, chapter_number, title, content, content_summary, key_topics)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (c[0], c[1], c[2], c[3], c[4], c[5], c[6]))
    
    conn.commit()
    conn.close()
    print("Chapters seeded successfully")