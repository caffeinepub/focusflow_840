import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { MusicProvider } from "@/contexts/MusicContext";
import { TimerProvider } from "@/contexts/TimerContext";
import {
  BookOpen,
  Bot,
  CheckSquare,
  Droplets,
  LayoutDashboard,
  Music,
  Timer,
  Wind,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AIAssistant } from "./components/AIAssistant";
import { Dashboard } from "./components/Dashboard";
import { Meditation } from "./components/Meditation";
import { MiniStatusBar } from "./components/MiniStatusBar";
import { MusicPlayer } from "./components/MusicPlayer";
import { StudyTimer } from "./components/StudyTimer";
import { TodoList } from "./components/TodoList";

type Tab = "dashboard" | "timer" | "music" | "tasks" | "meditation" | "ai";

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ElementType;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.tab",
  },
  { id: "timer", label: "Study Timer", icon: Timer, ocid: "nav.timer.tab" },
  { id: "music", label: "Music", icon: Music, ocid: "nav.music.tab" },
  {
    id: "tasks",
    label: "To-Do List",
    icon: CheckSquare,
    ocid: "nav.tasks.tab",
  },
  {
    id: "meditation",
    label: "Meditation",
    icon: Wind,
    ocid: "nav.meditation.tab",
  },
  { id: "ai", label: "AI Assistant", icon: Bot, ocid: "nav.ai.tab" },
];

const WATER_INTERVAL_MS = 30 * 60 * 1000;

// Page transition variants — scale + blur + fade + y-shift
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 1.005,
    filter: "blur(3px)",
  },
};

