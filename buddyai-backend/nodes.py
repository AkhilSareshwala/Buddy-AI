import os
import json
import uuid
from state import BuddyState
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.messages import HumanMessage, SystemMessage

API_KEY = os.getenv("HUGGINGFACE_API_KEY")
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2"

llm = HuggingFaceEndpoint(
    endpoint_url=f"https://api-inference.huggingface.co/models/{MODEL_ID}",
    huggingfacehub_api_token=API_KEY,
    temperature=0.7,
    max_new_tokens=1024,
)

async def intent_router(state: BuddyState) -> BuddyState:
    messages = state.get("messages", [])
    if not messages:
        state["mode"] = "chat"
        return state
    
    last_msg = messages[-1].get("content", "").lower()
    
    test_keywords = ["test me", "take a test", "quiz", "start test", "give me a test", "exam practice"]
    summary_keywords = ["summarize", "summary", "key points", "short notes", "quick revision", "give me notes"]
    
    if any(kw in last_msg for kw in test_keywords):
        state["mode"] = "test"
    elif any(kw in last_msg for kw in summary_keywords):
        state["mode"] = "summary"
    else:
        state["mode"] = "chat"
    
    return state

async def chat_node(state: BuddyState) -> BuddyState:
    messages = state.get("messages", [])
    chapter_title = state.get("chapter_title", "")
    chapter_content = state.get("chapter_content", "")
    key_topics = state.get("key_topics", [])
    weak_topics = state.get("weak_topics", [])
    
    system_prompt = f"""You are Buddy, a friendly AI tutor for Standard 9 and 10 students (ages 14-15).
You must answer ONLY using the knowledge base below. Do not use outside knowledge.
If asked something not in the knowledge base say: 'That topic is not in this chapter.'
Use simple language, be encouraging, give examples. Never discuss violence, politics, or off-topic content.

CHAPTER: {chapter_title}
KNOWLEDGE BASE: {chapter_content}
{('WEAK TOPICS TO REVISIT: ' + ', '.join(weak_topics)) if weak_topics else ''}"""
    
    chat_messages = [SystemMessage(content=system_prompt)]
    for msg in messages:
        if msg.get("role") == "user":
            chat_messages.append(HumanMessage(content=msg.get("content", "")))
    
    try:
        response = llm.invoke(chat_messages)
        response_text = response.content if hasattr(response, 'content') else str(response)
    except Exception as e:
        print(f"LLM Error: {e}")
        response_text = None
    
    if not response_text or "couldn't" in response_text.lower():
        response_text = f"""Based on the chapter:

{chapter_content[:1500]}

Ask me if you'd like to know more about any specific topic!"""
    
    messages.append({"role": "assistant", "content": response_text})
    state["messages"] = messages
    return state

async def summary_node(state: BuddyState) -> BuddyState:
    messages = state.get("messages", [])
    chapter_title = state.get("chapter_title", "")
    chapter_content = state.get("chapter_content", "")
    
    user_msg = messages[-1].get("content", "").lower() if messages else ""
    
    topic_extracted = None
    for kw in ["irrational", "rational", "polynomial", "quadratic", "atom", "molecule", "french", "revolution"]:
        if kw in user_msg:
            topic_extracted = kw
            break
    
    target_content = chapter_content
    if topic_extracted:
        target_content = f"Focus on the topic: {topic_extracted}\n\n{chapter_content}"
    
    system_prompt = f"""You are Buddy. Using ONLY the knowledge base, provide: 
1) A 3-line plain summary, 
2) 5 key concepts each in bold with one sentence explanation, 
3) 3 likely exam questions with answers. 
Be concise and student-friendly.

CHAPTER: {chapter_title}
KNOWLEDGE BASE: {target_content}"""
    
    chat_messages = [SystemMessage(content=system_prompt)]
    
    try:
        response = llm.invoke(chat_messages)
        response_text = response.content if hasattr(response, 'content') else str(response)
    except Exception as e:
        response_text = f"Sorry, I couldn't generate that summary. Please try again."
    
    messages.append({"role": "assistant", "content": response_text})
    state["messages"] = messages
    return state

async def test_node(state: BuddyState) -> BuddyState:
    from db_client import db_client, create_test_attempt, insert_test_questions
    
    messages = state.get("messages", [])
    chapter_title = state.get("chapter_title", "")
    chapter_content = state.get("chapter_content", "")
    key_topics = state.get("key_topics", [])
    student_id = state.get("student_id", "")
    chapter_id = state.get("chapter_id", "")
    
    topics_str = ", ".join(key_topics) if key_topics else "main topics"
    
    system_prompt = f"""You are a test generator for Standard 9 and 10 students. 
Using ONLY this chapter content, generate exactly 10 questions: 7 MCQ (options A/B/C/D) and 3 True/False.
Cover all key topics: {topics_str}.
Return ONLY a valid JSON array. Each item must have: 
- id (generate unique uuid string)
- question_number (1-10)
- question_type ('mcq' or 'true_false')
- question_text (string)
- options (dict with A/B/C/D for MCQ, A=True B=False for T/F)
- correct_answer (string letter)
- explanation (string)
- topic_tag (string matching one of the key_topics)
No extra text, no markdown, only raw JSON array."""

    try:
        response = llm.invoke([SystemMessage(content=system_prompt)])
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            questions = json.loads(json_str)
            
            attempt_id = create_test_attempt(student_id, chapter_id)
            
            for q in questions:
                q["attempt_id"] = attempt_id
                if "id" not in q:
                    q["id"] = str(uuid.uuid4())
            
            insert_test_questions(questions)
            
            state["test_attempt_id"] = attempt_id
            messages.append({
                "role": "assistant", 
                "content": "TEST_GENERATED",
                "questions": questions
            })
        else:
            messages.append({"role": "assistant", "content": "Sorry, couldn't generate test questions. Please try again."})
    except Exception as e:
        messages.append({"role": "assistant", "content": f"Sorry, I couldn't create the test. Error: {str(e)}"})
    
    state["messages"] = messages
    return state

