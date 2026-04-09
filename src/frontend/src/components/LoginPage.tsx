import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { BookOpen, Brain, Flame, Music, Timer, Zap } from "lucide-react";
import { motion } from "motion/react";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    {
      icon: Timer,
      label: "Focus Timer",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      icon: Music,
      label: "Ambient Music",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: Brain,
      label: "AI Assistant",
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: Flame,
      label: "Study Streaks",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, oklch(0.62 0.24 270 / 0.14) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, oklch(0.7 0.15 210 / 0.1) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, oklch(0.6 0.22 310 / 0.08) 0%, transparent 50%)",
        }}
      />
      {/* Decorative rings */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.62 0.24 270 / 0.04) 0%, transparent 60%)",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo mark + wordmark */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] glass-elevated mb-5"
            style={{
              boxShadow:
                "0 0 40px oklch(0.62 0.24 270 / 0.4), 0 0 80px oklch(0.62 0.24 270 / 0.1)",
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{
              duration: 3.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <BookOpen className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="font-display font-bold text-5xl tracking-tight mb-2">
            S<span className="text-gradient-primary">toa</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Your intelligent study companion
          </p>
        </div>

        {/* Feature chips — staggered reveal */}
        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              className="glass-card rounded-xl p-3.5 flex items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.12 + i * 0.07,
                duration: 0.38,
                ease: "easeOut",
              }}
              whileHover={{
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 20 },
              }}
            >
              <div className={`p-2 rounded-lg border ${f.bg} flex-shrink-0`}>
                <f.icon className={`w-4 h-4 ${f.color}`} />
              </div>
              <span className="text-sm text-foreground/80 font-medium">
                {f.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Login card — glass-elevated */}
        <motion.div
          className="glass-elevated rounded-2xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="inline-flex mb-4"
          >
            <Zap className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="font-display font-bold text-2xl tracking-tight mb-2">
            Ready to focus?
          </h2>
          <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
            Sign in to track your progress, save tasks, and unlock your full
            potential.
          </p>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl glow-primary transition-all duration-200 tracking-wide"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Sign In to Study"
              )}
            </Button>
          </motion.div>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Powered by Internet Identity · Secure & private
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