const pageTransition = {
  duration: 0.32,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [nextWaterReminder, setNextWaterReminder] = useState<number | null>(
    null,
  );
  const waterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSidebarZoneEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setSidebarHovered(true);
  }

  function handleSidebarZoneLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarHovered(false);
    }, 200);
  }

  // Global water reminder
  useEffect(() => {
    const next = Date.now() + WATER_INTERVAL_MS;
    setNextWaterReminder(next);
    waterTimerRef.current = setInterval(() => {
      toast("💧 Stay Hydrated!", {
        description:
          "Remember to drink a glass of water. Your brain works better when hydrated!",
        duration: 8000,
        icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      });
      setNextWaterReminder(Date.now() + WATER_INTERVAL_MS);
    }, WATER_INTERVAL_MS);
    return () => {
      if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating aurora background blobs */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Blob 1 — large indigo orb top-right */}
        <div
          className="animate-aurora-1 absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: "-15%",
            right: "-10%",
            background:
              "radial-gradient(circle, oklch(0.62 0.24 270 / 0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Blob 2 — cyan orb bottom-left */}
        <div
          className="animate-aurora-2 absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: "-10%",
            left: "-5%",
            background:
              "radial-gradient(circle, oklch(0.7 0.15 210 / 0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Blob 3 — warm violet orb center-left */}
        <div
          className="animate-aurora-3 absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            top: "40%",
            left: "20%",
            background:
              "radial-gradient(circle, oklch(0.65 0.18 300 / 0.05) 0%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />
        {/* Blob 4 — small accent top-left */}
        <div
          className="animate-aurora-1 absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: "5%",
            left: "15%",
            animationDelay: "-8s",
            background:
              "radial-gradient(circle, oklch(0.75 0.18 230 / 0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Sidebar glow edge strip — visible hint even when sidebar is hidden */}
      <div
        className="sidebar-glow-strip animate-sidebar-pulse hidden lg:block"
        aria-hidden="true"
      />

      {/* Desktop sentinel strip — always 16px, triggers sidebar open */}
      <div
        className="hidden lg:block fixed left-0 top-0 h-full z-50"
        style={{ width: 16, pointerEvents: sidebarHovered ? "none" : "auto" }}
        onMouseEnter={handleSidebarZoneEnter}
      />

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed z-40 h-full flex flex-col
          glass-card border-r border-border
          lg:block
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: 240, minWidth: 240 }}
        initial={{ x: -240 }}
        animate={{ x: sidebarHovered || sidebarOpen ? 0 : -240 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 30,
          mass: 0.8,
        }}
        onMouseEnter={handleSidebarZoneEnter}
        onMouseLeave={handleSidebarZoneLeave}
      >
        {/* Logo — premium gradient feel */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3 relative overflow-hidden">
          {/* Logo area subtle shimmer bg */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.24 270 / 0.12) 0%, transparent 60%)",
            }}
          />
          <motion.div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.25 0.1 270), oklch(0.18 0.06 280))",
              boxShadow:
                "0 0 20px oklch(0.62 0.24 270 / 0.45), inset 0 1px 0 oklch(1 0 0 / 0.15)",
              border: "1px solid oklch(0.62 0.24 270 / 0.3)",
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <BookOpen className="w-4 h-4 text-primary" />
          </motion.div>
          <div className="relative">
            <span className="font-display font-bold text-[17px] text-foreground tracking-tight">
              Focus<span className="text-gradient-primary">Flow</span>
            </span>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mt-0.5">
              Study Companion
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                data-ocid={item.ocid}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  x: isActive ? 0 : 3,
                  transition: { duration: 0.15, ease: "easeOut" },
                }}
                whileTap={{
                  scale: 0.97,
                  transition: { duration: 0.08, ease: "easeIn" },
                }}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary"
                    style={{ boxShadow: "0 0 8px oklch(0.62 0.24 270 / 0.8)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                {/* Icon */}
                <motion.div
                  className="relative z-10 flex-shrink-0"
                  whileHover={{ scale: 1.18, rotate: isActive ? 0 : -6 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                >
                  <item.icon
                    className={`w-4 h-4 ${isActive ? "text-primary" : ""}`}
                  />
                </motion.div>
                <span className="relative z-10 font-medium">{item.label}</span>

                {/* Active glow accent on right */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-glow"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/60"
                    style={{
                      boxShadow: "0 0 6px oklch(0.62 0.24 270 / 0.8)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 pb-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 px-2">
            <div
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px oklch(0.78 0.18 145 / 0.8)" }}
            />
            <span className="text-xs text-muted-foreground/60 tracking-wide">
              Active session
            </span>
          </div>
        </div>
      </motion.aside>

      {/* Main content — always full width since sidebar overlays */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border glass-card z-10">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <BookOpen className="w-5 h-5" />
            </Button>
          </motion.div>
          <span className="font-display font-bold text-foreground tracking-tight">
            Focus<span className="text-gradient-primary">Flow</span>
          </span>
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground tracking-wide">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Ambient radial background */}
          <div
            className="fixed inset-0 pointer-events-none z-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse at 75% 15%, oklch(0.62 0.24 270 / 0.07) 0%, transparent 55%), radial-gradient(ellipse at 25% 85%, oklch(0.7 0.15 210 / 0.05) 0%, transparent 50%)",
            }}
          />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <Dashboard
                    onStartTimer={() => setActiveTab("timer")}
                    nextWaterReminder={nextWaterReminder}
                  />
                </motion.div>
              )}
              {activeTab === "timer" && (
                <motion.div
                  key="timer"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <StudyTimer />
                </motion.div>
              )}
              {activeTab === "music" && (
                <motion.div
                  key="music"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <MusicPlayer />
                </motion.div>
              )}
              {activeTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <TodoList />
                </motion.div>
              )}
              {activeTab === "meditation" && (
                <motion.div
                  key="meditation"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <Meditation />
                </motion.div>
              )}
              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  className="h-full"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <AIAssistant />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="px-6 py-5 text-center">
            <p className="text-xs text-muted-foreground/35 tracking-wide">
              © {new Date().getFullYear()} · Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground/70 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden border-t border-border glass-card flex items-center justify-around px-1 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                data-ocid={item.ocid}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors min-w-0 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.88 }}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.div>
                <span
                  className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}
                >
                  {item.label.split(" ")[0]}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Persistent mini status bar — timer + music always visible */}
      <MiniStatusBar
        onGoToTimer={() => setActiveTab("timer")}
        onGoToMusic={() => setActiveTab("music")}
      />

      <Toaster
        theme="dark"
        toastOptions={{
          className: "glass-elevated border-border",
          style: { backdropFilter: "blur(24px)" },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <TimerProvider>
        <AppInner />
      </TimerProvider>
    </MusicProvider>
  );
}
