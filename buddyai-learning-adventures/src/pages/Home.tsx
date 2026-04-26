import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getSubjects, getSessionsByUser, getSubjectChaptersCount, type ChatSession as DbSession } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Plus, BookOpen, Settings as SettingsIcon, LogOut } from "lucide-react";
import buddyAvatar from "@/assets/buddy-avatar.png";
import FloatingBlobs from "@/components/FloatingBlobs";
import { Loader2 } from "lucide-react";

type Subject = { id: string; name: string; grade: number; iconEmoji: string; displayOrder: number };
type Sess = { id: string; subject: string; topic: string | null; createdAt: string };

export default function Home() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Sess[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const allSubjects = getSubjects();
    const userGrade = user.grade === "Standard 9" ? 9 : 10;
    const filtered = allSubjects.filter(s => s.grade === userGrade).sort((a, b) => a.displayOrder - b.displayOrder);
    setSubjects(filtered);

    const counts = getSubjectChaptersCount();
    setChapterCounts(counts);

    const sessions = getSessionsByUser(user.id);
    setRecent(sessions.slice(0, 2) as Sess[]);
  }, [user]);

  function handleLogout() {
    logOut();
    navigate("/");
  }

  function timeAgo(d: string) {
    const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  }

  const SUBJECT_COLORS = [
    "bg-pastel-blue",
    "bg-pastel-green", 
    "bg-pastel-amber",
    "bg-pastel-purple",
    "bg-pastel-pink",
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      <FloatingBlobs />
      <div className="relative container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="font-display text-2xl text-primary-deep font-extrabold">
            Buddy<span className="text-primary">AI</span>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/settings"><SettingsIcon className="w-5 h-5" /></Link></Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full"><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.img
            src={buddyAvatar} alt="Buddy"
            className="w-20 h-20 rounded-full bg-white shadow-pop p-1"
            animate={{ rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
          />
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-primary-deep">
              Hi, {user.name || "friend"}! 👋
            </h1>
            <p className="text-muted-foreground font-bold mt-1">Ready to learn something amazing today?</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="bg-streak-gradient rounded-3xl p-5 shadow-pop mb-8 flex items-center gap-4 text-white"
        >
          <div className="text-5xl animate-flame">🔥</div>
          <div className="flex-1">
            <div className="font-display text-2xl">{user.streak ?? 0} day streak</div>
            <div className="text-sm font-bold opacity-95">Keep it going! Learn a little every day.</div>
          </div>
          <Flame className="w-10 h-10 opacity-30 hidden sm:block" />
        </motion.div>

        <h2 className="font-display text-2xl text-primary-deep mb-4">Pick a subject ✨</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {subjects.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
              whileHover={{ scale: 1.04, rotate: -1 }} whileTap={{ scale: 0.97 }}
            >
              <Link to={`/subjects/${s.id}`}>
                <Card className={`${SUBJECT_COLORS[i % SUBJECT_COLORS.length]} border-0 p-6 h-32 flex flex-col items-center justify-center shadow-card hover-lift cursor-pointer`}>
                  <div className="text-5xl mb-2 animate-bounce-soft">{s.iconEmoji}</div>
                  <div className="font-display text-base text-primary-deep">{s.name}</div>
                </Card>
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.04 }}
          >
            <Link to="/chapters">
              <Card className="border-2 border-dashed border-primary/40 bg-white/60 p-6 h-32 flex flex-col items-center justify-center hover:border-primary hover:bg-white cursor-pointer transition-all">
                <Plus className="w-10 h-10 text-primary mb-1" />
                <div className="font-display text-base text-primary">Add more</div>
              </Card>
            </Link>
          </motion.div>
        </div>

        <h2 className="font-display text-2xl text-primary-deep mb-4">Recent sessions 📖</h2>
        {recent.length === 0 ? (
          <Card className="p-8 text-center bg-white/80 border-0 shadow-card">
            <BookOpen className="w-10 h-10 text-primary/50 mx-auto mb-3" />
            <p className="font-bold text-muted-foreground">No sessions yet — start one above! 🚀</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((s) => (
              <Link key={s.id} to={`/chat?subject=${encodeURIComponent(s.subject)}`}>
                <Card className="p-4 flex items-center gap-4 bg-white border-0 shadow-card hover-lift cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center text-2xl">📘</div>
                  <div className="flex-1">
                    <div className="font-display text-base text-primary-deep">{s.subject}</div>
                    <div className="text-sm font-bold text-muted-foreground">{s.topic || "Free chat"}</div>
                  </div>
                  <div className="text-xs font-bold text-muted-foreground">{timeAgo(s.createdAt)}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}