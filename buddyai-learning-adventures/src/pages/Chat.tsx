import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/AuthProvider";
import { createSession, getMessagesBySession, createMessage as dbCreateMessage, getChapterById } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Shield, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import buddyAvatar from "@/assets/buddy-avatar.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_SECRET = "buddyai_secret_key_123";

type Msg = { role: "user" | "assistant"; content: string };

const SAFETY_PILLS = [
  { label: "Input filtered", icon: Shield },
  { label: "Output checked", icon: CheckCircle2 },
  { label: "Age-appropriate", icon: Sparkles },
  { label: "On-topic", icon: CheckCircle2 },
];

export default function Chat() {
  const [params] = useSearchParams();
  const chapterId = params.get("chapterId");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm Buddy, your AI study buddy. Ask me anything about this chapter, say 'summarize' for notes, or 'test me' for a quiz!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!user || !chapterId) return;

    const chapter = getChapterById(chapterId);
    if (chapter) setChapterTitle(chapter.title);

    const session = createSession(user.id, chapter?.name || "General", null);
    setSessionId(session.id);

    const existingMessages = getMessagesBySession(session.id);
    if (existingMessages.length > 0) {
      setMessages(existingMessages.map(m => ({ role: m.role, content: m.content })));
    }

    fetch(`${API_URL}/progress/${user.id}/${chapterId}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` }
    }).then(res => res.json()).then(data => {
      if (data.weak_topics?.length > 0) {
        setWeakTopics(data.weak_topics.map((t: any) => t.topic_name));
      }
    }).catch(() => {});
  }, [user, chapterId]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading || !user || !chapterId || !sessionId) return;

    const userMsg: Msg = { role: "user", content };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    dbCreateMessage(sessionId, user.id, "user", content);

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const chapter = getChapterById(chapterId);
      const chapterTitle = chapter?.title || chapterId;
      console.log("Sending to backend:", { chapter_id: chapterId, chapter_title: chapterTitle, messages: allMessages, student_id: user.id });
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
        body: JSON.stringify({ chapter_id: chapterId, chapter_title: chapterTitle, messages: allMessages, student_id: user.id })
      });

      console.log("Backend response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        setMessages(p => [...p, { role: "assistant", content: "Server error. Please try again." }]);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      const assistantMsg: Msg = { role: "assistant", content: result.message?.content || "Sorry, I couldn't process that." };

      if (result.mode === "test" && result.test_attempt_id) {
        navigate(`/test?attemptId=${result.test_attempt_id}&chapterId=${chapterId}`);
        return;
      }

      setMessages(p => [...p, assistantMsg]);
      dbCreateMessage(sessionId, user.id, "assistant", assistantMsg.content);
    } catch (e) {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user || !chapterId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      <header className="bg-primary-gradient text-primary-foreground shadow-soft">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20" onClick={() => navigate("/home")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <motion.img src={buddyAvatar} alt="Buddy" className="w-12 h-12 rounded-full bg-white p-1 shadow-pop" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            <div>
              <h1 className="font-display text-lg font-extrabold leading-tight">Buddy — Your AI tutor</h1>
              <p className="text-xs opacity-90 font-bold">Chapter: {chapterTitle}</p>
            </div>
          </div>
          <Badge className="bg-white text-primary font-extrabold px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3 mr-1" /> Safe mode ON
          </Badge>
        </div>
      </header>

      {weakTopics.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="container max-w-3xl flex items-center gap-2 text-amber-800 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Buddy will help you review: {weakTopics.join(", ")}</span>
          </div>
        </div>
      )}

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && <img src={buddyAvatar} alt="" className="w-9 h-9 rounded-full bg-white shadow-card shrink-0 mt-1" />}
                <div className={`max-w-[80%] px-4 py-3 rounded-3xl shadow-card ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-primary-soft text-foreground rounded-bl-md"}`}>
                  <div className="prose prose-sm max-w-none [&_p]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <img src={buddyAvatar} alt="" className="w-9 h-9 rounded-full bg-white shadow-card" />
              <div className="bg-primary-soft px-4 py-3 rounded-3xl rounded-bl-md">
                <div className="flex gap-1">
                  {[0, 1, 2].map(d => (
                    <motion.span key={d} className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <div className="container max-w-3xl pb-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {SAFETY_PILLS.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-extrabold">
              <Icon className="w-3 h-3" /> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <form onSubmit={e => { e.preventDefault(); send(); }} className="container max-w-3xl py-4 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Buddy anything about this chapter..."
            className="flex-1 px-5 py-3 rounded-full border-2 border-border focus:border-primary outline-none bg-background font-body font-bold text-base" disabled={isLoading} />
          <Button type="submit" size="lg" className="rounded-full px-6 font-extrabold shadow-pop" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4 mr-1" /> Send
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground pb-3">
          <Link to="/subjects" className="text-primary font-extrabold hover:underline">Pick another chapter</Link>
        </p>
      </div>
    </div>
  );
}