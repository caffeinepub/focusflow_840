import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckSquare, Clock, ListTodo, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Filter = "all" | "active" | "completed";

interface LocalTask {
  id: string;
  text: string;
  completed: boolean;
}

// Single sparkle particle
function Sparkle({
  x,
  y,
  color,
  size,
  angle,
  distance,
}: {
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  return (
    <motion.div
      className="fixed pointer-events-none rounded-full z-50"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: color,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    />
  );
}

interface SparkleGroup {
  id: number;
  taskId: string;
  x: number;
  y: number;
}

export function TodoList() {
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tasks, setTasks] = useState<LocalTask[]>(() => {
    try {
      const raw = localStorage.getItem("focusflow_todos");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [sparkleGroups, setSparkleGroups] = useState<SparkleGroup[]>([]);
  const sparkleIdRef = useRef(0);
  useEffect(() => {
    try {
      localStorage.setItem("focusflow_todos", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  function triggerSparkle(taskId: string, x: number, y: number) {
    const id = ++sparkleIdRef.current;
    setSparkleGroups((prev) => [...prev, { id, taskId, x, y }]);
    setTimeout(() => {
      setSparkleGroups((prev) => prev.filter((s) => s.id !== id));
    }, 800);
  }

  function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = newTask.trim();
    if (!text) return;
    const task: LocalTask = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      completed: false,
    };
    setTasks((prev) => [...prev, task]);
    setNewTask("");
    toast.success("Task added!");
  }

  function handleToggle(id: string, e?: React.MouseEvent) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nowCompleted = !t.completed;
          if (nowCompleted && e) {
            triggerSparkle(id, e.clientX, e.clientY);
          }
          return { ...t, completed: nowCompleted };
        }
        return t;
      }),
    );
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success("Task deleted");
  }

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCnt = tasks.filter((t) => !t.completed).length;
  const completedCnt = tasks.filter((t) => t.completed).length;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: tasks.length },
    { key: "active", label: "Active", count: activeCnt },
    { key: "completed", label: "Completed", count: completedCnt },
  ];

  const SPARKLE_COLORS = [
    "oklch(0.75 0.2 270)",
    "oklch(0.7 0.15 210)",
    "oklch(0.78 0.18 55)",
    "oklch(0.72 0.18 145)",
    "oklch(0.82 0.14 340)",
  ];

  const SPARKLE_CONFIG = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360 + (Math.random() * 20 - 10),
    distance: 30 + Math.random() * 35,
    size: 4 + Math.random() * 5,
    color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
  }));

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Sparkle particles (fixed, above everything) */}
      <AnimatePresence>
        {sparkleGroups.map((group) =>
          SPARKLE_CONFIG.map((cfg, i) => (
            <Sparkle
              key={`${group.id}-${i}`}
              x={group.x}
              y={group.y}
              color={cfg.color}
              size={cfg.size}
              angle={cfg.angle}
              distance={cfg.distance}
            />
          )),
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <h1 className="page-heading text-foreground">To-Do List</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
          Track your study goals and tasks
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <motion.div
          className="glass-stat rounded-xl p-3 text-center"
          whileHover={{
            y: -2,
            transition: { type: "spring", stiffness: 400, damping: 22 },
          }}
        >
          <div className="text-2xl font-display font-bold text-gradient-primary">
            {tasks.length}
          </div>
          <div className="section-label text-muted-foreground mt-0.5">
            Total
          </div>
        </motion.div>
        <motion.div
          className="glass-stat rounded-xl p-3 text-center"
          whileHover={{
            y: -2,
            transition: { type: "spring", stiffness: 400, damping: 22 },
          }}
        >
          <div
            className="text-2xl font-display font-bold"
            style={{ color: "oklch(0.8 0.18 55)" }}
          >
            {activeCnt}
          </div>
          <div className="section-label text-muted-foreground mt-0.5">
            Active
          </div>
        </motion.div>
        <motion.div
          className="glass-stat rounded-xl p-3 text-center"
          whileHover={{
            y: -2,
            transition: { type: "spring", stiffness: 400, damping: 22 },
          }}
        >
          <div
            className="text-2xl font-display font-bold"
            style={{ color: "oklch(0.72 0.17 150)" }}
          >
            {completedCnt}
          </div>
          <div className="section-label text-muted-foreground mt-0.5">Done</div>
        </motion.div>
      </motion.div>

      {/* Add task */}
      <motion.div
        className="glass-card rounded-2xl p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <form onSubmit={handleAdd} className="flex gap-3">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            data-ocid="todo.input"
            className="flex-1 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-11 focus:border-primary/50 focus:ring-primary/20 transition-colors"
          />
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.03 }}>
            <Button
              type="submit"
              disabled={!newTask.trim()}
              data-ocid="todo.add_button"
              className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl glow-primary transition-all relative overflow-hidden group"
            >
              <Plus className="w-5 h-5 relative z-10" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-15deg]" />
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {filters.map((f) => (
          <motion.button
            type="button"
            key={f.key}
            onClick={() => setFilter(f.key)}
            data-ocid="todo.filter.tab"
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "glass-card text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
            whileTap={{ scale: 0.96 }}
          >
            {f.key === "all" && <ListTodo className="w-3.5 h-3.5" />}
            {f.key === "active" && <Clock className="w-3.5 h-3.5" />}
            {f.key === "completed" && <CheckSquare className="w-3.5 h-3.5" />}
            {f.label}
            <motion.span
              layout
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                filter === f.key
                  ? "bg-primary/20 text-primary"
                  : "bg-white/5 text-muted-foreground"
              }`}
            >
              {f.count}
            </motion.span>
          </motion.button>
        ))}
      </motion.div>

      {/* Task list */}
      <motion.div
        className="glass-card rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {filtered.length === 0 ? (
          <div data-ocid="todo.empty_state" className="py-12 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
            >
              <CheckSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            </motion.div>
            <p className="text-muted-foreground text-sm">
              {filter === "completed"
                ? "No completed tasks yet"
                : filter === "active"
                  ? "All caught up! 🎉"
                  : "Add your first task above"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((task, idx) => (
              <motion.div
                key={task.id}
                layoutId={task.id}
                layout
                data-ocid={`todo.item.${idx + 1}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{
                  opacity: 0,
                  x: 20,
                  height: 0,
                  transition: { duration: 0.22, ease: [0.55, 0, 1, 0.45] },
                }}
                transition={{
                  duration: 0.28,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  layout: { type: "spring", stiffness: 400, damping: 30 },
                }}
                className={`flex items-center gap-4 px-4 border-b border-white/5 last:border-0 transition-colors group overflow-hidden ${
                  task.completed ? "opacity-50 bg-white/1" : "hover:bg-white/3"
                }`}
                style={{ paddingTop: 14, paddingBottom: 14 }}
                whileHover={{ x: 2 }}
              >
                {/* Checkbox with click event for sparkle */}
                <button
                  type="button"
                  onClick={(e) => handleToggle(task.id, e)}
                  className="cursor-pointer p-0 bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => {}}
                    data-ocid={`todo.checkbox.${idx + 1}`}
                    className="border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                  />
                </button>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={task.completed ? "done" : "active"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex-1 text-sm ${
                      task.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.text}
                  </motion.span>
                </AnimatePresence>

                {/* Completed badge */}
                {task.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-shrink-0 text-xs text-emerald-400/70 font-medium"
                  >
                    ✓
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    data-ocid={`todo.delete_button.${idx + 1}`}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
