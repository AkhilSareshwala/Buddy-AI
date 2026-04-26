import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import buddyMascot from "@/assets/buddy-mascot.png";
import FloatingBlobs from "@/components/FloatingBlobs";

export default function Auth() {
  const nav = useNavigate();
  const { logIn, signUp } = useAuth();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState(9);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signUp(email, password, name || "Friend", `Standard ${grade}`);
      toast.success("Welcome to BuddyAI! 🎉");
      nav("/home");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await logIn(loginEmail, loginPassword);
      toast.success("Welcome back! 💚");
      nav("/home");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden flex items-center justify-center p-4 py-12">
      <FloatingBlobs />
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <motion.img
          src={buddyMascot} alt="Buddy mascot"
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 z-10 drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
        />
        <Card className="p-6 sm:p-8 pt-20 shadow-pop border-0 rounded-3xl bg-card/95 backdrop-blur">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl text-primary-deep">Welcome to BuddyAI</h1>
            <p className="text-muted-foreground font-bold text-sm mt-1">Your AI study buddy</p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-6 rounded-full bg-primary-soft p-1 h-12">
              <TabsTrigger value="signup" className="rounded-full font-extrabold data-[state=active]:bg-white">Sign up</TabsTrigger>
              <TabsTrigger value="login" className="rounded-full font-extrabold data-[state=active]:bg-white">Log in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-5">
                <div>
                  <Label className="font-bold">Full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl mt-1" placeholder="Your full name" />
                </div>
                <div>
                  <Label className="font-bold">Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl mt-1" placeholder="you@school.com" />
                </div>
                <div>
                  <Label className="font-bold">Password</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl mt-1" placeholder="Create a password" />
                </div>
                <div>
                  <Label className="font-bold">Grade</Label>
                  <select
                    value={grade} onChange={(e) => setGrade(parseInt(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={9}>Standard 9</option>
                    <option value={10}>Standard 10</option>
                  </select>
                </div>

                <Button type="submit" disabled={busy} className="w-full rounded-full font-extrabold text-base py-6 bg-primary-gradient shadow-pop hover-lift">
                  {busy ? "Creating..." : "Get started 🚀"}
                </Button>
                <p className="text-center text-sm text-muted-foreground font-bold">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-primary font-extrabold hover:underline">
                    Log in
                  </button>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4">
                <div>
                  <Label className="font-bold">Email</Label>
                  <Input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="font-bold">Password</Label>
                  <Input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <Button type="submit" disabled={busy} className="w-full rounded-full font-extrabold text-base py-6 bg-primary-gradient shadow-pop hover-lift">
                  {busy ? "Logging in..." : "Log in"}
                </Button>
                <p className="text-center text-sm text-muted-foreground font-bold">
                  New here?{" "}
                  <button type="button" onClick={() => setTab("signup")} className="text-primary font-extrabold hover:underline">
                    Sign up
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-muted-foreground font-bold hover:text-primary">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}