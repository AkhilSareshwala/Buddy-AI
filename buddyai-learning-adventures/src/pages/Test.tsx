import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy, Star, RefreshCw } from "lucide-react";
import buddyAvatar from "@/assets/buddy-avatar.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_SECRET = "buddyai_secret_key_123";

type Question = {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false";
  options: string[];
  correct_answer: string;
  topic_tag: string;
  student_answer?: string;
  is_correct?: boolean;
  explanation?: string;
};

export default function TestPage() {
  const [params] = useSearchParams();
  const chapterId = params.get("chapterId");
  const attemptId = params.get("attemptId");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [scoreData, setScoreData] = useState<{ score: number; score_percent: number } | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!user || !chapterId) {
      navigate("/home");
      return;
    }

    loadTest();
  }, [user, chapterId, attemptId]);

  async function loadTest() {
    setLoading(true);
    
    if (attemptId) {
      try {
        const res = await fetch(`${API_URL}/test/attempt/${attemptId}`, {
          headers: { Authorization: `Bearer ${API_SECRET}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.questions) {
            setQuestions(data.questions);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!attemptId) {
      try {
        const res = await fetch(`${API_URL}/test/generate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_SECRET}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ chapter_id: chapterId, student_id: user?.id })
        });
        const data = await res.json();
        if (data.test_attempt_id) {
          navigate(`/test?attemptId=${data.test_attempt_id}&chapterId=${chapterId}`, { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    setLoading(false);
  }

  async function handleAnswer(answer: string) {
    if (showFeedback || !questions[currentIndex]) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);

    const q = questions[currentIndex];
    
    try {
      const res = await fetch(`${API_URL}/test/evaluate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          question_id: q.id,
          student_answer: answer,
          correct_answer: q.correct_answer,
          topic_tag: q.topic_tag,
          chapter_id: chapterId
        })
      });
      const data = await res.json();
      
      setQuestions(prev => prev.map((qq, i) => 
        i === currentIndex ? { ...qq, student_answer: answer, is_correct: data.is_correct, explanation: data.explanation } : qq
      ));
    } catch (e) {
      const isCorrect = answer === q.correct_answer;
      setQuestions(prev => prev.map((qq, i) => 
        i === currentIndex ? { ...qq, student_answer: answer, is_correct: isCorrect } : qq
      ));
    }
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      completeTest();
    }
  }

  async function completeTest() {
    if (!attemptId || !chapterId) return;
    
    try {
      const res = await fetch(`${API_URL}/test/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ attempt_id: attemptId, chapter_id: chapterId })
      });
      const data = await res.json();
      setScoreData({ score: data.score, score_percent: data.score_percent });
    } catch (e) {
      const correct = questions.filter(q => q.is_correct).length;
      setScoreData({ score: correct, score_percent: Math.round((correct / questions.length) * 100) });
    }
    
    setCompleted(true);
  }

  if (!user || !chapterId) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="text-center">
          <motion.img
            src={buddyAvatar}
            alt="Buddy"
            className="w-20 h-20 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="font-display text-xl text-primary-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <Card className="max-w-md mx-4 p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="font-display text-2xl text-primary mb-4">You've completed this test!</h1>
          <p className="font-body text-muted-foreground mb-6">Back to chapter to continue learning</p>
          <Button onClick={() => navigate(`/chat?chapterId=${chapterId}`)} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chapter
          </Button>
          <Button variant="outline" disabled className="w-full mt-3">
            <Star className="w-4 h-4 mr-2" /> Retake (Premium)
          </Button>
        </Card>
      </div>
    );
  }

  if (completed && scoreData) {
    const topicScores = questions.reduce((acc: Record<string, { correct: number; total: number }>, q) => {
      if (q.topic_tag) {
        if (!acc[q.topic_tag]) acc[q.topic_tag] = { correct: 0, total: 0 };
        acc[q.topic_tag].total++;
        if (q.is_correct) acc[q.topic_tag].correct++;
      }
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-hero-gradient py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center shadow-pop">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-primary" />
            <h1 className="font-display text-4xl text-primary mb-2">{scoreData.score}/10</h1>
            <Badge className={`text-lg px-4 py-2 ${scoreData.score_percent >= 70 ? "bg-green-500" : scoreData.score_percent >= 50 ? "bg-amber-500" : "bg-red-500"} text-white`}>
              {scoreData.score_percent}% {scoreData.score_percent >= 70 ? "Great job!" : scoreData.score_percent >= 50 ? "Good effort!" : "Keep practicing!"}
            </Badge>
            
            <div className="mt-6 text-left">
              <h3 className="font-display text-lg mb-3">Topic Breakdown:</h3>
              <div className="space-y-2">
                {Object.entries(topicScores).map(([topic, data]: [string, any]) => (
                  <div key={topic} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-body font-bold">{topic}</span>
                    <div className="flex items-center gap-2">
                      {data.correct === data.total ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-body text-sm">{data.correct}/{data.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => navigate(`/chat?chapterId=${chapterId}`)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Chapter
              </Button>
              <Button variant="outline" disabled className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" /> Retake Test
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-hero-gradient py-6">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button size="icon" variant="ghost" onClick={() => navigate(`/chat?chapterId=${chapterId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="font-body text-sm text-primary-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="p-6 shadow-pop">
          <Badge variant="outline" className="mb-4">{currentQ.topic_tag}</Badge>
          <p className="font-display text-xl mb-6">{currentQ.question_text}</p>

          {currentQ.question_type === "mcq" ? (
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                let btnClass = "w-full p-4 flex items-center gap-3 border-2 border-border rounded-xl font-body hover:bg-muted transition-colors";
                
                if (showFeedback) {
                  if (opt === selectedAnswer) {
                    btnClass += currentQ.is_correct ? " bg-green-100 border-green-500" : " bg-red-100 border-red-500";
                  }
                  if (opt === currentQ.correct_answer) {
                    btnClass += " bg-green-100 border-green-500";
                  }
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={showFeedback}
                    className={btnClass}
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                      {letter}
                    </span>
                    <span className="flex-1 text-left">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-3">
              {["True", "False"].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={showFeedback}
                  className={`flex-1 p-6 rounded-xl font-display text-xl border-2 ${
                    showFeedback
                      ? opt === currentQ.correct_answer
                        ? "bg-green-100 border-green-500"
                        : opt === selectedAnswer
                        ? "bg-red-100 border-red-500"
                        : "border-border opacity-50"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl ${
                currentQ.is_correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {currentQ.is_correct ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-body font-bold ${currentQ.is_correct ? "text-green-700" : "text-red-700"}`}>
                    {currentQ.is_correct ? "Correct!" : `The correct answer is ${currentQ.correct_answer}`}
                  </p>
                  {currentQ.explanation && (
                    <p className="font-body text-sm mt-1 text-muted-foreground">{currentQ.explanation}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {showFeedback && (
            <Button onClick={nextQuestion} className="w-full mt-6">
              {currentIndex < questions.length - 1 ? (
                <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
              ) : (
                <>See Results <Trophy className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}