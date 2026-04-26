# BuddyAI - Learning Adventures

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-python?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangChain-AI/LLM-yellow?style=for-the-badge" alt="LangChain">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

> An AI-powered tutoring platform for Standard 9-10 students (ages 14-15). Buddy acts as a friendly AI tutor that helps students learn through interactive chat, auto-generated quizzes, and personalized study summaries.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | Interactive chat with Buddy using chapter content as knowledge base |
| 📝 **Auto-Quiz Generation** | Generates 10 questions (7 MCQ + 3 True/False) per chapter |
| 📚 **Smart Summaries** | Key notes & exam-focused concepts generated on demand |
| 📊 **Progress Tracking** | Tracks weak topics and test scores per student |
| 🛡️ **Safe Mode** | Content filtered for age-appropriateness |

---

## Tech Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 5.4
- **Routing**: React Router DOM 6.30
- **Styling**: TailwindCSS 3.4 + shadcn/ui
- **State Management**: TanStack Query 5.83
- **Animation**: Framer Motion 12.38
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **AI/LLM**: LangChain + LangGraph
- **Model**: HuggingFace Mistral-7B-Instruct-v0.2
- **Database**: SQLite

---

## Project Structure

```
├── buddyai-learning-adventures/     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/              # UI components
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   └── AuthProvider.tsx      # Authentication context
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Test.tsx
│   │   │   ├── Subjects.tsx
│   │   │   ├── Chapters.tsx
│   │   │   └── ...
│   │   ├── lib/                     # Utilities & DB
│   │   ├── hooks/                   # Custom hooks
│   │   └── assets/                  # Images & static assets
│   ├── supabase/                    # Database migrations
│   └── package.json
│
├── buddyai-backend/                 # Backend (FastAPI)
│   ├── main.py                      # API endpoints
│   ├── nodes.py                     # LangGraph nodes
│   ├── graph.py                     # Graph execution
│   ├── state.py                     # State definitions
│   ├── db_client.py                 # Database client
│   ├── requirements.txt
│   └── buddyai.db                  # SQLite database
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Bun (optional, for faster installs)

### Frontend Setup

```bash
cd buddyai-learning-adventures

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd buddyai-backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python main.py
```

The API will be available at `http://localhost:8000`

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/chapters/{chapter_id}` | GET | Get chapter details |
| `/chat` | POST | Send message to Buddy |
| `/test/generate` | POST | Generate quiz for chapter |
| `/test/evaluate` | POST | Evaluate student answer |
| `/test/complete` | POST | Complete test attempt |
| `/progress/{student_id}/{chapter_id}` | GET | Get student progress |

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Backend (.env)
```env
API_SECRET_KEY=your_api_secret_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │
│   (React SPA)  │     │   (FastAPI)     │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  LangGraph     │
                        │  (Nodes)      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Mistral LLM    │
                        │  (HuggingFace) │
                        └─────────────────┘
```

1. Student selects a subject → chapter
2. Opens Chat page with chapter context
3. Messages sent to backend → Intent Router determines action
4. Chat Node: Uses chapter content as knowledge base for responses
5. Test Node: Generates quiz questions via LLM
6. Summary Node: Creates key notes & exam concepts
7. Responses + progress stored in SQLite & IndexedDB

---

## Screenshots

The app features:
- Animated buddy mascot
- Gradient hero sections
- Clean card-based UI
- Mobile-responsive design

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Mistral AI](https://mistral.ai/) for the language model
- [LangChain](https://langchain.ai/) for the AI orchestration framework