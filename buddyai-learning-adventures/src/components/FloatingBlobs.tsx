import { motion } from "framer-motion";

/** Animated decorative shapes that float in the background. */
export default function FloatingBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 bg-primary/20 animate-blob"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-40 -right-24 w-72 h-72 bg-accent/30 animate-blob"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-64 h-64 bg-pastel-pink animate-blob"
        animate={{ x: [0, 15, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity }}
      />
      {/* sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/40"
          style={{ top: `${10 + i * 10}%`, left: `${(i * 13) % 90}%` }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
