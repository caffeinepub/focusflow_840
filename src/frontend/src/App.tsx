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
  PenLine,
  Timer,
  Wind,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AIAssistant } from "./components/AIAssistant";
import { CursorTrail } from "./components/CursorTrail";
import { Dashboard } from "./components/Dashboard";
import { Meditation } from "./components/Meditation";
import { MiniStatusBar } from "./components/MiniStatusBar";
import { MusicPlayer } from "./components/MusicPlayer";
import { ParticleField } from "./components/ParticleField";
import { StudyTimer } from "./components/StudyTimer";
import { TodoList } from "./components/TodoList";
import { Whiteboard } from "./components/Whiteboard";

type Tab =
  | "dashboard"
  | "timer"
  | "music"
  | "tasks"
  | "meditation"
  | "ai"
  | "whiteboard";

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
  {
    id: "whiteboard",
    label: "Whiteboard",
    icon: PenLine,
    ocid: "nav.whiteboard.tab",
  },
];

const WATER_INTERVAL_MS = 30 * 60 * 1000;

const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.99, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, scale: 1.005, filter: "blur(3px)" },
};

const pageTransition = {
  duration: 0.34,
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
  const [magneticNav, setMagneticNav] = useState<
    Record<string, { x: number; y: number }>
  >({});

  function handleNavMagnet(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    setMagneticNav((prev) => ({
      ...prev,
      [id]: { x: dx * 0.15, y: dy * 0.15 },
    }));
  }

  function handleNavMagnetLeave(id: string) {
    setMagneticNav((prev) => ({ ...prev, [id]: { x: 0, y: 0 } }));
  }

  function handleSidebarZoneEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setSidebarHovered(true);
  }

  function handleSidebarZoneLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarHovered(false);
    }, 200);
  }

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
      {/* Particle network background */}
      <ParticleField />
      {/* Cursor trail */}
      <CursorTrail />
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating aurora background blobs — Midnight Luxury palette */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Blob 1 — emerald orb top-left */}
        <div
          className="animate-aurora-1 absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: "-20%",
            left: "-10%",
            background:
              "radial-gradient(circle, oklch(0.72 0.17 162 / 0.09) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
        />
        {/* Blob 2 — amber orb bottom-right */}
        <div
          className="animate-aurora-2 absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            bottom: "-15%",
            right: "-8%",
            background:
              "radial-gradient(circle, oklch(0.78 0.16 75 / 0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Blob 3 — deep teal center */}
        <div
          className="animate-aurora-3 absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: "35%",
            left: "30%",
            background:
              "radial-gradient(circle, oklch(0.60 0.15 200 / 0.06) 0%, transparent 65%)",
            filter: "blur(65px)",
          }}
        />
        {/* Blob 4 — small lavender top-right */}
        <div
          className="animate-aurora-1 absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            top: "8%",
            right: "20%",
            animationDelay: "-9s",
            background:
              "radial-gradient(circle, oklch(0.68 0.14 285 / 0.07) 0%, transparent 65%)",
            filter: "blur(45px)",
          }}
        />
      </div>

      {/* Sidebar glow edge strip */}
      <div
        className="sidebar-glow-strip animate-sidebar-pulse hidden lg:block"
        aria-hidden="true"
      />

      {/* Desktop sentinel strip */}
      <div
        className="hidden lg:block fixed left-0 top-0 h-full z-50"
        style={{ width: 16, pointerEvents: sidebarHovered ? "none" : "auto" }}
        onMouseEnter={handleSidebarZoneEnter}
      />

      {/* Sidebar */}
      <motion.aside
        data-ocid="sidebar.nav"
        className={`
          fixed z-40 h-full flex flex-col
          glass-card border-r border-border
          lg:block
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: 244, minWidth: 244 }}
        initial={{ x: -244 }}
        animate={{ x: sidebarHovered || sidebarOpen ? 0 : -244 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 32,
          mass: 0.75,
        }}
        onMouseEnter={handleSidebarZoneEnter}
        onMouseLeave={handleSidebarZoneLeave}
      >
        {/* Gradient border on right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, oklch(0.72 0.17 162 / 0.4), oklch(0.78 0.16 75 / 0.3), oklch(0.72 0.17 162 / 0.4), transparent)",
          }}
        />

        {/* Logo */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.17 162 / 0.15) 0%, transparent 60%)",
            }}
          />
          <motion.div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.10 162), oklch(0.15 0.06 180))",
              boxShadow:
                "0 0 22px oklch(0.72 0.17 162 / 0.50), inset 0 1px 0 oklch(1 0 0 / 0.18)",
              border: "1px solid oklch(0.72 0.17 162 / 0.35)",
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <BookOpen className="w-4 h-4 text-primary" />
          </motion.div>
          <div className="relative">
            <span
              className="font-display font-bold text-[17px] text-foreground tracking-tight"
              style={{
                fontFamily:
                  "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
              }}
            >
              Focus<span className="text-gradient-primary">Flow</span>
            </span>
            <div className="text-[9px] text-muted-foreground/45 tracking-widest uppercase mt-0.5">
              Study Companion
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
                onMouseMove={(e) => handleNavMagnet(item.id, e)}
                onMouseLeave={() => handleNavMagnetLeave(item.id)}
                style={{
                  transform: magneticNav[item.id]
                    ? `translate(${magneticNav[item.id].x}px, ${magneticNav[item.id].y}px)`
                    : "translate(0,0)",
                  transition: magneticNav[item.id]
                    ? "transform 0.1s ease-out"
                    : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.05,
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
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "oklch(0.72 0.17 162 / 0.10)",
                      border: "1px solid oklch(0.72 0.17 162 / 0.20)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{
                      background: "oklch(0.72 0.17 162)",
                      boxShadow: "0 0 10px oklch(0.72 0.17 162 / 0.85)",
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                {/* Icon */}
                <motion.div
                  className="relative z-10 flex-shrink-0"
                  whileHover={{ scale: 1.18, rotate: isActive ? 0 : -5 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] ${
                      isActive ? "text-primary" : ""
                    }`}
                  />
                </motion.div>
                <span className="relative z-10 font-medium">{item.label}</span>

                {/* Active glow dot */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-glow"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "oklch(0.72 0.17 162 / 0.7)",
                      boxShadow: "0 0 7px oklch(0.72 0.17 162 / 0.9)",
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
              className="w-2 h-2 rounded-full"
              style={{
                background: "oklch(0.72 0.17 162)",
                boxShadow: "0 0 7px oklch(0.72 0.17 162 / 0.85)",
              }}
            />
            <span className="text-xs text-muted-foreground/55 tracking-wide">
              Active session
            </span>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
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
          <span
            className="font-display font-bold text-foreground tracking-tight"
            style={{
              fontFamily:
                "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
            }}
          >
            Focus<span className="text-gradient-primary">Flow</span>
          </span>
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground tracking-wide">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main
          className={`flex-1 relative ${
            activeTab === "whiteboard" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`relative z-10 ${
              activeTab === "whiteboard" ? "h-full flex flex-col" : ""
            }`}
          >
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  data-ocid="dashboard.section"
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
                  data-ocid="timer.section"
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
                  data-ocid="music.section"
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
                  data-ocid="todo.section"
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
                  data-ocid="meditation.section"
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
                  data-ocid="ai.section"
                  className="h-full"
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <AIAssistant />
                </motion.div>
              )}
              {activeTab === "whiteboard" && (
                <motion.div
                  key="whiteboard"
                  data-ocid="whiteboard.section"
                  className="flex-1 flex flex-col h-full"
                  style={{ minHeight: "calc(100vh - 60px)" }}
                  initial={pageVariants.initial}
                  animate={pageVariants.animate}
                  exit={pageVariants.exit}
                  transition={pageTransition}
                >
                  <Whiteboard />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {activeTab !== "whiteboard" && (
            <footer className="px-6 py-5 text-center">
              <p className="text-xs text-muted-foreground/30 tracking-wide">
                © {new Date().getFullYear()} · Built with ❤️ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground/60 transition-colors"
                >
                  caffeine.ai
                </a>
              </p>
            </footer>
          )}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden border-t border-border glass-card flex items-center justify-around px-1 py-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                data-ocid={item.ocid}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors min-w-0 flex-shrink-0 ${
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
                  className={`text-[10px] font-medium ${
                    isActive ? "text-primary" : ""
                  }`}
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

      {/* Persistent mini status bar */}
      <MiniStatusBar
        onGoToTimer={() => setActiveTab("timer")}
        onGoToMusic={() => setActiveTab("music")}
      />

      <Toaster
        theme="dark"
        toastOptions={{
          className: "glass-elevated border-border",
          style: { backdropFilter: "blur(28px)" },
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
