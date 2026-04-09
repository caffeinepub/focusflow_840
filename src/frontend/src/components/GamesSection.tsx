import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { ChevronRight, Gamepad2, Lock, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chess: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    STOCKFISH: any;
  }
}

// ─────────────────────────────────────────────
// Daily seed utilities
// ─────────────────────────────────────────────
function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  const s = [...arr];
  let r = seed;
  for (let i = s.length - 1; i > 0; i--) {
    r = (r * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(r) % (i + 1);
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s.slice(0, count);
}

type GameTab =
  | "chess"
  | "crossword"
  | "brain"
  | "riddles"
  | "sudoku"
  | "wordsearch"
  | "logic"
  | "typing";

// ─────────────────────────────────────────────
// Locked Gate
// ─────────────────────────────────────────────
function LockedGate({ todayMinutes }: { todayMinutes: number }) {
  const needed = 300 - todayMinutes;
  const hoursLeft = Math.floor(needed / 60);
  const minsLeft = needed % 60;
  const progress = Math.min((todayMinutes / 300) * 100, 100);
  const studiedHours = Math.floor(todayMinutes / 60);
  const studiedMins = todayMinutes % 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-6"
    >
      <div
        className="glass-card rounded-3xl p-10 max-w-md w-full text-center relative overflow-hidden"
        style={{
          border: "1px solid oklch(0.72 0.17 162 / 0.2)",
          boxShadow:
            "0 0 60px oklch(0.72 0.17 162 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.05)",
        }}
      >
        {/* Glow bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.17 162 / 0.07), transparent 70%)",
          }}
        />

        {/* Lock icon */}
        <motion.div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.08 162), oklch(0.13 0.04 180))",
            border: "1px solid oklch(0.72 0.17 162 / 0.25)",
            boxShadow: "0 0 30px oklch(0.72 0.17 162 / 0.18)",
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Lock className="w-9 h-9" style={{ color: "oklch(0.72 0.17 162)" }} />
        </motion.div>

        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}
        >
          Games are{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.17 162), oklch(0.78 0.16 75))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Locked
          </span>
        </h2>

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          You've earned{" "}
          <span className="text-foreground font-semibold">
            {studiedHours}h {studiedMins}m
          </span>{" "}
          today. Study{" "}
          <span
            className="font-semibold"
            style={{ color: "oklch(0.72 0.17 162)" }}
          >
            {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
            {minsLeft}m more
          </span>{" "}
          to unlock all games for today!
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% · Goal: 5 hours</span>
          </div>
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{ background: "oklch(0.18 0.04 162 / 0.5)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.55 0.17 162), oklch(0.72 0.17 162), oklch(0.78 0.16 75))",
                boxShadow: "0 0 12px oklch(0.72 0.17 162 / 0.6)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
        </div>

        {/* Motivational */}
        <div
          className="mt-5 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "oklch(0.72 0.17 162 / 0.08)",
            border: "1px solid oklch(0.72 0.17 162 / 0.15)",
          }}
        >
          <span style={{ color: "oklch(0.72 0.17 162)" }}>💡</span>{" "}
          <span className="text-muted-foreground italic">
            "Champions train first, then play. Keep going — you're almost
            there!"
          </span>
        </div>

        {/* Game previews (blurred) */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { emoji: "♟️", name: "Chess" },
            { emoji: "📝", name: "Words" },
            { emoji: "🧠", name: "Brain" },
            { emoji: "🔮", name: "Riddles" },
          ].map((g) => (
            <div
              key={g.name}
              className="rounded-xl py-3 flex flex-col items-center gap-1"
              style={{
                background: "oklch(0.15 0.04 162 / 0.5)",
                border: "1px solid oklch(0.72 0.17 162 / 0.1)",
                opacity: 0.45,
                filter: "blur(1px)",
              }}
            >
              <span className="text-xl">{g.emoji}</span>
              <span className="text-[10px] text-muted-foreground">
                {g.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CHESS
// ─────────────────────────────────────────────
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_UNICODE: Record<string, string> = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

function ChessGame() {
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chessRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stockfishRef = useRef<any>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [status, setStatus] = useState<string>("Your turn (White)");
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(5);
  const [thinking, setThinking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const syncBoard = useCallback(() => {
    if (!chessRef.current) return;
    const game = chessRef.current;
    const newBoard: string[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(""));
    const chessBoard = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = chessBoard[r][c];
        if (piece) {
          newBoard[r][c] =
            (piece.color === "w" ? "w" : "b") + piece.type.toUpperCase();
        }
      }
    }
    setBoard(newBoard);

    if (game.in_checkmate()) {
      setStatus(
        game.turn() === "w"
          ? "Checkmate! Stockfish wins 🤖"
          : "Checkmate! You win! 🏆",
      );
      setGameOver(true);
    } else if (game.in_draw()) {
      setStatus("Draw!");
      setGameOver(true);
    } else if (game.in_check()) {
      setStatus(
        game.turn() === "w" ? "Check! Your turn" : "Check! Stockfish's turn",
      );
    } else {
      setStatus(
        game.turn() === "w" ? "Your turn (White)" : "Stockfish thinking...",
      );
    }
  }, []);

  const stockfishMove = useCallback(() => {
    if (!chessRef.current || !stockfishRef.current) return;
    const game = chessRef.current;
    if (game.game_over() || game.turn() !== "b") return;

    setThinking(true);
    const sf = stockfishRef.current;
    sf.postMessage(`setoption name Skill Level value ${difficulty}`);
    sf.postMessage(`position fen ${game.fen()}`);
    sf.postMessage("go movetime 800");
  }, [difficulty]);

  useEffect(() => {
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    Promise.all([
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js",
      ),
    ])
      .then(() => {
        if (!window.Chess) throw new Error("Chess.js not found");
        chessRef.current = new window.Chess();
        syncBoard();

        // Stockfish via worker
        try {
          const workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";
          const blob = new Blob([`importScripts('${workerSrc}');`], {
            type: "application/javascript",
          });
          const worker = new Worker(URL.createObjectURL(blob));
          stockfishRef.current = worker;
          worker.onmessage = (e: MessageEvent) => {
            const msg: string = e.data;
            if (msg.startsWith("bestmove")) {
              setThinking(false);
              const parts = msg.split(" ");
              const moveStr = parts[1];
              if (!moveStr || moveStr === "(none)") return;
              if (!chessRef.current) return;
              const from = moveStr.slice(0, 2);
              const to = moveStr.slice(2, 4);
              const promotion = moveStr[4] || undefined;
              const result = chessRef.current.move({
                from,
                to,
                promotion: promotion || "q",
              });
              if (result) {
                setLastMove({ from, to });
                syncBoard();
              }
            }
          };
          worker.onerror = () => {
            setThinking(false);
          };
          worker.postMessage("uci");
        } catch {
          // Stockfish failed — just allow manual moves
        }

        setReady(true);
      })
      .catch((err) => {
        setLoadError(err.message);
      });

    return () => {
      stockfishRef.current?.terminate?.();
    };
  }, [syncBoard]);

  function handleSquareClick(row: number, col: number) {
    if (!chessRef.current || gameOver || thinking) return;
    const game = chessRef.current;
    if (game.turn() !== "w") return;

    const sq = FILES[col] + (8 - row);

    if (selected) {
      if (legalMoves.includes(sq)) {
        const result = game.move({ from: selected, to: sq, promotion: "q" });
        if (result) {
          setLastMove({ from: selected, to: sq });
          setSelected(null);
          setLegalMoves([]);
          syncBoard();
          if (!game.game_over()) {
            setTimeout(() => stockfishMove(), 300);
          }
          return;
        }
      }
      // Deselect or select new piece
      const moves = game.moves({ square: sq, verbose: true });
      if (moves.length > 0 && game.get(sq)?.color === "w") {
        setSelected(sq);
        setLegalMoves(moves.map((m: { to: string }) => m.to));
      } else {
        setSelected(null);
        setLegalMoves([]);
      }
    } else {
      const piece = game.get(sq);
      if (piece && piece.color === "w") {
        const moves = game.moves({ square: sq, verbose: true });
        setSelected(sq);
        setLegalMoves(moves.map((m: { to: string }) => m.to));
      }
    }
  }

  function resetGame() {
    if (!chessRef.current) return;
    chessRef.current.reset();
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setGameOver(false);
    syncBoard();
  }

  if (loadError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Failed to load chess engine: {loadError}</p>
        <p className="text-sm mt-2">
          Check your internet connection and try again.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="text-center py-16 text-muted-foreground animate-pulse">
        Loading chess engine...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Difficulty:</span>
          <div className="flex gap-1">
            {[1, 3, 5, 7, 10].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:
                    difficulty === lvl
                      ? "oklch(0.72 0.17 162 / 0.25)"
                      : "oklch(0.15 0.04 162 / 0.4)",
                  border: `1px solid ${difficulty === lvl ? "oklch(0.72 0.17 162 / 0.5)" : "oklch(0.72 0.17 162 / 0.1)"}`,
                  color: difficulty === lvl ? "oklch(0.72 0.17 162)" : "",
                }}
              >
                {lvl === 1
                  ? "Easy"
                  : lvl === 3
                    ? "Med"
                    : lvl === 5
                      ? "Hard"
                      : lvl === 7
                        ? "Expert"
                        : "Max"}
              </button>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetGame}
          className="border-border/50 text-sm"
        >
          New Game
        </Button>
      </div>

      {/* Status */}
      <div
        className="px-4 py-2 rounded-xl text-sm font-medium"
        style={{
          background: gameOver
            ? "oklch(0.72 0.16 75 / 0.12)"
            : "oklch(0.72 0.17 162 / 0.10)",
          border: `1px solid ${gameOver ? "oklch(0.72 0.16 75 / 0.25)" : "oklch(0.72 0.17 162 / 0.20)"}`,
          color: gameOver ? "oklch(0.72 0.16 75)" : "oklch(0.72 0.17 162)",
        }}
      >
        {thinking ? "🤖 Stockfish is thinking..." : status}
      </div>

      {/* Chess board */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 40px oklch(0.72 0.17 162 / 0.12), 0 8px 32px rgba(0,0,0,0.5)",
          border: "2px solid oklch(0.72 0.17 162 / 0.2)",
        }}
      >
        {/* Rank labels */}
        <div className="flex">
          <div className="flex flex-col" style={{ width: 24 }}>
            {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
              <div
                key={rank}
                className="flex items-center justify-center text-xs text-muted-foreground/50"
                style={{ height: 64 }}
              >
                {rank}
              </div>
            ))}
          </div>
          <div>
            {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => {
              const row = 8 - rank;
              return (
                <div key={rank} className="flex">
                  {FILES.map((file) => {
                    const col = FILES.indexOf(file);
                    const isLight = (row + col) % 2 === 0;
                    const sq = file + rank;
                    const pieceKey = board[row]?.[col] ?? "";
                    const isSelected = selected === sq;
                    const isLegal = legalMoves.includes(sq);
                    const isLastMove =
                      lastMove?.from === sq || lastMove?.to === sq;

                    return (
                      <button
                        type="button"
                        key={file + rank}
                        onClick={() => handleSquareClick(row, col)}
                        className="relative flex items-center justify-center transition-colors"
                        style={{
                          width: 68,
                          height: 68,
                          background: isSelected
                            ? "oklch(0.72 0.17 162 / 0.55)"
                            : isLastMove
                              ? "oklch(0.78 0.16 75 / 0.35)"
                              : isLight
                                ? "oklch(0.88 0.03 90)"
                                : "oklch(0.35 0.05 162)",
                          fontSize: 38,
                          lineHeight: 1,
                          cursor: "pointer",
                        }}
                      >
                        {isLegal && (
                          <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              width: pieceKey ? 60 : 22,
                              height: pieceKey ? 60 : 22,
                              background: pieceKey
                                ? "oklch(0.72 0.17 162 / 0.35)"
                                : "oklch(0.72 0.17 162 / 0.55)",
                              border: pieceKey
                                ? "3px solid oklch(0.72 0.17 162 / 0.7)"
                                : "none",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        {pieceKey && (
                          <span
                            className="relative z-10 select-none"
                            style={{
                              fontSize: 42,
                              color: pieceKey.startsWith("b")
                                ? "#0a0a0a"
                                : "#ffffff",
                              textShadow: pieceKey.startsWith("b")
                                ? "0 0 6px rgba(255,255,255,0.6), 0 0 12px rgba(255,255,255,0.4), 1px 1px 0 rgba(255,255,255,0.3)"
                                : "0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8), 1px 1px 0 #000",
                              filter: pieceKey.startsWith("b")
                                ? "drop-shadow(0 2px 4px rgba(0,0,0,0.9))"
                                : "drop-shadow(0 2px 4px rgba(0,0,0,1))",
                            }}
                          >
                            {PIECE_UNICODE[pieceKey] || ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {/* File labels */}
            <div className="flex">
              {FILES.map((f) => (
                <div
                  key={f}
                  className="flex items-center justify-center text-xs text-muted-foreground/50"
                  style={{ width: 64, height: 20 }}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CROSSWORD - Multiple daily layouts
// ─────────────────────────────────────────────
// Words: STUDY(0,0 across), FOCUS(0,0 down), TIMER(2,0 across), LEARN(4,0 across), BRAIN(6,0 across)
// Down: FOCUS(0,0), NOTE(0,5 down), READ(2,2 down), QUIZ(4,3 down), WRITE(6,1 down)

interface CrosswordCell {
  letter: string;
  editable: boolean;
  number?: number;
  row: number;
  col: number;
}

interface CrosswordClue {
  number: number;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  clue: string;
  answer: string;
}

// Layout 0: Study Tools theme
const LAYOUT_0: CrosswordClue[] = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    length: 5,
    clue: "Dedicated time to review material",
    answer: "STUDY",
  },
  {
    number: 1,
    direction: "down",
    row: 0,
    col: 0,
    length: 5,
    clue: "Concentrated attention; opposite of distraction",
    answer: "FOCUS",
  },
  {
    number: 2,
    direction: "across",
    row: 2,
    col: 2,
    length: 5,
    clue: "Countdown device used in Pomodoro",
    answer: "TIMER",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 4,
    length: 4,
    clue: "Written observation or reminder",
    answer: "NOTE",
  },
  {
    number: 3,
    direction: "across",
    row: 4,
    col: 1,
    length: 5,
    clue: "Acquire knowledge or a skill",
    answer: "LEARN",
  },
  {
    number: 3,
    direction: "down",
    row: 2,
    col: 2,
    length: 4,
    clue: "To look at written words",
    answer: "READ",
  },
  {
    number: 4,
    direction: "across",
    row: 6,
    col: 0,
    length: 5,
    clue: "Organ used for thinking and learning",
    answer: "BRAIN",
  },
  {
    number: 4,
    direction: "down",
    row: 4,
    col: 5,
    length: 4,
    clue: "Short test of knowledge",
    answer: "QUIZ",
  },
  {
    number: 5,
    direction: "across",
    row: 8,
    col: 1,
    length: 5,
    clue: "A formal evaluation or examination",
    answer: "TESTS",
  },
  {
    number: 5,
    direction: "down",
    row: 6,
    col: 1,
    length: 5,
    clue: "Put words or ideas on paper",
    answer: "WRITE",
  },
];

// Layout 1: Science theme
const LAYOUT_1: CrosswordClue[] = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    length: 5,
    clue: "Basic unit of matter",
    answer: "ATOMS",
  },
  {
    number: 1,
    direction: "down",
    row: 0,
    col: 0,
    length: 4,
    clue: "Rate of change of velocity",
    answer: "ACCE",
  },
  {
    number: 2,
    direction: "across",
    row: 2,
    col: 1,
    length: 5,
    clue: "Study of living organisms",
    answer: "BIOME",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 3,
    length: 5,
    clue: "Measure of thermal energy",
    answer: "TEMPS",
  },
  {
    number: 3,
    direction: "across",
    row: 4,
    col: 0,
    length: 5,
    clue: "Charged particle",
    answer: "IONIC",
  },
  {
    number: 3,
    direction: "down",
    row: 2,
    col: 1,
    length: 4,
    clue: "Science of matter and energy",
    answer: "BPHYS",
  },
  {
    number: 4,
    direction: "across",
    row: 6,
    col: 2,
    length: 5,
    clue: "Smallest unit of an element",
    answer: "ATOMS",
  },
  {
    number: 4,
    direction: "down",
    row: 4,
    col: 4,
    length: 4,
    clue: "Negative particles in atom",
    answer: "IONS",
  },
  {
    number: 5,
    direction: "across",
    row: 8,
    col: 0,
    length: 5,
    clue: "Energy in motion",
    answer: "WAVES",
  },
  {
    number: 5,
    direction: "down",
    row: 6,
    col: 2,
    length: 4,
    clue: "Force that attracts masses",
    answer: "ATMO",
  },
];

// Layout 2: Math theme
const LAYOUT_2: CrosswordClue[] = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    length: 5,
    clue: "Numbers with no decimal part",
    answer: "WHOLE",
  },
  {
    number: 1,
    direction: "down",
    row: 0,
    col: 0,
    length: 5,
    clue: "Longest side of a right triangle",
    answer: "HYPOT",
  },
  {
    number: 2,
    direction: "across",
    row: 2,
    col: 2,
    length: 5,
    clue: "Rate of change (calculus)",
    answer: "DERIV",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 4,
    length: 4,
    clue: "Polynomial of degree two",
    answer: "QUAD",
  },
  {
    number: 3,
    direction: "across",
    row: 4,
    col: 1,
    length: 5,
    clue: "Sum divided by count",
    answer: "MEANS",
  },
  {
    number: 3,
    direction: "down",
    row: 2,
    col: 2,
    length: 5,
    clue: "Distance around a shape",
    answer: "DEPOT",
  },
  {
    number: 4,
    direction: "across",
    row: 6,
    col: 0,
    length: 5,
    clue: "Quantity with direction",
    answer: "VECTO",
  },
  {
    number: 4,
    direction: "down",
    row: 4,
    col: 5,
    length: 5,
    clue: "Set of all outputs",
    answer: "STAND",
  },
  {
    number: 5,
    direction: "across",
    row: 8,
    col: 1,
    length: 5,
    clue: "Study of shapes and space",
    answer: "GEOME",
  },
  {
    number: 5,
    direction: "down",
    row: 6,
    col: 1,
    length: 5,
    clue: "Collection of data values",
    answer: "VALUE",
  },
];

// Layout 3: History theme
const LAYOUT_3: CrosswordClue[] = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    length: 5,
    clue: "Ancient Egyptian writing system",
    answer: "GLYPH",
  },
  {
    number: 1,
    direction: "down",
    row: 0,
    col: 0,
    length: 5,
    clue: "Greek city-state",
    answer: "GREEK",
  },
  {
    number: 2,
    direction: "across",
    row: 2,
    col: 1,
    length: 5,
    clue: "Roman ruler title",
    answer: "CAESA",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 3,
    length: 4,
    clue: "Old document or manuscript",
    answer: "EPIC",
  },
  {
    number: 3,
    direction: "across",
    row: 4,
    col: 0,
    length: 5,
    clue: "Medieval fortified structure",
    answer: "CASTL",
  },
  {
    number: 3,
    direction: "down",
    row: 2,
    col: 1,
    length: 4,
    clue: "Study of the past",
    answer: "CHRO",
  },
  {
    number: 4,
    direction: "across",
    row: 6,
    col: 2,
    length: 5,
    clue: "Ancient river civilization",
    answer: "NILES",
  },
  {
    number: 4,
    direction: "down",
    row: 4,
    col: 4,
    length: 4,
    clue: "Written historical record",
    answer: "LONG",
  },
  {
    number: 5,
    direction: "across",
    row: 8,
    col: 0,
    length: 5,
    clue: "Period before writing",
    answer: "EPOCH",
  },
  {
    number: 5,
    direction: "down",
    row: 6,
    col: 2,
    length: 4,
    clue: "Military leader of old",
    answer: "NORT",
  },
];

// Layout 4: Nature theme
const LAYOUT_4: CrosswordClue[] = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    length: 5,
    clue: "Large body of salt water",
    answer: "OCEAN",
  },
  {
    number: 1,
    direction: "down",
    row: 0,
    col: 0,
    length: 5,
    clue: "Oxygen-producing organisms",
    answer: "OZONE",
  },
  {
    number: 2,
    direction: "across",
    row: 2,
    col: 2,
    length: 5,
    clue: "Rocky peak of a mountain",
    answer: "CREST",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 4,
    length: 4,
    clue: "Dense tropical forest",
    answer: "NONE",
  },
  {
    number: 3,
    direction: "across",
    row: 4,
    col: 1,
    length: 5,
    clue: "Underground water source",
    answer: "RIVER",
  },
  {
    number: 3,
    direction: "down",
    row: 2,
    col: 2,
    length: 4,
    clue: "Seasonal weather pattern",
    answer: "CLIM",
  },
  {
    number: 4,
    direction: "across",
    row: 6,
    col: 0,
    length: 5,
    clue: "Floating water vapor mass",
    answer: "CLOUD",
  },
  {
    number: 4,
    direction: "down",
    row: 4,
    col: 5,
    length: 4,
    clue: "Molten rock from volcano",
    answer: "RAVE",
  },
  {
    number: 5,
    direction: "across",
    row: 8,
    col: 1,
    length: 5,
    clue: "Earth's protective gas layer",
    answer: "OZONE",
  },
  {
    number: 5,
    direction: "down",
    row: 6,
    col: 1,
    length: 5,
    clue: "Sound of thunder or water",
    answer: "LUNAR",
  },
];

const CROSSWORD_LAYOUTS = [LAYOUT_0, LAYOUT_1, LAYOUT_2, LAYOUT_3, LAYOUT_4];
const CROSSWORD_THEMES = [
  "Study Tools 📚",
  "Science 🔬",
  "Mathematics ➕",
  "History 🏛️",
  "Nature 🌿",
];

function buildGrid(clues: CrosswordClue[]) {
  const grid: (CrosswordCell | null)[][] = Array(10)
    .fill(null)
    .map(() => Array(10).fill(null));

  for (const clue of clues) {
    for (let i = 0; i < clue.length; i++) {
      const r = clue.direction === "across" ? clue.row : clue.row + i;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      if (r >= 10 || c >= 10) continue;
      if (!grid[r][c]) {
        grid[r][c] = { letter: clue.answer[i], editable: true, row: r, col: c };
      }
    }
  }

  // Add numbers
  const seen = new Set<string>();
  for (const clue of clues) {
    const key = `${clue.row},${clue.col}`;
    if (!seen.has(key) && grid[clue.row]?.[clue.col]) {
      (grid[clue.row][clue.col] as CrosswordCell).number = clue.number;
      seen.add(key);
    }
  }

  return grid;
}

const TODAY_CROSSWORD_IDX = getDailySeed() % CROSSWORD_LAYOUTS.length;
const CLUES = CROSSWORD_LAYOUTS[TODAY_CROSSWORD_IDX];
const INITIAL_GRID = buildGrid(CLUES);

function CrosswordGame() {
  const [userInput, setUserInput] = useState<Record<string, string>>({});
  const [selectedClue, setSelectedClue] = useState<CrosswordClue | null>(null);
  const [solved, setSolved] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  function checkSolved(input: Record<string, string>) {
    for (const clue of CLUES) {
      for (let i = 0; i < clue.length; i++) {
        const r = clue.direction === "across" ? clue.row : clue.row + i;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        if (r >= 10 || c >= 10) continue;
        const key = getCellKey(r, c);
        const correctLetter = clue.answer[i];
        if ((input[key] || "").toUpperCase() !== correctLetter) return false;
      }
    }
    return true;
  }

  function handleInput(r: number, c: number, value: string) {
    const key = getCellKey(r, c);
    const letter = value.slice(-1).toUpperCase();
    const newInput = { ...userInput, [key]: letter };
    setUserInput(newInput);
    if (checkSolved(newInput)) setSolved(true);
    // Auto advance
    if (letter && selectedClue) {
      const idx =
        selectedClue.direction === "across"
          ? c - selectedClue.col
          : r - selectedClue.row;
      const next = idx + 1;
      if (next < selectedClue.length) {
        const nr =
          selectedClue.direction === "across" ? r : selectedClue.row + next;
        const nc =
          selectedClue.direction === "across" ? selectedClue.col + next : c;
        inputRefs.current[getCellKey(nr, nc)]?.focus();
      }
    }
  }

  function getHighlightedCells(): Set<string> {
    if (!selectedClue) return new Set();
    const cells = new Set<string>();
    for (let i = 0; i < selectedClue.length; i++) {
      const r =
        selectedClue.direction === "across"
          ? selectedClue.row
          : selectedClue.row + i;
      const c =
        selectedClue.direction === "across"
          ? selectedClue.col + i
          : selectedClue.col;
      cells.add(getCellKey(r, c));
    }
    return cells;
  }

  const highlighted = getHighlightedCells();

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-4 items-start justify-center">
      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSolved(false)}
        >
          <div
            className="glass-card rounded-3xl p-12 text-center"
            style={{ border: "1px solid oklch(0.72 0.17 162 / 0.4)" }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3
              className="text-2xl font-bold mb-2"
              style={{ color: "oklch(0.72 0.17 162)" }}
            >
              Puzzle Solved!
            </h3>
            <p className="text-muted-foreground">
              Amazing vocabulary! You completed the crossword.
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      <div className="overflow-auto">
        <div className="inline-block">
          {INITIAL_GRID.map((rowData, r) => (
            <div key={getCellKey(r, 0)} className="flex">
              {rowData.map((cellItem, c) => {
                const cell = cellItem;
                const key = getCellKey(r, c);
                const isHighlighted = highlighted.has(key);

                if (!cell) {
                  return (
                    <div
                      key={`${getCellKey(r, c)}-null`}
                      style={{
                        width: 44,
                        height: 44,
                        background: "oklch(0.08 0.02 162)",
                        border: "1px solid oklch(0.08 0.02 162)",
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={getCellKey(r, c)}
                    className="relative"
                    style={{
                      width: 44,
                      height: 44,
                      border: `1px solid ${isHighlighted ? "oklch(0.72 0.17 162 / 0.5)" : "oklch(0.40 0.08 162 / 0.8)"}`,
                      background: isHighlighted
                        ? "oklch(0.72 0.17 162 / 0.12)"
                        : "oklch(0.22 0.05 162 / 0.9)",
                      transition: "background 0.2s, border 0.2s",
                    }}
                  >
                    {cell.number && (
                      <span className="absolute top-0.5 left-0.5 text-[9px] text-muted-foreground/60 leading-none select-none">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => {
                        inputRefs.current[key] = el;
                      }}
                      maxLength={1}
                      value={userInput[key] || ""}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      onFocus={() => {
                        // Find a clue containing this cell
                        const clue = CLUES.find((cl) => {
                          for (let i = 0; i < cl.length; i++) {
                            const cr =
                              cl.direction === "across" ? cl.row : cl.row + i;
                            const cc =
                              cl.direction === "across" ? cl.col + i : cl.col;
                            if (cr === r && cc === c) return true;
                          }
                          return false;
                        });
                        if (clue) setSelectedClue(clue);
                      }}
                      className="w-full h-full text-center text-sm font-bold uppercase bg-transparent outline-none"
                      style={{
                        paddingTop: cell.number ? 6 : 0,
                        color:
                          (userInput[key] || "").toUpperCase() === cell.letter
                            ? "oklch(0.72 0.17 162)"
                            : "oklch(0.95 0.01 162)",
                        caretColor: "oklch(0.72 0.17 162)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Clues */}
      <div className="flex-1 min-w-0 space-y-4 max-w-xs">
        <div
          className="text-xs px-3 py-1.5 rounded-lg mb-2 font-medium"
          style={{
            background: "oklch(0.72 0.17 162 / 0.10)",
            border: "1px solid oklch(0.72 0.17 162 / 0.2)",
            color: "oklch(0.72 0.17 162)",
          }}
        >
          Today: {CROSSWORD_THEMES[TODAY_CROSSWORD_IDX]}
        </div>
        {(["across", "down"] as const).map((dir) => (
          <div key={dir}>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "oklch(0.72 0.17 162)" }}
            >
              {dir}
            </h4>
            <div className="space-y-1">
              {CLUES.filter((c) => c.direction === dir)
                .filter(
                  (c, i, arr) =>
                    arr.findIndex(
                      (x) => x.number === c.number && x.direction === dir,
                    ) === i,
                )
                .map((clue) => (
                  <button
                    key={`${clue.number}${dir}`}
                    type="button"
                    onClick={() => {
                      setSelectedClue(clue);
                      inputRefs.current[
                        getCellKey(clue.row, clue.col)
                      ]?.focus();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{
                      background:
                        selectedClue?.number === clue.number &&
                        selectedClue.direction === dir
                          ? "oklch(0.72 0.17 162 / 0.12)"
                          : "transparent",
                      border: `1px solid ${
                        selectedClue?.number === clue.number &&
                        selectedClue.direction === dir
                          ? "oklch(0.72 0.17 162 / 0.3)"
                          : "transparent"
                      }`,
                    }}
                  >
                    <span
                      className="font-bold mr-1"
                      style={{ color: "oklch(0.72 0.17 162)" }}
                    >
                      {clue.number}.
                    </span>
                    <span className="text-muted-foreground">{clue.clue}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-xs text-muted-foreground/50 italic col-span-2">
        🌙 New crossword tomorrow!
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BRAIN GAMES
// ─────────────────────────────────────────────
const ALL_EMOJIS = [
  "🎯",
  "🧠",
  "🚀",
  "⚡",
  "🌟",
  "🎭",
  "🦋",
  "🏆",
  "🦁",
  "🐬",
  "🌈",
  "🔥",
  "🍀",
  "🎪",
  "🦄",
  "🐉",
  "🌺",
  "🎸",
  "🏋️",
  "🎨",
  "🦅",
  "🐙",
  "🌙",
  "☀️",
  "🎲",
  "🎻",
  "🦊",
  "🐺",
  "🌊",
  "🎠",
];
const DAILY_EMOJIS = seededPick(ALL_EMOJIS, getDailySeed(), 8);

interface MemoryCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    shuffle(
      [...DAILY_EMOJIS, ...DAILY_EMOJIS].map((e, i) => ({
        id: i,
        emoji: e,
        flipped: false,
        matched: false,
      })),
    ),
  );
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (complete) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [complete, startTime]);

  function flipCard(id: number) {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.length >= 2) return;

    const newFlipped = [...flippedIds, id];
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)),
    );
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = newFlipped;
      const cardA = cards.find((c) => c.id === a);
      const cardB = cards.find((c) => c.id === b);
      setTimeout(() => {
        if (cardA?.emoji === cardB?.emoji) {
          setCards((prev) => {
            const next = prev.map((c) =>
              c.id === a || c.id === b ? { ...c, matched: true } : c,
            );
            if (next.every((c) => c.matched)) setComplete(true);
            return next;
          });
        } else {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a || c.id === b ? { ...c, flipped: false } : c,
            ),
          );
        }
        setFlippedIds([]);
        lockRef.current = false;
      }, 900);
    }
  }

  function reset() {
    setCards(
      shuffle(
        [...DAILY_EMOJIS, ...DAILY_EMOJIS].map((e, i) => ({
          id: i,
          emoji: e,
          flipped: false,
          matched: false,
        })),
      ),
    );
    setFlippedIds([]);
    setMoves(0);
    setComplete(false);
    lockRef.current = false;
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="flex items-center gap-6 text-sm">
        <span className="text-muted-foreground">
          Moves: <span className="text-foreground font-bold">{moves}</span>
        </span>
        <span className="text-muted-foreground">
          Time: <span className="text-foreground font-bold">{elapsed}s</span>
        </span>
        <Button size="sm" variant="outline" onClick={reset} className="text-xs">
          Reset
        </Button>
      </div>

      {complete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 px-6 rounded-2xl"
          style={{
            background: "oklch(0.72 0.17 162 / 0.12)",
            border: "1px solid oklch(0.72 0.17 162 / 0.3)",
          }}
        >
          <span
            className="text-lg font-bold"
            style={{ color: "oklch(0.72 0.17 162)" }}
          >
            🏆 Completed in {moves} moves & {elapsed}s!
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => flipCard(card.id)}
            whileHover={{ scale: card.matched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 rounded-xl text-2xl flex items-center justify-center transition-all"
            style={{
              background:
                card.flipped || card.matched
                  ? card.matched
                    ? "oklch(0.72 0.17 162 / 0.20)"
                    : "oklch(0.20 0.06 162 / 0.8)"
                  : "oklch(0.18 0.06 240 / 0.8)",
              border: `1px solid ${card.matched ? "oklch(0.72 0.17 162 / 0.4)" : card.flipped ? "oklch(0.72 0.17 162 / 0.25)" : "oklch(0.30 0.06 240 / 0.5)"}`,
              boxShadow: card.matched
                ? "0 0 15px oklch(0.72 0.17 162 / 0.25)"
                : "none",
            }}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span
                  key="front"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {card.emoji}
                </motion.span>
              ) : (
                <motion.span
                  key="back"
                  className="text-muted-foreground/30 text-xl"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      <div className="text-center mt-3 text-xs text-muted-foreground/50 italic">
        🌙 New cards tomorrow!
      </div>
    </div>
  );
}

const ALL_MATH_QUESTIONS = [
  { q: "12 × 7 = ?", a: 84 },
  { q: "144 ÷ 12 = ?", a: 12 },
  { q: "23 + 48 = ?", a: 71 },
  { q: "100 - 37 = ?", a: 63 },
  { q: "9 × 9 = ?", a: 81 },
  { q: "256 ÷ 16 = ?", a: 16 },
  { q: "17 × 6 = ?", a: 102 },
  { q: "89 + 56 = ?", a: 145 },
  { q: "200 - 84 = ?", a: 116 },
  { q: "13 × 13 = ?", a: 169 },
  { q: "48 ÷ 6 = ?", a: 8 },
  { q: "25 × 4 = ?", a: 100 },
  { q: "√144 = ?", a: 12 },
  { q: "7³ = ?", a: 343 },
  { q: "99 + 99 = ?", a: 198 },
  { q: "15 × 15 = ?", a: 225 },
  { q: "1000 - 337 = ?", a: 663 },
  { q: "36 ÷ 4 × 3 = ?", a: 27 },
  { q: "2^8 = ?", a: 256 },
  { q: "√625 = ?", a: 25 },
  { q: "11 × 11 = ?", a: 121 },
  { q: "72 ÷ 8 = ?", a: 9 },
  { q: "45 + 78 = ?", a: 123 },
  { q: "300 - 147 = ?", a: 153 },
  { q: "16 × 4 = ?", a: 64 },
  { q: "121 ÷ 11 = ?", a: 11 },
  { q: "33 × 3 = ?", a: 99 },
  { q: "√81 = ?", a: 9 },
  { q: "5^4 = ?", a: 625 },
  { q: "2^10 = ?", a: 1024 },
  { q: "14 × 8 = ?", a: 112 },
  { q: "56 ÷ 7 = ?", a: 8 },
  { q: "67 + 98 = ?", a: 165 },
  { q: "500 - 263 = ?", a: 237 },
  { q: "√196 = ?", a: 14 },
  { q: "3^5 = ?", a: 243 },
  { q: "18 × 9 = ?", a: 162 },
  { q: "96 ÷ 8 = ?", a: 12 },
  { q: "54 + 87 = ?", a: 141 },
  { q: "1000 - 456 = ?", a: 544 },
];
const MATH_QUESTIONS = seededPick(ALL_MATH_QUESTIONS, getDailySeed(), 20);

function MathQuiz() {
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      nextQuestion(false);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, finished]);

  function nextQuestion(wasCorrect: boolean) {
    if (wasCorrect) setScore((s) => s + 1);
    if (qIndex + 1 >= MATH_QUESTIONS.length) {
      setFinished(true);
    } else {
      setQIndex((i) => i + 1);
      setAnswer("");
      setTimeLeft(30);
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function submit() {
    const correct = Number.parseInt(answer) === MATH_QUESTIONS[qIndex].a;
    setFeedback(correct ? "correct" : "wrong");
    setTimeout(() => nextQuestion(correct), 800);
  }

  function restart() {
    setQIndex(0);
    setAnswer("");
    setScore(0);
    setTimeLeft(30);
    setFinished(false);
    setFeedback(null);
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 flex flex-col items-center gap-4"
      >
        <Trophy
          className="w-16 h-16"
          style={{ color: "oklch(0.78 0.16 75)" }}
        />
        <h3 className="text-2xl font-bold">Quiz Complete!</h3>
        <p className="text-muted-foreground">
          You scored{" "}
          <span className="font-bold text-foreground">
            {score}/{MATH_QUESTIONS.length}
          </span>
        </p>
        <div
          className="px-4 py-2 rounded-xl text-sm"
          style={{
            background:
              score >= 15
                ? "oklch(0.72 0.17 162 / 0.12)"
                : "oklch(0.72 0.16 75 / 0.10)",
            border: `1px solid ${score >= 15 ? "oklch(0.72 0.17 162 / 0.3)" : "oklch(0.72 0.16 75 / 0.3)"}`,
            color: score >= 15 ? "oklch(0.72 0.17 162)" : "oklch(0.72 0.16 75)",
          }}
        >
          {score >= 18
            ? "🌟 Outstanding! Einstein-level math!"
            : score >= 15
              ? "🎯 Great work! Keep practicing!"
              : score >= 10
                ? "📚 Good effort! Review your formulas."
                : "💪 Keep practicing — you'll improve!"}
        </div>
        <Button onClick={restart} className="mt-2">
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 max-w-sm mx-auto">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            Question {qIndex + 1} / {MATH_QUESTIONS.length} ·{" "}
            <span className="text-muted-foreground/50 text-xs italic">
              refreshes daily
            </span>
          </span>
          <span>Score: {score}</span>
        </div>
        <Progress
          value={(qIndex / MATH_QUESTIONS.length) * 100}
          className="h-1.5"
        />
      </div>

      {/* Timer */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
        style={{
          background: `conic-gradient(${timeLeft > 10 ? "oklch(0.72 0.17 162)" : "oklch(0.65 0.18 25)"} ${(timeLeft / 30) * 360}deg, oklch(0.15 0.04 162 / 0.5) 0deg)`,
          boxShadow: `0 0 20px ${timeLeft > 10 ? "oklch(0.72 0.17 162 / 0.3)" : "oklch(0.65 0.18 25 / 0.4)"}`,
        }}
      >
        {timeLeft}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="text-center"
        >
          <div
            className="text-3xl font-bold py-6 px-8 rounded-2xl"
            style={{
              background: "oklch(0.14 0.04 162 / 0.6)",
              border: "1px solid oklch(0.72 0.17 162 / 0.2)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {MATH_QUESTIONS[qIndex].q}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer input */}
      <div className="flex gap-3 w-full">
        <input
          ref={inputRef}
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && answer && submit()}
          className="flex-1 text-center text-xl font-bold rounded-xl px-4 py-3 outline-none"
          style={{
            background:
              feedback === "correct"
                ? "oklch(0.72 0.17 162 / 0.15)"
                : feedback === "wrong"
                  ? "oklch(0.65 0.18 25 / 0.15)"
                  : "oklch(0.14 0.04 162 / 0.7)",
            border: `2px solid ${feedback === "correct" ? "oklch(0.72 0.17 162 / 0.5)" : feedback === "wrong" ? "oklch(0.65 0.18 25 / 0.5)" : "oklch(0.72 0.17 162 / 0.2)"}`,
            color: "inherit",
            transition: "background 0.2s, border 0.2s",
          }}
          placeholder="?"
        />
        <Button onClick={submit} disabled={!answer || !!feedback}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function BrainGames() {
  const [sub, setSub] = useState<"memory" | "math">("memory");
  return (
    <div>
      <div className="flex gap-2 mb-6 justify-center">
        {(["memory", "math"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background:
                sub === s
                  ? "oklch(0.72 0.17 162 / 0.20)"
                  : "oklch(0.14 0.04 162 / 0.5)",
              border: `1px solid ${sub === s ? "oklch(0.72 0.17 162 / 0.45)" : "oklch(0.72 0.17 162 / 0.12)"}`,
              color: sub === s ? "oklch(0.72 0.17 162)" : "",
            }}
          >
            {s === "memory" ? "🃏 Memory Cards" : "🔢 Math Quiz"}
          </button>
        ))}
      </div>
      {sub === "memory" ? <MemoryGame /> : <MathQuiz />}
    </div>
  );
}

// ─────────────────────────────────────────────
// RIDDLES
// ─────────────────────────────────────────────
const ALL_RIDDLES = [
  {
    q: "I have billions of neurons but no brain. I'm the map you consult every time you study. What am I?",
    a: "A textbook (or your memory)",
  },
  {
    q: "The more you take from me, the larger I become. Students encounter me when learning new skills. What am I?",
    a: "A hole (or knowledge gap)",
  },
  {
    q: "I run without legs, count without numbers, and stop when you need me most. What am I?",
    a: "A timer",
  },
  {
    q: "I'm full of keys but open no locks. I help students type their notes. What am I?",
    a: "A keyboard",
  },
  {
    q: "You use me to divide, yet I help things multiply. Every student has me in math class. What am I?",
    a: "A calculator",
  },
  {
    q: "I can travel around the world in a second, yet stay in the corner of the room. What am I?",
    a: "A stamp (or Wi-Fi signal)",
  },
  {
    q: "The more you study me, the less you know — because I reveal how much more there is to know. What am I?",
    a: "Knowledge itself",
  },
  {
    q: "I have a spine but no bones. I hold knowledge but never eat. What am I?",
    a: "A book",
  },
  {
    q: "Students use me daily, yet I'm not a teacher. I correct mistakes but never scold. What am I?",
    a: "An eraser",
  },
  {
    q: "I'm the first thing you sharpen before an exam and the last thing you need when it's done. What am I?",
    a: "A pencil",
  },
  {
    q: "I have hands but can't clap. I show you how much time you have left to study. What am I?",
    a: "A clock",
  },
  {
    q: "I'm lighter than a feather but even the strongest student can't hold me for more than a few minutes. What am I?",
    a: "Their breath",
  },
  {
    q: "I speak every language but never went to school. I answer any question but know nothing. What am I?",
    a: "A search engine",
  },
  {
    q: "The more walls I have, the more people I can hold — but I'm not a building. Students line up to enter me. What am I?",
    a: "A classroom schedule",
  },
  {
    q: "I have chapters but no story, an index but no filing cabinet. What am I?",
    a: "A textbook",
  },
  {
    q: "You throw away my outside, cook my inside, eat my outside, and throw away my inside. What am I?",
    a: "An ear of corn",
  },
  {
    q: "I am always hungry and must always be fed. The finger I lick will soon be red. What am I?",
    a: "Fire",
  },
  {
    q: "I have cities but no houses, mountains but no trees, water but no fish. What am I?",
    a: "A map",
  },
  {
    q: "I'm not alive, but I grow. I don't have lungs, but I need air. I don't have a mouth, but water kills me. What am I?",
    a: "Fire",
  },
  { q: "What has a head and a tail but no body?", a: "A coin" },
  {
    q: "I have an eye but cannot see. I'm useful when things get rough. What am I?",
    a: "A needle",
  },
  { q: "What can you break without touching it?", a: "A promise (or silence)" },
  {
    q: "The person who makes me doesn't need me. The person who buys me doesn't use me. The user never sees me. What am I?",
    a: "A coffin",
  },
  {
    q: "I go around the world but never leave a corner. What am I?",
    a: "A stamp",
  },
  {
    q: "What has many keys but can't open a single lock? Students use it daily for writing.",
    a: "A piano (or keyboard)",
  },
  {
    q: "I'm tall when I'm young and short when I'm old. Students use me to see in the dark. What am I?",
    a: "A candle",
  },
  {
    q: "What gets sharper the more you use it — but it's not a knife?",
    a: "Your mind (or memory)",
  },
  { q: "I can be cracked, made, told, and played. What am I?", a: "A joke" },
  {
    q: "What has legs but doesn't walk? Students sit around me all day.",
    a: "A table",
  },
  {
    q: "I'm always in front of you but can't be seen. What am I?",
    a: "The future",
  },
  {
    q: "What word becomes shorter when you add two letters to it?",
    a: "Short",
  },
  {
    q: "What invention lets you look right through a wall? Students use it to see lessons.",
    a: "A window",
  },
  {
    q: "I follow you all day long, but when the night or rain comes, I'm gone. What am I?",
    a: "Your shadow",
  },
];
const DAILY_RIDDLES = seededPick(ALL_RIDDLES, getDailySeed(), 10);

function RiddlesGame() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-4 py-4 max-w-2xl mx-auto">
      {DAILY_RIDDLES.map((riddle, i) => (
        <motion.div
          key={riddle.q.slice(0, 20)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl p-5"
          style={{
            background: "oklch(0.12 0.04 162 / 0.6)",
            border: `1px solid ${revealed.has(i) ? "oklch(0.72 0.16 75 / 0.3)" : "oklch(0.72 0.17 162 / 0.15)"}`,
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "oklch(0.72 0.17 162 / 0.18)",
                color: "oklch(0.72 0.17 162)",
              }}
            >
              {i + 1}
            </span>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {riddle.q}
            </p>
          </div>

          <AnimatePresence>
            {revealed.has(i) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div
                  className="rounded-xl px-4 py-2.5 text-sm font-medium"
                  style={{
                    background: "oklch(0.72 0.16 75 / 0.10)",
                    border: "1px solid oklch(0.72 0.16 75 / 0.25)",
                    color: "oklch(0.78 0.16 75)",
                  }}
                >
                  💡 {riddle.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() =>
              setRevealed((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })
            }
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: revealed.has(i)
                ? "oklch(0.14 0.04 162 / 0.5)"
                : "oklch(0.72 0.17 162 / 0.15)",
              border: `1px solid ${revealed.has(i) ? "oklch(0.72 0.17 162 / 0.15)" : "oklch(0.72 0.17 162 / 0.35)"}`,
              color: revealed.has(i)
                ? "oklch(0.5 0.05 162)"
                : "oklch(0.72 0.17 162)",
            }}
          >
            {revealed.has(i) ? "Hide Answer" : "Reveal Answer"}
          </button>
        </motion.div>
      ))}
      {/* Daily refresh note */}
      <div className="text-center mt-6 text-xs text-muted-foreground/50 italic">
        🌙 New riddles tomorrow!
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUDOKU
// ─────────────────────────────────────────────
// Format: 81-char string, 0=empty. Puzzles hardcoded (3 easy, 3 medium, 3 hard)
const SUDOKU_PUZZLES: {
  puzzle: string;
  solution: string;
  difficulty: "Easy" | "Medium" | "Hard";
}[] = [
  // Easy 1
  {
    difficulty: "Easy",
    puzzle:
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution:
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  },
  // Easy 2
  {
    difficulty: "Easy",
    puzzle:
      "200070038000006070300040600008020700100000006007030400004080009060900000910060002",
    solution:
      "261579438498316572375248619538921764142687356697435481724853149856194723913762285",
  },
  // Easy 3
  {
    difficulty: "Easy",
    puzzle:
      "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    solution:
      "162348957795426183843751326127964835956213748438597619924138571371865492587642310",
  },
  // Medium 1
  {
    difficulty: "Medium",
    puzzle:
      "010020300004005060070000008006900070000800050090006100000000004050700890008000020",
    solution:
      "815427396234895761679013528146932875327861459598146132963578214451729683782354920",
  },
  // Medium 2
  {
    difficulty: "Medium",
    puzzle:
      "700600008003000200060070030000040900040000080009030000050090060002000700400005009",
    solution:
      "791623548853914276264578031378241965145796382629835417537492168912367754486155929",
  },
  // Medium 3
  {
    difficulty: "Medium",
    puzzle:
      "008000400300006010040000080200050030000409000060030007080000050030700006001000200",
    solution:
      "518293476374856912946721385289547631751469823863132597697318254132974768421685239",
  },
  // Hard 1
  {
    difficulty: "Hard",
    puzzle:
      "800000000003600000070090200060005030000030010400070006000400800050200000010000060",
    solution:
      "812753496943682175675491283261845937589237641437169826794316852356924718128578364",
  },
  // Hard 2
  {
    difficulty: "Hard",
    puzzle:
      "000705000300000006040000170080000050700030009010000080026000090600000008000907000",
    solution:
      "591785342382914756746623179883461257724538961915276483276849395639152814457397628",
  },
  // Hard 3
  {
    difficulty: "Hard",
    puzzle:
      "000060080800000050070500003060000100000080600001000030000003900350000008040010000",
    solution:
      "593762481864193752271548963689427135427981645135654237716235894352679418948316572",
  },
];

function SudokuGame() {
  const seed = getDailySeed();
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy",
  );
  const filtered = SUDOKU_PUZZLES.filter((p) => p.difficulty === difficulty);
  const puzzle = seededPick(filtered, seed, 1)[0];

  const [cells, setCells] = useState<string[]>(() => puzzle.puzzle.split(""));
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (solved) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [solved, startTime]);

  useEffect(() => {
    const newCells = seededPick(
      SUDOKU_PUZZLES.filter((p) => p.difficulty === difficulty),
      seed,
      1,
    )[0].puzzle.split("");
    setCells(newCells);
    setChecked(false);
    setSolved(false);
  }, [difficulty, seed]);

  const given = puzzle.puzzle.split("").map((c) => c !== "0");

  function setCell(idx: number, val: string) {
    if (given[idx]) return;
    const v = val.replace(/[^1-9]/g, "").slice(-1);
    setCells((prev) => {
      const n = [...prev];
      n[idx] = v || "0";
      return n;
    });
    setChecked(false);
  }

  function check() {
    setChecked(true);
    if (cells.join("") === puzzle.solution) setSolved(true);
  }

  function isWrong(idx: number) {
    if (!checked) return false;
    if (given[idx]) return false;
    return cells[idx] !== "0" && cells[idx] !== puzzle.solution[idx];
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap justify-center">
        <div className="flex gap-1">
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background:
                  difficulty === d
                    ? "oklch(0.72 0.17 162 / 0.22)"
                    : "oklch(0.14 0.04 162 / 0.5)",
                border: `1px solid ${difficulty === d ? "oklch(0.72 0.17 162 / 0.5)" : "oklch(0.72 0.17 162 / 0.1)"}`,
                color: difficulty === d ? "oklch(0.72 0.17 162)" : "",
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          ⏱ {fmt(elapsed)}
        </span>
      </div>

      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{
            background: "oklch(0.72 0.17 162 / 0.15)",
            border: "1px solid oklch(0.72 0.17 162 / 0.4)",
            color: "oklch(0.72 0.17 162)",
          }}
        >
          🎉 Solved in {fmt(elapsed)}! Brilliant work!
        </motion.div>
      )}

      {/* 9×9 Grid */}
      <div
        className="inline-grid"
        style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(9, 44px)",
          gap: 0,
        }}
      >
        {cells.map((val, idx) => {
          const row = Math.floor(idx / 9);
          const col = idx % 9;
          const boxRow = Math.floor(row / 3);
          const boxCol = Math.floor(col / 3);
          const borderRight =
            col === 8
              ? "2px solid oklch(0.72 0.17 162 / 0.5)"
              : (col + 1) % 3 === 0
                ? "2px solid oklch(0.72 0.17 162 / 0.4)"
                : "1px solid oklch(0.40 0.06 162 / 0.3)";
          const borderBottom =
            row === 8
              ? "2px solid oklch(0.72 0.17 162 / 0.5)"
              : (row + 1) % 3 === 0
                ? "2px solid oklch(0.72 0.17 162 / 0.4)"
                : "1px solid oklch(0.40 0.06 162 / 0.3)";
          const borderLeft =
            col === 0 ? "2px solid oklch(0.72 0.17 162 / 0.5)" : undefined;
          const borderTop =
            row === 0 ? "2px solid oklch(0.72 0.17 162 / 0.5)" : undefined;
          const bg =
            (boxRow + boxCol) % 2 === 0
              ? "oklch(0.13 0.04 162 / 0.6)"
              : "oklch(0.10 0.03 162 / 0.8)";
          const wrong = isWrong(idx);
          const cellId = `r${row}c${col}`;
          return (
            <div
              key={cellId}
              style={{
                width: 44,
                height: 44,
                borderRight,
                borderBottom,
                borderLeft,
                borderTop,
                background: wrong ? "oklch(0.65 0.18 25 / 0.2)" : bg,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              {given[idx] ? (
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "oklch(0.90 0.05 162)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {val !== "0" ? val : ""}
                </span>
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val !== "0" ? val : ""}
                  onChange={(e) => setCell(idx, e.target.value)}
                  style={{
                    width: 44,
                    height: 44,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    textAlign: "center",
                    fontSize: 17,
                    fontWeight: 600,
                    color: wrong
                      ? "oklch(0.65 0.18 25)"
                      : "oklch(0.72 0.17 162)",
                    fontFamily: "JetBrains Mono, monospace",
                    cursor: "text",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <Button size="sm" onClick={check} disabled={solved} className="px-8">
        ✓ Check Solution
      </Button>
      <p className="text-xs text-muted-foreground/50 italic">
        🌙 New puzzle tomorrow!
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// WORD SEARCH
// ─────────────────────────────────────────────
interface WordTheme {
  name: string;
  words: string[];
}

const WORD_THEMES: WordTheme[] = [
  {
    name: "Science ⚗️",
    words: ["ATOM", "CELL", "GENE", "WAVE", "MASS", "FORCE", "LIGHT", "HEAT"],
  },
  {
    name: "Space 🚀",
    words: ["STAR", "MOON", "MARS", "NOVA", "RING", "VOID", "ORBIT", "COMET"],
  },
  {
    name: "Math 🔢",
    words: ["SINE", "MEAN", "ROOT", "AXIS", "AREA", "RATIO", "PRIME", "CURVE"],
  },
  {
    name: "Nature 🌿",
    words: ["BARK", "FERN", "REEF", "MIST", "DUNE", "CAVE", "DELTA", "GROVE"],
  },
  {
    name: "Tech 💻",
    words: ["CODE", "DATA", "NODE", "BYTE", "LOOP", "HASH", "ARRAY", "STACK"],
  },
];

function buildWordSearch(
  words: string[],
  seed: number,
): {
  grid: string[][];
  placements: { word: string; cells: [number, number][] }[];
} {
  const SIZE = 10;
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const grid: string[][] = Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(""));
  const placements: { word: string; cells: [number, number][] }[] = [];
  let r = seed;
  const rand = () => {
    r = (r * 1664525 + 1013904223) & 0x7fffffff;
    return r;
  };

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const horiz = rand() % 2 === 0;
      const maxR = horiz ? SIZE : SIZE - word.length;
      const maxC = horiz ? SIZE - word.length : SIZE;
      const sr = rand() % (maxR + 1);
      const sc = rand() % (maxC + 1);
      const cells: [number, number][] = word
        .split("")
        .map((_, i) => [sr + (horiz ? 0 : i), sc + (horiz ? i : 0)]);
      const ok = cells.every(
        ([cr, cc]) =>
          grid[cr][cc] === "" ||
          grid[cr][cc] === word[cells.indexOf([cr, cc] as [number, number])],
      );
      if (ok) {
        cells.forEach(([cr, cc], i) => {
          grid[cr][cc] = word[i];
        });
        placements.push({ word, cells });
        placed = true;
      }
    }
  }
  // Fill remaining with random letters
  for (let row = 0; row < SIZE; row++)
    for (let col = 0; col < SIZE; col++)
      if (grid[row][col] === "") grid[row][col] = ALPHABET[rand() % 26];
  return { grid, placements };
}

function WordSearchGame() {
  const seed = getDailySeed();
  const theme = seededPick(WORD_THEMES, seed, 1)[0];
  const { grid, placements } = buildWordSearch(theme.words, seed);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState<[number, number] | null>(null);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [allFound, setAllFound] = useState(false);

  function cellKey(r: number, c: number) {
    return `${r},${c}`;
  }
  function getFoundCells() {
    const s = new Set<string>();
    for (const p of placements.filter((pr) => found.has(pr.word))) {
      for (const [r, c] of p.cells) s.add(cellKey(r, c));
    }
    return s;
  }
  const foundCells = getFoundCells();

  function handleCellClick(row: number, col: number) {
    if (!selecting) {
      setSelecting([row, col]);
      setHighlighted(new Set([cellKey(row, col)]));
    } else {
      const [sr, sc] = selecting;
      // Try horizontal
      const cells: [number, number][] = [];
      if (sr === row) {
        const [minC, maxC] = [Math.min(sc, col), Math.max(sc, col)];
        for (let c = minC; c <= maxC; c++) cells.push([row, c]);
      } else if (sc === col) {
        const [minR, maxR] = [Math.min(sr, row), Math.max(sr, row)];
        for (let r = minR; r <= maxR; r++) cells.push([r, col]);
      }
      if (cells.length > 0) {
        const word = cells.map(([r, c]) => grid[r][c]).join("");
        const wordRev = word.split("").reverse().join("");
        const match = placements.find(
          (p) => (p.word === word || p.word === wordRev) && !found.has(p.word),
        );
        if (match) {
          const newFound = new Set(found).add(match.word);
          setFound(newFound);
          if (newFound.size === theme.words.length) setAllFound(true);
        }
      }
      setSelecting(null);
      setHighlighted(new Set());
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div
        className="text-sm font-medium px-4 py-1.5 rounded-xl"
        style={{
          background: "oklch(0.72 0.17 162 / 0.10)",
          border: "1px solid oklch(0.72 0.17 162 / 0.2)",
          color: "oklch(0.72 0.17 162)",
        }}
      >
        Today&apos;s Theme: {theme.name}
      </div>

      {allFound && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{
            background: "oklch(0.72 0.17 162 / 0.15)",
            border: "1px solid oklch(0.72 0.17 162 / 0.4)",
            color: "oklch(0.72 0.17 162)",
          }}
        >
          🎉 All words found! You&apos;re a word wizard!
        </motion.div>
      )}

      {/* Grid */}
      <div
        className="inline-grid select-none"
        style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(10, 38px)",
          gap: 2,
        }}
      >
        {grid.map((rowArr, r) =>
          rowArr.map((letter, c) => {
            const key = cellKey(r, c);
            const isFound = foundCells.has(key);
            const isSel = selecting && selecting[0] === r && selecting[1] === c;
            const isHl = highlighted.has(key);
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => handleCellClick(r, c)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 7,
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  background: isFound
                    ? "oklch(0.55 0.17 162 / 0.35)"
                    : isSel
                      ? "oklch(0.72 0.16 75 / 0.35)"
                      : isHl
                        ? "oklch(0.72 0.17 162 / 0.20)"
                        : "oklch(0.14 0.04 162 / 0.6)",
                  border: `1px solid ${isFound ? "oklch(0.72 0.17 162 / 0.45)" : isSel ? "oklch(0.72 0.16 75 / 0.5)" : "oklch(0.35 0.06 162 / 0.4)"}`,
                  color: isFound
                    ? "oklch(0.85 0.14 162)"
                    : "oklch(0.85 0.03 162)",
                  transition: "background 0.15s, border 0.15s",
                  cursor: "pointer",
                }}
              >
                {letter}
              </motion.button>
            );
          }),
        )}
      </div>

      {/* Word list */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {theme.words.map((word) => (
          <span
            key={word}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            style={{
              background: found.has(word)
                ? "oklch(0.72 0.17 162 / 0.20)"
                : "oklch(0.14 0.04 162 / 0.5)",
              border: `1px solid ${found.has(word) ? "oklch(0.72 0.17 162 / 0.4)" : "oklch(0.35 0.06 162 / 0.3)"}`,
              color: found.has(word)
                ? "oklch(0.72 0.17 162)"
                : "oklch(0.55 0.05 162)",
              textDecoration: found.has(word) ? "line-through" : "none",
            }}
          >
            {word}
          </span>
        ))}
      </div>
      {selecting && (
        <p className="text-xs text-muted-foreground/60">
          Click the last letter of the word to complete selection
        </p>
      )}
      <p className="text-xs text-muted-foreground/50 italic">
        🌙 New words tomorrow!
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIC SEQUENCE
// ─────────────────────────────────────────────
interface SequencePuzzle {
  question: string;
  options: number[];
  answer: number;
  explanation: string;
}

const ALL_SEQUENCES: SequencePuzzle[] = [
  {
    question: "2, 4, 6, 8, _?",
    options: [9, 10, 11, 12],
    answer: 10,
    explanation: "+2 each step",
  },
  {
    question: "3, 6, 12, 24, _?",
    options: [36, 48, 50, 42],
    answer: 48,
    explanation: "×2 each step",
  },
  {
    question: "1, 4, 9, 16, _?",
    options: [20, 25, 36, 22],
    answer: 25,
    explanation: "Perfect squares: 1², 2², 3², 4², 5²",
  },
  {
    question: "100, 90, 81, 73, _?",
    options: [64, 66, 68, 70],
    answer: 66,
    explanation: "-10, -9, -8, -7...",
  },
  {
    question: "1, 1, 2, 3, 5, 8, _?",
    options: [11, 13, 15, 16],
    answer: 13,
    explanation: "Fibonacci: each = sum of previous two",
  },
  {
    question: "5, 10, 20, 40, _?",
    options: [60, 70, 80, 90],
    answer: 80,
    explanation: "×2 each step",
  },
  {
    question: "3, 9, 27, 81, _?",
    options: [162, 243, 270, 324],
    answer: 243,
    explanation: "×3 each step (powers of 3)",
  },
  {
    question: "2, 5, 10, 17, 26, _?",
    options: [35, 36, 37, 38],
    answer: 37,
    explanation: "+3, +5, +7, +9, +11 (odd increments)",
  },
  {
    question: "64, 32, 16, 8, _?",
    options: [2, 3, 4, 6],
    answer: 4,
    explanation: "÷2 each step",
  },
  {
    question: "1, 8, 27, 64, _?",
    options: [100, 115, 125, 144],
    answer: 125,
    explanation: "Perfect cubes: 1³, 2³, 3³, 4³, 5³",
  },
  {
    question: "7, 14, 21, 28, _?",
    options: [32, 35, 38, 42],
    answer: 35,
    explanation: "+7 each step (multiples of 7)",
  },
  {
    question: "2, 6, 18, 54, _?",
    options: [108, 162, 180, 216],
    answer: 162,
    explanation: "×3 each step",
  },
  {
    question: "1, 2, 4, 7, 11, _?",
    options: [14, 16, 18, 20],
    answer: 16,
    explanation: "+1, +2, +3, +4, +5 (incrementing diff)",
  },
  {
    question: "50, 47, 44, 41, _?",
    options: [36, 37, 38, 39],
    answer: 38,
    explanation: "-3 each step",
  },
  {
    question: "1, 3, 7, 15, 31, _?",
    options: [55, 63, 62, 61],
    answer: 63,
    explanation: "×2+1 each step",
  },
  {
    question: "4, 9, 16, 25, 36, _?",
    options: [42, 47, 49, 52],
    answer: 49,
    explanation: "Consecutive squares: 2², 3², 4², 5², 6², 7²",
  },
  {
    question: "10, 8, 6, 4, _?",
    options: [1, 2, 3, 0],
    answer: 2,
    explanation: "-2 each step",
  },
  {
    question: "1, 5, 14, 30, 55, _?",
    options: [84, 91, 100, 110],
    answer: 91,
    explanation: "Triangular pyramidal numbers",
  },
  {
    question: "2, 3, 5, 7, 11, _?",
    options: [12, 13, 14, 15],
    answer: 13,
    explanation: "Prime numbers sequence",
  },
  {
    question: "0, 1, 3, 6, 10, _?",
    options: [13, 14, 15, 16],
    answer: 15,
    explanation: "Triangular numbers: +1, +2, +3...",
  },
  {
    question: "256, 128, 64, 32, _?",
    options: [8, 12, 16, 24],
    answer: 16,
    explanation: "÷2 each step (powers of 2)",
  },
  {
    question: "3, 5, 9, 15, 23, _?",
    options: [28, 31, 33, 35],
    answer: 33,
    explanation: "+2, +4, +6, +8, +10 (even increments)",
  },
  {
    question: "1, 4, 13, 40, _?",
    options: [100, 115, 121, 132],
    answer: 121,
    explanation: "×3+1 each step",
  },
  {
    question: "11, 22, 33, 44, _?",
    options: [50, 55, 60, 66],
    answer: 55,
    explanation: "+11 each step (multiples of 11)",
  },
  {
    question: "729, 243, 81, 27, _?",
    options: [3, 6, 9, 12],
    answer: 9,
    explanation: "÷3 each step (powers of 3)",
  },
  {
    question: "2, 4, 8, 16, 32, _?",
    options: [48, 56, 64, 72],
    answer: 64,
    explanation: "×2 each step (powers of 2)",
  },
  {
    question: "5, 11, 23, 47, _?",
    options: [85, 93, 95, 97],
    answer: 95,
    explanation: "×2+1 each step",
  },
  {
    question: "1, 2, 6, 24, 120, _?",
    options: [360, 480, 720, 840],
    answer: 720,
    explanation: "Factorial sequence: ×2, ×3, ×4, ×5, ×6",
  },
  {
    question: "4, 7, 12, 19, 28, _?",
    options: [37, 38, 39, 40],
    answer: 39,
    explanation: "+3, +5, +7, +9, +11 (odd increments)",
  },
  {
    question: "81, 27, 9, 3, _?",
    options: [0, 1, 2, 3],
    answer: 1,
    explanation: "÷3 each step",
  },
];
const DAILY_SEQUENCES = seededPick(ALL_SEQUENCES, getDailySeed() + 1, 10);

function LogicSequenceGame() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done || showExplanation) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setShowExplanation(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, showExplanation]);

  function pickAnswer(optIdx: number) {
    if (selected !== null || showExplanation) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(optIdx);
    const puzzle = DAILY_SEQUENCES[idx];
    if (puzzle.options[optIdx] === puzzle.answer) setScore((s) => s + 1);
    setShowExplanation(true);
  }

  function nextQ() {
    if (idx + 1 >= DAILY_SEQUENCES.length) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setShowExplanation(false);
    setTimeLeft(20);
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setShowExplanation(false);
    setScore(0);
    setTimeLeft(20);
    setDone(false);
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 flex flex-col items-center gap-4"
      >
        <div className="text-5xl">🧩</div>
        <h3 className="text-2xl font-bold">Logic Master!</h3>
        <p className="text-muted-foreground">
          Score:{" "}
          <span className="font-bold text-foreground">
            {score}/{DAILY_SEQUENCES.length}
          </span>
        </p>
        <div
          className="px-4 py-2 rounded-xl text-sm"
          style={{
            background:
              score >= 8
                ? "oklch(0.72 0.17 162 / 0.12)"
                : "oklch(0.72 0.16 75 / 0.10)",
            border: `1px solid ${score >= 8 ? "oklch(0.72 0.17 162 / 0.3)" : "oklch(0.72 0.16 75 / 0.3)"}`,
            color: score >= 8 ? "oklch(0.72 0.17 162)" : "oklch(0.72 0.16 75)",
          }}
        >
          {score >= 9
            ? "🌟 Perfect logical mind!"
            : score >= 7
              ? "🎯 Sharp pattern recognition!"
              : score >= 5
                ? "📚 Good effort! Keep sharpening."
                : "💪 Practice makes perfect!"}
        </div>
        <Button onClick={restart}>Try Again</Button>
      </motion.div>
    );
  }

  const puzzle = DAILY_SEQUENCES[idx];
  return (
    <div className="flex flex-col items-center gap-5 py-4 max-w-md mx-auto">
      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            Q {idx + 1} / {DAILY_SEQUENCES.length}
          </span>
          <span style={{ color: timeLeft <= 5 ? "oklch(0.65 0.18 25)" : "" }}>
            ⏱ {timeLeft}s
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.15 0.04 162 / 0.5)" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${(timeLeft / 20) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background:
                timeLeft > 8 ? "oklch(0.72 0.17 162)" : "oklch(0.65 0.18 25)",
              boxShadow: `0 0 8px ${timeLeft > 8 ? "oklch(0.72 0.17 162 / 0.5)" : "oklch(0.65 0.18 25 / 0.5)"}`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="w-full text-center"
        >
          <div
            className="text-2xl font-bold py-6 px-6 rounded-2xl"
            style={{
              background: "oklch(0.12 0.04 162 / 0.6)",
              border: "1px solid oklch(0.72 0.17 162 / 0.2)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {puzzle.question}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {puzzle.options.map((opt, i) => {
          const isCorrect = opt === puzzle.answer;
          const isPicked = selected === i;
          const reveal = showExplanation;
          return (
            <motion.button
              key={`opt-${opt}`}
              type="button"
              whileHover={!showExplanation ? { scale: 1.03 } : {}}
              whileTap={!showExplanation ? { scale: 0.97 } : {}}
              onClick={() => pickAnswer(i)}
              className="py-4 rounded-xl text-lg font-bold transition-all"
              style={{
                background: reveal
                  ? isCorrect
                    ? "oklch(0.72 0.17 162 / 0.22)"
                    : isPicked
                      ? "oklch(0.65 0.18 25 / 0.20)"
                      : "oklch(0.12 0.04 162 / 0.5)"
                  : "oklch(0.14 0.04 162 / 0.6)",
                border: reveal
                  ? `2px solid ${isCorrect ? "oklch(0.72 0.17 162 / 0.6)" : isPicked ? "oklch(0.65 0.18 25 / 0.5)" : "oklch(0.35 0.05 162 / 0.3)"}`
                  : "1px solid oklch(0.35 0.06 162 / 0.4)",
                color: reveal
                  ? isCorrect
                    ? "oklch(0.85 0.14 162)"
                    : isPicked
                      ? "oklch(0.75 0.16 25)"
                      : ""
                  : "",
                cursor: showExplanation ? "default" : "pointer",
              }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{
              background: "oklch(0.72 0.16 75 / 0.08)",
              border: "1px solid oklch(0.72 0.16 75 / 0.25)",
              color: "oklch(0.78 0.16 75)",
            }}
          >
            💡 {puzzle.explanation} → Answer: <strong>{puzzle.answer}</strong>
          </motion.div>
        )}
      </AnimatePresence>

      {showExplanation && (
        <Button onClick={nextQ} className="px-8">
          {idx + 1 >= DAILY_SEQUENCES.length ? "See Results" : "Next →"}
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SPEED TYPING
// ─────────────────────────────────────────────
const TYPING_QUOTES = [
  "The secret of getting ahead is getting started. Take the first step now.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you are halfway there. Keep pushing forward.",
  "Hard work beats talent when talent does not work hard. Stay consistent.",
  "The only way to do great work is to love what you do. Find your passion.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Study not to be a great student, but to become a great thinker and creator.",
  "Don't watch the clock. Do what it does. Keep going until the job is done.",
  "Perseverance is not a long race. It is many short races one after the other.",
  "The expert in anything was once a beginner. Embrace the learning process.",
  "A mind is like a parachute. It only works when it is completely open.",
  "Knowledge is power. Information is liberating. Education is the premise of progress.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Your brain is like a muscle. The more you use it, the stronger it gets.",
  "Genius is one percent inspiration and ninety-nine percent perspiration.",
  "It always seems impossible until it is done. Break your goals into steps.",
  "The roots of education are bitter, but the fruit is sweet. Keep learning.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Focus on progress, not perfection. Every small step forward counts.",
  "Dream big, work hard, stay focused, and surround yourself with good people.",
];
const DAILY_TYPING_QUOTE = seededPick(TYPING_QUOTES, getDailySeed() + 2, 1)[0];

function SpeedTypingGame() {
  const [phase, setPhase] = useState<"idle" | "typing" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typedRef = useRef(typed);
  const target = DAILY_TYPING_QUOTE;

  useEffect(() => {
    typedRef.current = typed;
  }, [typed]);

  const storeResults = useCallback(
    (currentTyped: string, tLeft: number) => {
      const words = currentTyped.trim().split(/\s+/).filter(Boolean).length;
      const minutesUsed = (60 - tLeft) / 60 || 1 / 60;
      setWpm(Math.round(words / minutesUsed));
      const correctChars = currentTyped
        .split("")
        .filter((ch, i) => ch === target[i]).length;
      setAccuracy(
        currentTyped.length > 0
          ? Math.round((correctChars / currentTyped.length) * 100)
          : 0,
      );
    },
    [target],
  );

  useEffect(() => {
    if (phase !== "typing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          storeResults(typedRef.current, 0);
          setPhase("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, storeResults]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (phase === "idle") setPhase("typing");
    const val = e.target.value;
    if (val.length > target.length) return;
    setTyped(val);
    if (val === target) {
      storeResults(val, timeLeft);
      setPhase("done");
    }
  }

  function restart() {
    setTyped("");
    setPhase("idle");
    setTimeLeft(60);
    setWpm(0);
    setAccuracy(0);
  }

  function badge() {
    if (wpm >= 80)
      return { label: "⚡ Speed Demon", color: "oklch(0.78 0.16 75)" };
    if (wpm >= 55)
      return { label: "🚀 Fast Typist", color: "oklch(0.72 0.17 162)" };
    if (wpm >= 35)
      return { label: "📚 Steady Writer", color: "oklch(0.65 0.15 230)" };
    return { label: "🐢 Keep Practicing", color: "oklch(0.55 0.10 162)" };
  }

  // Character comparison overlay
  const chars = target.split("").map((ch, i) => {
    const typedChar = typed[i];
    if (typedChar === undefined) return { ch, state: "pending" as const };
    if (typedChar === ch) return { ch, state: "correct" as const };
    return { ch, state: "wrong" as const };
  });

  if (phase === "done") {
    const b = badge();
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-6"
      >
        <div className="text-5xl">⌨️</div>
        <h3 className="text-2xl font-bold">Results</h3>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            { label: "WPM", value: wpm, color: "oklch(0.72 0.17 162)" },
            {
              label: "Accuracy",
              value: `${accuracy}%`,
              color: "oklch(0.78 0.16 75)",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-5 text-center"
              style={{
                background: "oklch(0.12 0.04 162 / 0.6)",
                border: "1px solid oklch(0.72 0.17 162 / 0.2)",
              }}
            >
              <div className="text-3xl font-black" style={{ color }}>
                {value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div
          className="px-5 py-2.5 rounded-2xl text-sm font-bold"
          style={{
            background: "oklch(0.14 0.04 162 / 0.7)",
            border: `1px solid ${b.color}`,
            color: b.color,
          }}
        >
          {b.label}
        </div>
        <Button onClick={restart}>Try Again</Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4 max-w-2xl mx-auto">
      {/* Timer bar */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.15 0.04 162 / 0.5)" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${(timeLeft / 60) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{
              background:
                timeLeft > 15 ? "oklch(0.72 0.17 162)" : "oklch(0.65 0.18 25)",
              boxShadow: `0 0 8px ${timeLeft > 15 ? "oklch(0.72 0.17 162 / 0.5)" : "oklch(0.65 0.18 25 / 0.5)"}`,
            }}
          />
        </div>
        <span
          className="text-sm font-mono font-bold w-10 text-right"
          style={{ color: timeLeft <= 10 ? "oklch(0.65 0.18 25)" : "" }}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Target text with color overlay */}
      <div
        className="rounded-2xl p-5 text-base leading-relaxed font-mono relative"
        style={{
          background: "oklch(0.11 0.03 162 / 0.8)",
          border: "1px solid oklch(0.72 0.17 162 / 0.15)",
          minHeight: 100,
        }}
      >
        {chars.map((c, i) => {
          const pos = i.toString(36).padStart(3, "0");
          return (
            <span
              key={`p${pos}`}
              style={{
                color:
                  c.state === "correct"
                    ? "oklch(0.72 0.17 162)"
                    : c.state === "wrong"
                      ? "oklch(0.65 0.18 25)"
                      : "oklch(0.55 0.05 162)",
                background:
                  c.state === "wrong"
                    ? "oklch(0.65 0.18 25 / 0.12)"
                    : "transparent",
              }}
            >
              {c.ch}
            </span>
          );
        })}
        {phase === "idle" && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl text-sm text-muted-foreground/60"
            style={{ background: "oklch(0.11 0.03 162 / 0.3)" }}
          >
            Start typing below ↓
          </div>
        )}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={typed}
        onChange={handleChange}
        onPaste={(e) => e.preventDefault()}
        rows={3}
        placeholder={phase === "idle" ? "Start typing the quote above..." : ""}
        className="w-full rounded-xl p-4 text-base font-mono resize-none outline-none transition-all"
        style={{
          background: "oklch(0.14 0.04 162 / 0.7)",
          border: "1.5px solid oklch(0.72 0.17 162 / 0.25)",
          color: "inherit",
          caretColor: "oklch(0.72 0.17 162)",
        }}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {typed.length} / {target.length} chars
        </span>
        {phase === "typing" && (
          <span>
            {Math.round(
              typed.trim().split(/\s+/).filter(Boolean).length /
                ((60 - timeLeft + 1) / 60),
            )}{" "}
            WPM live
          </span>
        )}
        <span>No paste allowed</span>
      </div>
      <p className="text-xs text-muted-foreground/50 italic text-center">
        🌙 New quote tomorrow!
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN GAMES SECTION
// ─────────────────────────────────────────────
export function GamesSection() {
  const { todayMinutes } = useSessionHistory();
  const isUnlocked = todayMinutes >= 300;
  const [activeGame, setActiveGame] = useState<GameTab>("chess");
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    if (!isUnlocked) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const key = `gamesUnlockedShown_${dateStr}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setShowUnlockModal(true);
    }
  }, [isUnlocked]);

  const CONFETTI = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: i * 0.08,
    emoji: ["⭐", "✨", "🎉", "🎊", "💫", "🌟"][i % 6],
  }));

  if (!isUnlocked) {
    return <LockedGate todayMinutes={todayMinutes} />;
  }

  const GAME_TABS: { id: GameTab; label: string; emoji: string }[] = [
    { id: "chess", label: "Chess", emoji: "♟️" },
    { id: "crossword", label: "Crossword", emoji: "📝" },
    { id: "brain", label: "Brain Games", emoji: "🧠" },
    { id: "riddles", label: "Riddles", emoji: "🔮" },
    { id: "sudoku", label: "Sudoku", emoji: "🔢" },
    { id: "wordsearch", label: "Words", emoji: "🔍" },
    { id: "logic", label: "Logic", emoji: "🧩" },
    { id: "typing", label: "Typing", emoji: "⌨️" },
  ];

  return (
    <>
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            key="unlock-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowUnlockModal(false)}
          >
            <motion.div
              key="unlock-modal-card"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="glass-card rounded-3xl p-10 max-w-md w-full text-center relative overflow-hidden mx-4"
              style={{
                border: "1.5px solid oklch(0.72 0.17 162 / 0.55)",
                boxShadow:
                  "0 0 48px oklch(0.72 0.17 162 / 0.25), 0 8px 32px rgba(0,0,0,0.6)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {CONFETTI.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute text-xl pointer-events-none select-none"
                  style={{ left: `${p.x}%`, top: "80%" }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [-10, -80, -130, -180] }}
                  transition={{
                    duration: 1.8,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                >
                  {p.emoji}
                </motion.div>
              ))}
              <motion.div
                className="text-7xl mb-4 inline-block"
                animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4, 0] }}
                transition={{ duration: 1.2, repeat: 2, ease: "easeInOut" }}
              >
                🏆🎮
              </motion.div>
              <motion.h2
                className="text-4xl font-black mb-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.17 162), oklch(0.85 0.14 162))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Games Unlocked!
              </motion.h2>
              <motion.p
                className="text-base text-muted-foreground mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                You&apos;ve studied{" "}
                <span
                  style={{ color: "oklch(0.72 0.17 162)", fontWeight: 700 }}
                >
                  5+ hours
                </span>{" "}
                today.
                <br />
                You&apos;ve earned your gaming time!
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Button
                  data-ocid="games.unlock_modal.confirm_button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-10 py-3 text-lg font-bold rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.17 162), oklch(0.45 0.17 162))",
                    boxShadow: "0 0 24px oklch(0.72 0.17 162 / 0.4)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Let&apos;s Play! 🎮
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="px-4 md:px-8 py-8 max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.22 0.10 162), oklch(0.15 0.06 180))",
                boxShadow: "0 0 22px oklch(0.72 0.17 162 / 0.40)",
                border: "1px solid oklch(0.72 0.17 162 / 0.30)",
              }}
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Gamepad2
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.17 162)" }}
              />
            </motion.div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                }}
              >
                Study{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.17 162), oklch(0.78 0.16 75))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Games
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Unlocked · {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                studied today
              </p>
            </div>
          </div>
        </div>

        {/* Game tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 flex-nowrap">
          {GAME_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`games.${tab.id}.tab`}
              onClick={() => setActiveGame(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0"
              style={{
                background:
                  activeGame === tab.id
                    ? "oklch(0.72 0.17 162 / 0.18)"
                    : "oklch(0.14 0.04 162 / 0.5)",
                border: `1px solid ${activeGame === tab.id ? "oklch(0.72 0.17 162 / 0.45)" : "oklch(0.72 0.17 162 / 0.12)"}`,
                color: activeGame === tab.id ? "oklch(0.72 0.17 162)" : "",
                boxShadow:
                  activeGame === tab.id
                    ? "0 0 15px oklch(0.72 0.17 162 / 0.12)"
                    : "none",
              }}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Game content */}
        <div
          className="glass-card rounded-3xl p-6 relative overflow-hidden"
          style={{
            border: "1px solid oklch(0.72 0.17 162 / 0.15)",
            boxShadow: "0 0 40px oklch(0.72 0.17 162 / 0.06)",
          }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.17 162 / 0.05), transparent 60%)",
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGame}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.25 }}
            >
              {activeGame === "chess" && <ChessGame />}
              {activeGame === "crossword" && <CrosswordGame />}
              {activeGame === "brain" && <BrainGames />}
              {activeGame === "riddles" && <RiddlesGame />}
              {activeGame === "sudoku" && <SudokuGame />}
              {activeGame === "wordsearch" && <WordSearchGame />}
              {activeGame === "logic" && <LogicSequenceGame />}
              {activeGame === "typing" && <SpeedTypingGame />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
