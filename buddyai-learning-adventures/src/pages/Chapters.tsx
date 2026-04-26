import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getSubjectById, getChaptersBySubject, type Chapter, type Subject } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle, Clock } from "lucide-react";
import FloatingBlobs from "@/components/FloatingBlobs";

export default function Chapters() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!user || !subjectId) {
      navigate("/home");
      return;
    }

    const sub = getSubjectById(subjectId);
    if (!sub) {
      navigate("/home");
      return;
    }
    setSubject(sub);

    const chaps = getChaptersBySubject(subjectId);
    setChapters(chaps.filter(c => c.isPublished));
  }, [user, subjectId]);

  function getStatusPill(status: string | undefined, score: number | null) {
    if (status === "completed" && score !== null) {
      return (
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-extrabold">
          <CheckCircle className="w-3 h-3 inline mr-1" /> {score}%
        </span>
      );
    }
    if (status === "in_progress") {
      return (
        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
          <Clock className="w-3 h-3 inline mr-1" /> Studying
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-extrabold">
        Not started
      </span>
    );
  }

  if (!subject) return null;

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden">
      <FloatingBlobs />
      <div className="relative container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild size="icon" variant="ghost" className="rounded-full">
            <Link to="/home"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-display text-2xl md:text-3xl text-primary-deep">
            {subject.iconEmoji} {subject.name}
          </h1>
        </div>

        <div className="grid gap-4">
          {chapters.map((chapter, i) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={`/chat?chapterId=${chapter.id}`}>
                <Card className="p-5 border-0 shadow-card hover-lift cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-bold mb-1">
                        Chapter {chapter.chapterNumber}
                      </div>
                      <div className="font-display text-lg text-primary-deep mb-2">
                        {chapter.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chapter.contentSummary}
                      </div>
                    </div>
                    {getStatusPill(undefined, null)}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {chapters.length === 0 && (
          <Card className="p-8 text-center bg-white/80 border-0 shadow-card">
            <BookOpen className="w-10 h-10 text-primary/50 mx-auto mb-3" />
            <p className="font-bold text-muted-foreground">No chapters available yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}