def generate_test_questions(chapter_title: str, chapter_content: str, key_topics: list, attempt_id: str):
    import json
    
    topics_str = ", ".join(key_topics) if key_topics else "main topics from this chapter"
    
    system_prompt = f"""You are a test generator for Standard 9 and 10 students. 
Generate exactly 10 questions from this chapter: 7 MCQ (A/B/C/D) and 3 True/False.
Return ONLY a valid JSON array with this exact structure:
[{{"question_number": 1, "question_type": "mcq", "question_text": "...", "options": {{"A":"...","B":"...","C":"...","D":"..."}}, "correct_answer": "A", "explanation": "...", "topic_tag": "..."}}]
Cover these topics: {topics_str}
No extra text, only JSON array."""

    try:
        response = llm.invoke([SystemMessage(content=system_prompt)])
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            questions = json.loads(json_str)
        else:
            questions = get_fallback_questions(chapter_title, topics_str, attempt_id)
    except Exception as e:
        print(f"Test generation error: {e}")
        questions = get_fallback_questions(chapter_title, topics_str, attempt_id)
    
    for i, q in enumerate(questions):
        q["attempt_id"] = attempt_id
        q["question_number"] = q.get("question_number") or (i + 1)
        if "id" not in q:
            q["id"] = str(uuid.uuid4())
    
    return questions

def get_fallback_questions(chapter_title: str, topics: str, attempt_id: str):
    import json
    return [
        {"question_number": 1, "question_type": "mcq", "question_text": f"What is the main topic of {chapter_title}?", "options": json.dumps({"A": "Main concept", "B": "Secondary idea", "C": "Unrelated topic", "D": "Missing topic"}), "correct_answer": "A", "explanation": f"The main topic of {chapter_title} is the key concept being discussed.", "topic_tag": topics.split(",")[0] if topics else "Core Concepts"},
        {"question_number": 2, "question_type": "mcq", "question_text": f"Which of these is NOT related to {chapter_title}?", "options": json.dumps({"A": "Key concept", "B": "Main idea", "C": "Unrelated topic", "D": "Important detail"}), "correct_answer": "C", "explanation": "The unrelated topic is not part of this chapter.", "topic_tag": topics.split(",")[0] if topics else "Core Concepts"},
        {"question_number": 3, "question_type": "true_false", "question_text": f"The concepts in {chapter_title} are important for exams.", "options": json.dumps({"A": "True", "B": "False"}), "correct_answer": "A", "explanation": "Yes, understanding this chapter is important for exam preparation.", "topic_tag": topics.split(",")[0] if topics else "Exam Prep"},
        {"question_number": 4, "question_type": "mcq", "question_text": "What should you do after learning this chapter?", "options": json.dumps({"A": "Practice questions", "B": "Skip it", "C": "Forget it", "D": "Ignore it"}), "correct_answer": "A", "explanation": "Practice questions help reinforce learning.", "topic_tag": "Study Skills"},
        {"question_number": 5, "question_type": "mcq", "question_text": "How do you master this chapter?", "options": json.dumps({"A": "Read and practice", "B": "Just read", "C": "Don't study", "D": "Memorize nothing"}), "correct_answer": "A", "explanation": "Reading alone is not enough; practice is essential.", "topic_tag": "Study Skills"},
        {"question_number": 6, "question_type": "true_false", "question_text": "This chapter contains important concepts.", "options": json.dumps({"A": "True", "B": "False"}), "correct_answer": "A", "explanation": "This chapter covers important educational content.", "topic_tag": "Core Concepts"},
        {"question_number": 7, "question_type": "mcq", "question_text": "What's the best way to test your understanding?", "options": json.dumps({"A": "Take a quiz", "B": "Do nothing", "C": "Just read", "D": "Skip questions"}), "correct_answer": "A", "explanation": "Taking a quiz helps identify weak areas.", "topic_tag": "Self-Assessment"},
        {"question_number": 8, "question_type": "mcq", "question_text": "If you get a question wrong, you should:", "options": json.dumps({"A": "Learn from it", "B": "Ignore it", "C": "Give up", "D": "Skip more"}), "correct_answer": "A", "explanation": "Learning from mistakes helps improve.", "topic_tag": "Study Skills"},
        {"question_number": 9, "question_type": "true_false", "question_text": "Asking questions helps learning.", "options": json.dumps({"A": "True", "B": "False"}), "correct_answer": "A", "explanation": "Asking questions clarifies doubts.", "topic_tag": "Active Learning"},
        {"question_number": 10, "question_type": "mcq", "question_text": "Why is practice important?", "options": json.dumps({"A": "Builds confidence", "B": "Wastes time", "C": "Not useful", "D": "Too hard"}), "correct_answer": "A", "explanation": "Practice builds confidence and mastery.", "topic_tag": "Practice"},
    ]