from typing import TypedDict, List, Optional

class BuddyState(TypedDict):
    student_id: str
    chapter_id: str
    chapter_title: str
    chapter_content: str
    key_topics: List[str]
    weak_topics: List[str]
    messages: List[dict]
    mode: str
    session_id: Optional[str]
    test_attempt_id: Optional[str]