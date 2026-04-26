import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Brain, TrendingUp, Scale, Sparkles } from "lucide-react";
import buddyMascot from "@/assets/buddy-mascot.png";

const TRADEoffs = [
  { title: "Direct text vs RAG", decision: "Direct injection — chapters under 8000 words fit in context window", reason: "Lower latency, simpler than managing vector DB for small content" },
  { title: "LangGraph vs edge functions", decision: "LangGraph for stateful multi-mode sessions", reason: "Needed conversation history + mode routing across chat/summary/test" },
  { title: "Gemini Flash vs Pro", decision: "Flash for latency, acceptable quality", reason: "Grade 9-10 curriculum simple enough for Flash tier" },
  { title: "Free vs premium", decision: "1 test free, unlimited for premium", reason: "Hook for monetization while proving value first" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-deep-gradient text-primary-foreground relative overflow-hidden py-16 lg:py-24">
        <div className="container relative">
          <Link to="/" className="inline-flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground font-bold mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <motion.img
                src={buddyMascot} alt="Buddy"
                className="w-16 h-16"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="font-display text-2xl opacity-90">Buddy<span className="text-accent">AI</span></span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl mb-4">AI Learning Platform for Grade 9 & 10</h1>
            <p className="text-lg md:text-xl opacity-90 font-bold max-w-2xl">
              A chapter-aware AI tutoring platform with LangGraph-powered adaptive sessions, MCQ test engine, and automatic weak topic detection.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container py-12">
        <Card className="p-6 shadow-card">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Product Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="py-3 pr-4 font-display text-primary">Problem</th>
                  <th className="py-3 pr-4 font-display text-primary">Target Users</th>
                  <th className="py-3 pr-4 font-display text-primary">Stack</th>
                  <th className="py-3 font-display text-primary">Pricing</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 pr-4 font-body text-muted-foreground">
                    Kids lack safe, personalized AI tutoring for board exam prep
                  </td>
                  <td className="py-3 pr-4 font-body text-muted-foreground">
                    Grade 9 & 10 students (NCERT curriculum)
                  </td>
                  <td className="py-3 pr-4 font-body text-muted-foreground">
                    React, FastAPI, LangGraph, Gemini 2.5 Flash, Supabase
                  </td>
                  <td className="py-3 font-body text-muted-foreground">
                    Freemium (1 test free, unlimited premium)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="container pb-12">
        <Card className="p-6 shadow-card">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> LangGraph Architecture
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-4">
            {[
              { label: "intent_router", desc: "Routes user to chat/summary/test node" },
              { label: "chat_node", desc: "Answer questions from chapter content" },
              { label: "summary_node", desc: "Structured notes with key concepts" },
              { label: "test_node", desc: "Generates 10 MCQ/TF questions" },
            ].map((node, i) => (
              <div key={node.label} className="flex items-center">
                <div className="text-center p-4 bg-primary-soft rounded-xl">
                  <Badge className="font-display text-sm mb-1">{node.label}</Badge>
                  <p className="text-xs text-muted-foreground font-body">{node.desc}</p>
                </div>
                {i < 3 && <span className="mx-2 text-primary">→</span>}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="container pb-12">
        <Card className="p-6 shadow-card">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Evaluation Results (Prompt v1 → v2)
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Hallucination rate", v1: "38%", v2: "9%", good: true },
              { label: "Age-appropriate", v1: "71%", v2: "94%", good: true },
              { label: "Off-topic responses", v1: "40%", v2: "8%", good: true },
              { label: "Safety flag rate", v1: "0.2%", v2: "0.2%", good: true, neutral: true },
            ].map(metric => (
              <div key={metric.label} className="text-center p-4 bg-muted rounded-xl">
                <p className="font-body text-sm text-muted-foreground mb-2">{metric.label}</p>
                <div className="font-display text-2xl text-primary">
                  {metric.v1} <span className="text-lg">→</span> {metric.v2}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="container pb-12">
        <Card className="p-6 shadow-card">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Key Tradeoffs Documented
          </h2>
          <div className="space-y-4">
            {TRADEoffs.map(item => (
              <div key={item.title} className="flex flex-col md:flex-row md:items-center gap-2 p-4 bg-muted rounded-xl">
                <div className="flex-1">
                  <h3 className="font-display text-primary">{item.title}</h3>
                  <p className="font-body font-bold">{item.decision}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="container pb-16">
        <div className="bg-primary-soft p-6 rounded-xl border-2 border-primary">
          <div className="text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
            <p className="font-display text-xl md:text-2xl text-primary max-w-3xl mx-auto">
              Built a chapter-aware AI tutoring platform for Grade 9 and 10 students using a LangGraph stateful agent — supporting conversational tutoring, structured summaries, and adaptive MCQ tests — with automatic weak topic detection and NCERT curriculum knowledge base.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}