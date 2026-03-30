import { useTimer } from "@/contexts/TimerContext";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const MOTIVATIONAL_MESSAGES = [
  "You're halfway there! Keep pushing! 💪",
  "Stay focused! You're doing great! ⭐",
  "Don't give up now! Victory is close! 🏆",
  "You've got this! Keep going champ! 🔥",
  "Half done! You're absolutely crushing it! 🚀",
  "Almost there! Believe in yourself! ✨",
];

export function StudyBoyScene({ visible }: { visible: boolean }) {
  const { halfTimeFired } = useTimer();
  const [blinkOpen, setBlinkOpen] = useState(true);
  const [message] = useState(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ],
  );
  const [currentMessage, setCurrentMessage] = useState(message);

  // Blink every ~3.5 seconds
  useEffect(() => {
    const interval = setInterval(
      () => {
        setBlinkOpen(false);
        setTimeout(() => setBlinkOpen(true), 150);
      },
      3500 + Math.random() * 1500,
    );
    return () => clearInterval(interval);
  }, []);

  // Update message each time halfTimeFired changes to true
  useEffect(() => {
    if (halfTimeFired) {
      setCurrentMessage(
        MOTIVATIONAL_MESSAGES[
          Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
        ],
      );
    }
  }, [halfTimeFired]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        bottom: 80,
        right: 90,
        zIndex: 5,
        width: 220,
        height: 260,
      }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {halfTimeFired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              position: "absolute",
              top: -10,
              left: -160,
              width: 210,
              background:
                "linear-gradient(135deg, oklch(0.22 0.12 285 / 0.95), oklch(0.18 0.10 200 / 0.95))",
              border: "1px solid oklch(0.72 0.17 162 / 0.4)",
              borderRadius: 16,
              padding: "10px 14px",
              backdropFilter: "blur(18px)",
              boxShadow:
                "0 8px 32px oklch(0 0 0 / 0.4), 0 0 20px oklch(0.72 0.17 162 / 0.15)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "oklch(0.92 0.06 162)",
                lineHeight: 1.45,
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              }}
            >
              {currentMessage}
            </p>
            {/* Tail pointing right */}
            <div
              style={{
                position: "absolute",
                right: -8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderLeft: "9px solid oklch(0.22 0.12 285 / 0.95)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boy SVG */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 3.2,
          ease: "easeInOut",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <svg
          viewBox="0 0 220 260"
          width="220"
          height="260"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Animated studying boy character"
        >
          <defs>
            {/* Lamp glow gradient */}
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5c842" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f5c842" stopOpacity="0" />
            </radialGradient>
            {/* Skin gradient */}
            <radialGradient id="skinGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#f7d4a8" />
              <stop offset="100%" stopColor="#e8b88a" />
            </radialGradient>
            {/* Book glow */}
            <radialGradient id="bookGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* === LAMP === */}
          {/* Lamp pole */}
          <line
            x1="175"
            y1="90"
            x2="175"
            y2="180"
            stroke="#6b5a45"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Lamp base */}
          <rect x="162" y="177" width="26" height="6" rx="3" fill="#6b5a45" />
          {/* Lamp shade */}
          <polygon
            points="152,90 198,90 190,112 160,112"
            fill="#f5c842"
            opacity="0.9"
          />
          <polygon
            points="152,90 198,90 190,112 160,112"
            fill="none"
            stroke="#c8960a"
            strokeWidth="1"
          />
          {/* Lamp bulb glow on surface */}
          <ellipse cx="175" cy="130" rx="55" ry="40" fill="url(#lampGlow)" />

          {/* === DESK === */}
          {/* Desktop surface */}
          <rect x="10" y="182" width="195" height="11" rx="4" fill="#5c3d1e" />
          {/* Desk front edge shadow */}
          <rect
            x="10"
            y="190"
            width="195"
            height="4"
            rx="2"
            fill="#3d2810"
            opacity="0.5"
          />
          {/* Desk legs */}
          <rect x="22" y="193" width="10" height="55" rx="2" fill="#4a2e12" />
          <rect x="188" y="193" width="10" height="55" rx="2" fill="#4a2e12" />

          {/* === OPEN BOOK === */}
          {/* Book glow */}
          <ellipse cx="110" cy="178" rx="50" ry="15" fill="url(#bookGlow)" />
          {/* Left page */}
          <path d="M65,182 L105,175 L105,160 L65,165 Z" fill="#f0e8d0" />
          <path
            d="M65,182 L105,175 L105,160 L65,165 Z"
            fill="none"
            stroke="#c9b88a"
            strokeWidth="0.5"
          />
          {/* Text lines on left page */}
          <line
            x1="72"
            y1="170"
            x2="98"
            y2="168"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="72"
            y1="174"
            x2="98"
            y2="172"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="72"
            y1="178"
            x2="96"
            y2="176"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          {/* Right page */}
          <path d="M155,182 L115,175 L115,160 L155,165 Z" fill="#f5eed8" />
          <path
            d="M155,182 L115,175 L115,160 L155,165 Z"
            fill="none"
            stroke="#c9b88a"
            strokeWidth="0.5"
          />
          {/* Text lines on right page */}
          <line
            x1="122"
            y1="170"
            x2="148"
            y2="168"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="122"
            y1="174"
            x2="148"
            y2="172"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1="122"
            y1="178"
            x2="146"
            y2="176"
            stroke="#b8a070"
            strokeWidth="0.8"
            opacity="0.6"
          />
          {/* Book spine */}
          <line
            x1="110"
            y1="182"
            x2="110"
            y2="160"
            stroke="#8a7050"
            strokeWidth="1.5"
          />
          {/* Closed books stack */}
          <rect x="30" y="168" width="28" height="15" rx="2" fill="#7c3aed" />
          <rect x="30" y="158" width="25" height="12" rx="2" fill="#4f46e5" />
          <rect x="30" y="150" width="22" height="10" rx="2" fill="#0891b2" />

          {/* === BOY BODY === */}
          {/* Chair seat */}
          <rect x="40" y="205" width="60" height="10" rx="4" fill="#374151" />
          <rect x="95" y="180" width="8" height="28" rx="3" fill="#374151" />
          {/* Shirt/torso */}
          <rect x="50" y="155" width="42" height="52" rx="10" fill="#3b82f6" />
          {/* Shirt pocket detail */}
          <rect x="62" y="162" width="12" height="9" rx="2" fill="#2563eb" />
          {/* Left arm on desk */}
          <rect x="42" y="170" width="18" height="38" rx="8" fill="#3b82f6" />
          <rect x="38" y="198" width="26" height="10" rx="5" fill="#e8b88a" />
          {/* Right arm */}
          <rect x="88" y="170" width="16" height="35" rx="8" fill="#3b82f6" />
          <rect x="86" y="196" width="22" height="10" rx="5" fill="#e8b88a" />
          {/* Pencil in right hand */}
          <motion.g
            animate={{ rotate: [-3, 3, -3] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.8,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "97px 200px" }}
          >
            <rect
              x="94"
              y="175"
              width="4"
              height="22"
              rx="1.5"
              fill="#f5c842"
            />
            <polygon points="94,197 98,197 96,204" fill="#e8b88a" />
            <rect x="94" y="175" width="4" height="4" fill="#ff6b6b" />
          </motion.g>
          {/* Legs */}
          <rect x="55" y="213" width="14" height="35" rx="5" fill="#1f2937" />
          <rect x="73" y="213" width="14" height="35" rx="5" fill="#1f2937" />
          {/* Shoes */}
          <ellipse cx="62" cy="248" rx="12" ry="6" fill="#111827" />
          <ellipse cx="80" cy="248" rx="12" ry="6" fill="#111827" />

          {/* === HEAD === */}
          {/* Neck */}
          <rect x="63" y="143" width="16" height="16" rx="4" fill="#e8b88a" />
          {/* Head */}
          <circle cx="71" cy="120" r="32" fill="url(#skinGrad)" />
          {/* Hair */}
          <path
            d="M40,118 Q42,88 71,85 Q100,82 103,105 Q100,90 95,92 Q88,80 71,82 Q50,82 45,100 Z"
            fill="#2d1a0a"
          />
          {/* Hair detail */}
          <path
            d="M40,118 Q40,105 44,100"
            stroke="#3d2510"
            strokeWidth="1"
            fill="none"
          />
          {/* Ear */}
          <ellipse cx="39" cy="121" rx="5" ry="7" fill="#e8b88a" />
          <ellipse cx="103" cy="121" rx="5" ry="7" fill="#e8b88a" />
          {/* Eyebrows */}
          <path
            d="M56,108 Q63,104 70,106"
            stroke="#2d1a0a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M75,106 Q82,104 88,107"
            stroke="#2d1a0a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Eyes */}
          <motion.g
            animate={{ scaleY: blinkOpen ? 1 : 0.05 }}
            transition={{ duration: 0.08 }}
            style={{ transformOrigin: "71px 118px" }}
          >
            {/* Left eye */}
            <ellipse cx="63" cy="118" rx="5.5" ry="6" fill="#1a0a00" />
            <circle cx="61" cy="116" r="1.5" fill="white" opacity="0.8" />
            {/* Right eye */}
            <ellipse cx="82" cy="118" rx="5.5" ry="6" fill="#1a0a00" />
            <circle cx="80" cy="116" r="1.5" fill="white" opacity="0.8" />
          </motion.g>
          {/* Glasses */}
          <rect
            x="55"
            y="112"
            width="16"
            height="13"
            rx="4"
            fill="none"
            stroke="#8b7355"
            strokeWidth="1.5"
          />
          <rect
            x="74"
            y="112"
            width="16"
            height="13"
            rx="4"
            fill="none"
            stroke="#8b7355"
            strokeWidth="1.5"
          />
          <line
            x1="71"
            y1="118"
            x2="74"
            y2="118"
            stroke="#8b7355"
            strokeWidth="1.5"
          />
          <line
            x1="39"
            y1="118"
            x2="55"
            y2="118"
            stroke="#8b7355"
            strokeWidth="1.5"
          />
          <line
            x1="90"
            y1="118"
            x2="103"
            y2="118"
            stroke="#8b7355"
            strokeWidth="1.5"
          />
          {/* Nose */}
          <path
            d="M68,124 Q71,128 75,124"
            stroke="#c8956a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Smile */}
          <path
            d="M63,131 Q71,137 80,131"
            stroke="#c8956a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Concentrating expression - slight furrow */}
          <line
            x1="68"
            y1="106"
            x2="72"
            y2="108"
            stroke="#c8956a"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Floating math symbols */}
          <motion.text
            x="15"
            y="60"
            fontSize="14"
            fill="oklch(0.72 0.17 162 / 0.45)"
            fontFamily="serif"
            animate={{ y: [60, 40, 60], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 4,
              ease: "easeInOut",
            }}
          >
            ∫
          </motion.text>
          <motion.text
            x="185"
            y="50"
            fontSize="12"
            fill="oklch(0.78 0.16 75 / 0.45)"
            fontFamily="serif"
            animate={{ y: [50, 30, 50], opacity: [0.3, 0.6, 0.3] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            π
          </motion.text>
          <motion.text
            x="5"
            y="100"
            fontSize="11"
            fill="oklch(0.68 0.14 285 / 0.4)"
            fontFamily="serif"
            animate={{ y: [100, 78, 100], opacity: [0.3, 0.55, 0.3] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 6,
              ease: "easeInOut",
              delay: 2,
            }}
          >
            ∑
          </motion.text>
          <motion.text
            x="200"
            y="130"
            fontSize="11"
            fill="oklch(0.72 0.17 162 / 0.35)"
            fontFamily="serif"
            animate={{ y: [130, 110, 130], opacity: [0.25, 0.5, 0.25] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 4.5,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            √
          </motion.text>
        </svg>
      </motion.div>
    </div>
  );
}
