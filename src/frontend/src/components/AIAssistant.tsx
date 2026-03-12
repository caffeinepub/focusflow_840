import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "Give me a study tip",
  "How to focus better?",
  "Explain Pomodoro technique",
  "Help me stay motivated",
];

const AI_KNOWLEDGE: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["pomodoro", "technique", "timer method"],
    response:
      "The Pomodoro Technique is a time management method developed by Francesco Cirillo. It works like this: 1) Choose a task. 2) Set a timer for 25 minutes and work with full focus. 3) Take a 5-minute break. 4) After 4 pomodoros, take a longer 15–30 minute break. It helps beat procrastination and keeps your mind fresh!",
  },
  {
    keywords: ["focus", "concentrate", "distraction", "attention"],
    response:
      "To focus better: Remove distractions (phone on silent, close unrelated tabs). Use the Pomodoro technique for structured work intervals. Try ambient music or white noise to drown out background noise. Keep water nearby and stay hydrated. Set a clear intention before each study session — write down exactly what you want to accomplish.",
  },
  {
    keywords: ["motivat", "lazy", "procrastinat", "stuck"],
    response:
      "Motivation tips: Break your task into tiny, concrete steps — just start with 2 minutes. Reward yourself after completing blocks of work. Remind yourself of your 'why' — why does this matter to you? Visualize finishing and the feeling it brings. Progress, not perfection! Even 20 minutes of focused study is a win.",
  },
  {
    keywords: [
      "study tip",
      "study habit",
      "how to study",
      "study better",
      "study smart",
    ],
    response:
      "Top study tips: 1) Active recall — test yourself instead of re-reading notes. 2) Spaced repetition — review material at increasing intervals. 3) Teach what you learn to someone else. 4) Mix subjects (interleaving) to boost retention. 5) Get enough sleep — memory consolidates during sleep. 6) Use the Feynman technique: explain concepts in simple words.",
  },
  {
    keywords: ["memory", "remember", "forget", "memorize", "retention"],
    response:
      "To improve memory: Use spaced repetition (tools like Anki work great). Create vivid mental images or stories around facts. Use acronyms and mnemonics. Teach it to someone else — explanation strengthens encoding. Sleep is crucial — don't skip it before exams. Exercise also significantly boosts memory and cognitive function.",
  },
  {
    keywords: ["note", "notes", "note-taking"],
    response:
      "Effective note-taking methods: Try the Cornell Method (main notes on the right, cues/keywords on the left, summary at the bottom). Mind mapping works great for visual learners. Use the outline method for structured lectures. Don't copy everything verbatim — paraphrase in your own words to process information better.",
  },
  {
    keywords: ["exam", "test", "revision", "review"],
    response:
      "Exam preparation tips: Start revising at least a week early. Focus on past papers — they reveal patterns. Use active recall: cover your notes and try to recall the content. Prioritize weaker topics but don't ignore strengths. On exam day, get good sleep, eat well, and read questions carefully before answering.",
  },
  {
    keywords: ["stress", "anxious", "anxiety", "overwhelm", "burnout"],
    response:
      "Feeling overwhelmed is normal. Take it one step at a time. Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Write down everything on your mind to clear mental clutter. Take short breaks — your brain needs rest to perform well. Remember: rest is productive. Speak to someone if stress becomes too much.",
  },
  {
    keywords: ["sleep", "tired", "rest"],
    response:
      "Sleep is one of the most powerful study tools. During sleep, your brain consolidates and organizes what you learned. Aim for 7–9 hours. Avoid screens an hour before bed. Pulling all-nighters often backfires — a rested brain outperforms an exhausted one every time.",
  },
  {
    keywords: ["math", "mathematics", "calculus", "algebra", "equation"],
    response:
      "For math: Practice daily — math is a skill, not just knowledge. Work through problems step by step and understand each step before moving on. When stuck, try solving a simpler version of the problem first. Review your mistakes — they're your best teachers. Khan Academy and YouTube are great free resources.",
  },
  {
    keywords: ["science", "physics", "chemistry", "biology"],
    response:
      "For science subjects: Connect concepts to real-world examples to make them stick. Draw diagrams whenever possible — visual representations help enormously. For physics/chemistry, practice derivations and problem-solving. For biology, use mnemonics for processes and systems. Understanding mechanisms beats rote memorization.",
  },
  {
    keywords: ["reading", "textbook", "book", "comprehension"],
    response:
      "For effective reading: Preview the chapter (headings, summaries) before reading in full. Read actively — ask questions as you go. After each section, pause and recall the key ideas without looking. Annotate or highlight sparingly. Summarize each chapter in your own words after finishing.",
  },
  {
    keywords: ["time management", "schedule", "plan", "organize", "routine"],
    response:
      "Time management essentials: Plan your week on Sunday — block time for study, breaks, and fun. Prioritize with the Eisenhower Matrix (urgent/important). Batch similar tasks together. Set specific start/end times for study blocks. Track how you actually spend your time for a week — most people are surprised by the results.",
  },
  {
    keywords: ["break", "rest", "relax", "recharge"],
    response:
      "Breaks are essential, not optional! Short breaks (5–10 min) after 25–45 min of focused work maintain peak performance. During breaks: step away from screens, stretch, take a short walk, or do deep breathing. Longer breaks (20–30 min) after every 4 sessions help prevent burnout.",
  },
  {
    keywords: ["goal", "target", "achieve", "success"],
    response:
      "Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound. Break big goals into weekly and daily milestones. Track your progress — seeing progress is motivating. Celebrate small wins. Adjust goals as needed; flexibility is a strength, not a failure.",
  },
];

