import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAskQuestion } from "../hooks/useQueries";

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

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate: askQuestion, isPending } = useAskQuestion();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is stable
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);

    askQuestion(question, {
      onSuccess: (answer) => {
        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer,
        };
        setMessages((prev) => [...prev, aiMsg]);
      },
      onError: () => {
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
        };
        setMessages((prev) => [...prev, errMsg]);
      },
    });
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
