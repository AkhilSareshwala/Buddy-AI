import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import buddyAvatar from "@/assets/buddy-avatar.png";

export default function Navbar() {
  const loc = useLocation();
  const onAuth = loc.pathname === "/auth";
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.img
            src={buddyAvatar}
            alt="BuddyAI mascot"
            className="w-9 h-9"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          />
          <span className="font-display text-xl font-extrabold text-primary-deep">
            Buddy<span className="text-primary">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/about" className="hidden sm:inline-block px-3 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          {!onAuth && (
            <Button asChild variant="ghost" className="font-bold">
              <Link to="/auth">Log in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
