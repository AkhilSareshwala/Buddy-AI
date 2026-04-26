import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getSubjects, getSubjectChaptersCount, type Subject } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Settings as SettingsIcon, LogOut } from "lucide-react";
import FloatingBlobs from "@/components/FloatingBlobs";

const SUBJECT_COLORS = [
  "bg-pastel-blue",
  "bg-pastel-green", 
  "bg-pastel-amber",
  "bg-pastel-purple",
  "bg-pastel-pink",
];

export default function Subjects() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const allSubjects = getSubjects();
    setSubjects(allSubjects);

    const counts = getSubjectChaptersCount();
    setChapterCounts(counts);
  }, [user]);

  function handleLogout() {
    logOut();
    navigate("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      <FloatingBlobs />
      <div className="relative container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/home" className="font-display text-2xl text-primary-deep font-extrabold">
            Buddy<span className="text-primary">AI</span>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/settings"><SettingsIcon className="w-5 h-5" /></Link></Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full"><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>

        <h2 className="font-display text-2xl text-primary-deep mb-4">All Subjects 📚</h2>
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
                  <div className="text-xs text-muted-foreground">Grade {s.grade}</div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link to="/home">
          <Button variant="ghost" className="font-extrabold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}