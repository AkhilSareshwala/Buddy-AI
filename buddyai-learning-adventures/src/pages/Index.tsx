import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Brain, BookOpen, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingBlobs from "@/components/FloatingBlobs";
import heroScene from "@/assets/hero-scene.png";
import { useAuth } from "@/components/AuthProvider";

const FEATURES = [
  { icon: Shield, title: "Smart Safety", desc: "Age-appropriate AI that keeps conversations on track.", color: "bg-pastel-green" },
  { icon: Brain, title: "Personalized Learning", desc: "Adapts to your grade and pace. Learn smarter, not harder.", color: "bg-pastel-blue" },
  { icon: BookOpen, title: "All Subjects", desc: "Maths, Science, English, History, Geography, and more.", color: "bg-pastel-amber" },
  { icon: CheckCircle2, title: "Track Progress", desc: "See your streak and revisit past sessions anytime.", color: "bg-pastel-pink" },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-hero-gradient">
        <FloatingBlobs />
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-card text-primary font-extrabold text-sm mb-6">
              <Sparkles className="w-4 h-4" /> Built for Std 9 & 10
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-primary-deep leading-[1.05] mb-6">
              Your AI <span className="text-primary">study</span><br />buddy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-bold mb-8 max-w-xl">
              Buddy is your smart AI study partner for Standard 9 & 10.
              Learn smarter, not harder — with personalized tutoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mb-4">
              <Button
                asChild size="lg"
                className="rounded-full font-extrabold text-base px-7 bg-primary-gradient shadow-pop hover-lift animate-pulse-glow"
              >
                <Link to="/auth">Start learning <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Free to use
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            className="relative"
          >
            <motion.img
              src={heroScene} alt="Buddy the friendly green robot teaching"
              className="w-full max-w-lg mx-auto drop-shadow-2xl"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-8 right-4 bg-white rounded-2xl px-3 py-2 shadow-pop font-extrabold text-sm text-primary"
              animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }}
            >
              ⭐ AI Powered
            </motion.div>
            <motion.div
              className="absolute bottom-12 left-2 bg-accent rounded-2xl px-3 py-2 shadow-pop font-extrabold text-sm"
              animate={{ rotate: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity }}
            >
              🔥 Learn daily!
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl md:text-5xl text-primary-deep mb-4">
              Why students 💚 Buddy
            </h2>
            <p className="text-lg text-muted-foreground font-bold max-w-2xl mx-auto">
              Your personal AI tutor, available 24/7. No waiting, just learning.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`p-7 border-0 ${f.color} hover-lift shadow-card h-full`}>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-card">
                    <f.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl text-primary-deep mb-2">{f.title}</h3>
                  <p className="text-sm font-bold text-foreground/80">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-hero-gradient relative overflow-hidden">
        <FloatingBlobs />
        <div className="container relative text-center max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl text-primary-deep mb-4">
            Ready to learn with Buddy?
          </h2>
          <p className="text-lg text-muted-foreground font-bold mb-8">
            Sign up in 30 seconds. Start learning immediately.
          </p>
          <Button asChild size="lg" className="rounded-full font-extrabold text-lg px-10 py-7 bg-primary-gradient shadow-pop hover-lift animate-pulse-glow">
            <Link to="/auth">Get started <ArrowRight className="w-5 h-5 ml-2" /></Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground font-bold">
        © {new Date().getFullYear()} BuddyAI. Your AI study buddy.
        <span className="mx-2">·</span>
        <Link to="/about" className="text-primary hover:underline">About</Link>
      </footer>
    </div>
  );
}