function getAIResponse(question: string): string {
  const q = question.toLowerCase();
  for (const item of AI_KNOWLEDGE) {
    for (const keyword of item.keywords) {
      if (q.includes(keyword)) {
        return item.response;
      }
    }
  }
  // Fallback
  return "Great question! Here's a general study tip: The most effective learners use active recall (testing themselves), spaced repetition (revisiting material over time), and interleaved practice (mixing topics). Try to understand concepts deeply rather than memorizing surface facts. Is there a specific subject or challenge I can help you with?";
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is stable
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question || isPending) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsPending(true);

    // Simulate a short thinking delay for a natural feel
    setTimeout(
      () => {
        const answer = getAIResponse(question);
        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsPending(false);
      },
      700 + Math.random() * 500,
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full p-6 max-w-3xl mx-auto">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-heading text-foreground">AI Study Assistant</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
          Ask anything about studying, concepts, or staying focused
        </p>
      </motion.div>

      {/* Chat area */}
      <motion.div
        className="glass-elevated rounded-2xl flex flex-col overflow-hidden"
        style={{ height: "calc(100vh - 300px)", minHeight: 380 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
      >
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div
              data-ocid="ai.empty_state"
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center mb-5 glow-primary"
              >
                <Bot className="w-10 h-10 text-primary" />
              </motion.div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                Your AI Study Buddy
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Ask me anything about study techniques, concepts, time
                management, or motivation. I'm here to help!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{
                    opacity: 0,
                    x: msg.role === "user" ? 20 : -20,
                    scale: 0.96,
                  }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-cyan-500/15 border border-cyan-500/20"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>

                  {/* Bubble */}
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.28,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? {
                            background: "oklch(0.62 0.24 270 / 0.15)",
                            border: "1px solid oklch(0.62 0.24 270 / 0.22)",
                            boxShadow: "0 2px 12px oklch(0.62 0.24 270 / 0.08)",
                            color: "oklch(0.92 0.015 260)",
                          }
                        : {
                            background: "oklch(0.17 0.028 262 / 0.9)",
                            border: "1px solid oklch(0.38 0.05 265 / 0.18)",
                            boxShadow:
                              "0 2px 12px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.05)",
                            color: "oklch(0.88 0.012 260)",
                          }
                    }
                  >
                    {msg.content}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          {isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-center"
              data-ocid="ai.loading_state"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/15 border border-cyan-500/20 flex-shrink-0">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick questions */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex gap-2 flex-wrap">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                type="button"
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isPending}
                data-ocid={i === 0 ? "ai.quick_tip.button" : undefined}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-3 items-end">
            <Textarea
              placeholder="Ask anything... (Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              data-ocid="ai.input"
              rows={2}
              className="flex-1 resize-none bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px]"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={isPending || !input.trim()}
              data-ocid="ai.send_button"
              className="h-11 w-11 p-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-primary flex-shrink-0"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
