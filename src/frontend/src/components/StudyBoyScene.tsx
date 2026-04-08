import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState } from "react";

const MOTIVATIONAL_MESSAGES = [
  "You're halfway there! Keep pushing! 💪",
  "Stay focused! You're doing great! ⭐",
  "Don't give up now! Victory is close! 🏆",
  "You've got this! Keep going champ! 🔥",
  "Half done! You're absolutely crushing it! 🚀",
  "Almost there! Believe in yourself! ✨",
];

function SteamLine({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.path
      d={`M${x} 0 Q${x + 4} -8 ${x} -16 Q${x - 4} -24 ${x} -32`}
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 0.7, 0.4, 0],
        y: [-2, -12, -20, -28],
        x: [0, 2, -2, 1],
      }}
      transition={{
        duration: 2.2,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
  );
}

function KnowledgeParticle({
  x,
  y,
  delay,
}: { x: number; y: number; delay: number }) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={2}
      fill="rgba(180,160,255,0.85)"
      initial={{ opacity: 0, cy: y }}
      animate={{
        opacity: [0, 0.9, 0.6, 0],
        cy: [y, y - 18, y - 32, y - 44],
        cx: [x, x + 3, x - 2, x + 4],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeOut",
      }}
    />
  );
}

export function StudyBoyScene({ visible }: { visible: boolean }) {
  const [blinkOpen, setBlinkOpen] = useState(true);
  const [currentMessage, _setCurrentMessage] = useState(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ],
  );
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writingControls = useAnimationControls();
  const headControls = useAnimationControls();
  const torsoControls = useAnimationControls();
  const floatControls = useAnimationControls();

  // Breathing
  useEffect(() => {
    const loop = async () => {
      while (true) {
        await torsoControls.start({
          scaleX: 1.015,
          transition: { duration: 2, ease: "easeInOut" },
        });
        await torsoControls.start({
          scaleX: 1,
          transition: { duration: 2, ease: "easeInOut" },
        });
      }
    };
    loop();
  }, [torsoControls]);

  // Floating
  useEffect(() => {
    const loop = async () => {
      while (true) {
        await floatControls.start({
          y: -3,
          transition: { duration: 2, ease: "easeInOut" },
        });
        await floatControls.start({
          y: 3,
          transition: { duration: 2, ease: "easeInOut" },
        });
      }
    };
    loop();
  }, [floatControls]);

  // Writing hand
  useEffect(() => {
    const loop = async () => {
      while (true) {
        await writingControls.start({
          x: 6,
          rotate: 4,
          transition: { duration: 0.6, ease: "easeInOut" },
        });
        await writingControls.start({
          x: -5,
          rotate: -3,
          transition: { duration: 0.7, ease: "easeInOut" },
        });
        await writingControls.start({
          x: 7,
          rotate: 5,
          transition: { duration: 0.55, ease: "easeInOut" },
        });
        await writingControls.start({
          x: 0,
          rotate: 0,
          transition: { duration: 0.9, ease: "easeOut" },
        });
        await new Promise((r) => setTimeout(r, 800));
      }
    };
    loop();
  }, [writingControls]);

  // Head micro tilt
  useEffect(() => {
    const loop = async () => {
      while (true) {
        await new Promise((r) => setTimeout(r, 3000 + Math.random() * 2000));
        await headControls.start({
          rotate: 1.5,
          transition: { duration: 1.5, ease: "easeInOut" },
        });
        await headControls.start({
          rotate: -1,
          transition: { duration: 2, ease: "easeInOut" },
        });
        await headControls.start({
          rotate: 0,
          transition: { duration: 1.2, ease: "easeInOut" },
        });
      }
    };
    loop();
  }, [headControls]);

  // Blinking
  useEffect(() => {
    const schedule = () => {
      blinkTimerRef.current = setTimeout(
        () => {
          setBlinkOpen(false);
          setTimeout(() => {
            setBlinkOpen(true);
            schedule();
          }, 130);
        },
        2800 + Math.random() * 2000,
      );
    };
    schedule();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  const eyeScaleY = blinkOpen ? 1 : 0.05;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 70,
        right: 80,
        width: 280,
        height: 360,
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{
              position: "absolute",
              top: -10,
              left: -30,
              right: 20,
              background:
                "linear-gradient(135deg, rgba(40,30,70,0.97) 0%, rgba(60,40,100,0.97) 100%)",
              border: "1.5px solid rgba(160,120,255,0.5)",
              borderRadius: 16,
              padding: "10px 14px",
              color: "#e2d9ff",
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: 1.45,
              letterSpacing: 0.2,
              boxShadow:
                "0 0 20px rgba(140,100,255,0.35), 0 4px 16px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            {currentMessage}
            {/* Tail */}
            <div
              style={{
                position: "absolute",
                bottom: -10,
                right: 50,
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "10px solid rgba(60,40,100,0.97)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character */}
      <motion.div
        animate={floatControls}
        style={{ width: "100%", height: "100%" }}
      >
        <svg
          viewBox="0 0 300 380"
          width="280"
          height="360"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
          role="img"
          aria-label="Animated study boy at desk"
        >
          <defs>
            {/* Lamp glow */}
            <radialGradient id="lampGlow" cx="60%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#ffe8a0" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#ffcc50" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ff9900" stopOpacity="0" />
            </radialGradient>
            {/* Desk gradient */}
            <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5E3C" />
              <stop offset="100%" stopColor="#5C3A1E" />
            </linearGradient>
            {/* Desk side */}
            <linearGradient id="deskSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C3A1E" />
              <stop offset="100%" stopColor="#3B2010" />
            </linearGradient>
            {/* Skin gradient */}
            <radialGradient id="skinGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FDDBB4" />
              <stop offset="100%" stopColor="#E8A87C" />
            </radialGradient>
            {/* Hair gradient */}
            <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2C1810" />
              <stop offset="100%" stopColor="#1A0E08" />
            </linearGradient>
            {/* Shirt gradient */}
            <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B6FD4" />
              <stop offset="100%" stopColor="#2A50A0" />
            </linearGradient>
            {/* Book gradient */}
            <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F0E8" />
              <stop offset="100%" stopColor="#E8E0D0" />
            </linearGradient>
            {/* Coffee cup */}
            <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4F0FF" />
              <stop offset="100%" stopColor="#A8D8F0" />
            </linearGradient>
            {/* Drop shadow filter */}
            <filter
              id="softShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="6"
                floodColor="#000"
                floodOpacity="0.35"
              />
            </filter>
            <filter
              id="glowFilter"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Lamp beam */}
            <radialGradient id="deskLampBeam" cx="55%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffe080" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient desk lamp glow */}
          <ellipse cx="168" cy="238" rx="110" ry="60" fill="url(#lampGlow)" />
          <ellipse
            cx="168"
            cy="238"
            rx="80"
            ry="40"
            fill="url(#deskLampBeam)"
          />

          {/* ===== DESK ===== */}
          {/* Desk top surface */}
          <rect
            x="20"
            y="255"
            width="260"
            height="18"
            rx="2"
            fill="url(#deskGrad)"
            filter="url(#softShadow)"
          />
          {/* Desk front face */}
          <rect
            x="24"
            y="273"
            width="252"
            height="10"
            rx="1"
            fill="url(#deskSide)"
          />
          {/* Desk legs */}
          <rect x="35" y="283" width="14" height="55" rx="3" fill="#4A2C10" />
          <rect x="251" y="283" width="14" height="55" rx="3" fill="#4A2C10" />
          {/* Desk top edge highlight */}
          <rect
            x="20"
            y="255"
            width="260"
            height="3"
            rx="1"
            fill="rgba(255,220,160,0.25)"
          />

          {/* ===== BOOK ===== */}
          <motion.g
            animate={{ scaleX: [1, 0.995, 1], scaleY: [1, 1.004, 1] }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
            style={{ transformOrigin: "145px 248px" }}
          >
            {/* Book body */}
            <rect
              x="62"
              y="234"
              width="130"
              height="22"
              rx="2"
              fill="url(#bookGrad)"
            />
            {/* Book spine */}
            <rect x="122" y="234" width="5" height="22" fill="#C8B89A" />
            {/* Left page lines */}
            <line
              x1="72"
              y1="240"
              x2="118"
              y2="240"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="72"
              y1="244"
              x2="118"
              y2="244"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="72"
              y1="248"
              x2="110"
              y2="248"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="72"
              y1="252"
              x2="118"
              y2="252"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            {/* Right page lines */}
            <line
              x1="131"
              y1="240"
              x2="184"
              y2="240"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="131"
              y1="244"
              x2="184"
              y2="244"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="131"
              y1="248"
              x2="176"
              y2="248"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            <line
              x1="131"
              y1="252"
              x2="184"
              y2="252"
              stroke="#B0A898"
              strokeWidth="0.8"
            />
            {/* Book cover edge */}
            <rect
              x="62"
              y="234"
              width="130"
              height="22"
              rx="2"
              fill="none"
              stroke="#A89070"
              strokeWidth="0.8"
            />
          </motion.g>

          {/* ===== COFFEE CUP ===== */}
          <g transform="translate(202, 230)">
            {/* Saucer */}
            <ellipse cx="16" cy="26" rx="20" ry="5" fill="#B0C8D8" />
            {/* Cup body */}
            <path d="M4 8 Q4 26 16 26 Q28 26 28 8 Z" fill="url(#cupGrad)" />
            <path d="M4 8 Q4 2 16 2 Q28 2 28 8" fill="#D8ECFA" />
            {/* Coffee inside */}
            <ellipse
              cx="16"
              cy="8"
              rx="11"
              ry="4"
              fill="#5C3515"
              opacity="0.9"
            />
            {/* Handle */}
            <path
              d="M28 12 Q38 12 38 18 Q38 24 28 22"
              fill="none"
              stroke="#A8C8E0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Steam */}
            <g transform="translate(10, -4)">
              <SteamLine delay={0} x={0} />
              <SteamLine delay={0.7} x={6} />
              <SteamLine delay={1.4} x={12} />
            </g>
          </g>

          {/* ===== PENCIL HOLDER ===== */}
          <g transform="translate(215, 218)">
            <rect x="0" y="0" width="22" height="30" rx="3" fill="#7B4F2E" />
            <rect x="0" y="0" width="22" height="6" rx="3" fill="#9B6F4E" />
            {/* Pencils */}
            <rect x="4" y="-16" width="4" height="20" rx="1" fill="#F5D000" />
            <rect x="4" y="4" width="4" height="3" rx="0" fill="#FFAAAA" />
            <polygon points="4,-16 8,-16 6,-22" fill="#FFE066" />
            <polygon points="4,-16 8,-16 6,-20" fill="#E8B800" />
            <line
              x1="6"
              y1="-20"
              x2="6"
              y2="-16"
              stroke="#111"
              strokeWidth="0.6"
            />
            <rect x="11" y="-12" width="4" height="16" rx="1" fill="#60C060" />
            <rect x="11" y="4" width="4" height="3" rx="0" fill="#FFAAAA" />
            <polygon points="11,-12 15,-12 13,-18" fill="#80DD80" />
            <line
              x1="13"
              y1="-17"
              x2="13"
              y2="-12"
              stroke="#111"
              strokeWidth="0.6"
            />
          </g>

          {/* ===== SMALL PLANT ===== */}
          <g transform="translate(34, 210)">
            {/* Pot */}
            <path d="M4 28 Q2 44 20 44 Q38 44 36 28 Z" fill="#C05020" />
            <rect x="2" y="25" width="36" height="6" rx="3" fill="#D86030" />
            {/* Soil */}
            <ellipse cx="20" cy="28" rx="17" ry="4" fill="#3A2010" />
            {/* Leaves */}
            <path d="M20 28 Q12 14 6 10 Q14 8 20 20" fill="#3A8C3A" />
            <path d="M20 28 Q28 14 34 10 Q26 8 20 20" fill="#4AAC4A" />
            <path d="M20 28 Q16 10 20 4 Q24 10 20 28" fill="#2A7C2A" />
            <path
              d="M20 28 Q10 18 8 14 Q16 14 20 24"
              fill="#5AC05A"
              opacity="0.7"
            />
          </g>

          {/* ===== CHARACTER (floating group) ===== */}
          <motion.g
            animate={floatControls}
            style={{ originX: "150px", originY: "220px" }}
          >
            {/* ===== TORSO / SHIRT ===== */}
            <motion.g
              animate={torsoControls}
              style={{ transformOrigin: "150px 220px" }}
            >
              {/* Shirt body */}
              <path
                d="M108 175 Q90 182 86 210 Q84 235 86 255 L214 255 Q216 235 214 210 Q210 182 192 175 Q178 168 150 168 Q122 168 108 175 Z"
                fill="url(#shirtGrad)"
                filter="url(#softShadow)"
              />
              {/* Collar */}
              <path
                d="M135 175 Q150 185 165 175 L160 168 Q150 174 140 168 Z"
                fill="#2A50A0"
              />
              {/* Shirt fold lines */}
              <path
                d="M120 185 Q118 210 120 240"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M180 185 Q182 210 180 240"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Shirt highlight */}
              <path
                d="M130 172 Q150 180 170 172"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
                fill="none"
              />
            </motion.g>

            {/* ===== ARMS ===== */}
            {/* Left arm (passive) */}
            <path
              d="M108 178 Q92 188 82 210 Q78 225 80 255 L100 255 Q100 235 106 218 Q112 200 118 188 Z"
              fill="url(#skinGrad)"
            />
            {/* Left forearm on desk */}
            <path
              d="M82 252 Q90 248 115 250 Q118 255 115 258 Q90 258 82 256 Z"
              fill="#E8A87C"
            />

            {/* Right arm (writing) */}
            <motion.g
              animate={writingControls}
              style={{ transformOrigin: "185px 230px" }}
            >
              <path
                d="M192 178 Q208 188 218 210 Q222 225 220 255 L200 255 Q200 235 194 218 Q188 200 182 188 Z"
                fill="url(#skinGrad)"
              />
              {/* Right forearm on desk */}
              <path
                d="M218 250 Q205 246 180 249 Q178 255 180 258 Q205 258 218 256 Z"
                fill="#E8A87C"
              />
              {/* Hand with pencil */}
              <ellipse cx="196" cy="252" rx="9" ry="6" fill="#FDDBB4" />
              {/* Finger hints */}
              <path
                d="M188 249 Q190 245 193 248"
                stroke="#D4A070"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M191 247 Q194 243 197 246"
                stroke="#D4A070"
                strokeWidth="1"
                fill="none"
              />
              {/* Pencil */}
              <rect
                x="196"
                y="235"
                width="3"
                height="20"
                rx="1"
                fill="#F5D000"
                transform="rotate(-15, 197, 245)"
              />
              <polygon
                points="196,235 199,235 197.5,229"
                fill="#FFE066"
                transform="rotate(-15, 197, 245)"
              />
              <line
                x1="197.5"
                y1="230"
                x2="197.5"
                y2="235"
                stroke="#222"
                strokeWidth="0.7"
                transform="rotate(-15, 197, 245)"
              />
            </motion.g>

            {/* ===== NECK ===== */}
            <rect
              x="142"
              y="152"
              width="18"
              height="22"
              rx="5"
              fill="#FDDBB4"
            />
            {/* Clavicle hint */}
            <path
              d="M128 172 Q150 166 172 172"
              stroke="rgba(200,140,90,0.4)"
              strokeWidth="1.5"
              fill="none"
            />

            {/* ===== HEAD ===== */}
            <motion.g
              animate={headControls}
              style={{ transformOrigin: "151px 125px" }}
            >
              {/* Head shape - slightly non-circular, realistic */}
              <ellipse
                cx="151"
                cy="122"
                rx="44"
                ry="48"
                fill="url(#skinGrad)"
                filter="url(#softShadow)"
              />
              {/* Jaw/chin refinement */}
              <path
                d="M115 130 Q115 158 151 165 Q187 158 187 130"
                fill="#FDDBB4"
              />
              {/* Ear left */}
              <ellipse cx="107" cy="120" rx="7" ry="10" fill="#E8A87C" />
              <ellipse cx="107" cy="120" rx="4" ry="7" fill="#D4906A" />
              {/* Ear right */}
              <ellipse cx="195" cy="120" rx="7" ry="10" fill="#E8A87C" />
              <ellipse cx="195" cy="120" rx="4" ry="7" fill="#D4906A" />

              {/* ===== HAIR ===== */}
              {/* Main hair mass */}
              <path
                d="M108 115 Q106 80 120 68 Q135 56 151 54 Q167 56 181 68 Q194 80 193 115 Q185 98 175 88 Q163 78 151 76 Q139 78 127 88 Q116 98 108 115 Z"
                fill="url(#hairGrad)"
              />
              {/* Hair top */}
              <path
                d="M120 68 Q135 56 151 54 Q167 56 181 68 Q171 58 151 56 Q131 58 120 68 Z"
                fill="#3C2218"
              />
              {/* Hair side strands - left */}
              <path
                d="M108 115 Q104 108 106 96 Q108 86 113 80"
                stroke="#1A0E08"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M109 118 Q105 110 107 98"
                stroke="#2C1810"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.4"
              />
              {/* Hair side strands - right */}
              <path
                d="M193 115 Q197 108 195 96 Q193 86 188 80"
                stroke="#1A0E08"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Hair highlight */}
              <path
                d="M135 62 Q151 56 166 63"
                stroke="rgba(80,50,30,0.5)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />

              {/* ===== GLASSES ===== */}
              {/* Left lens frame */}
              <rect
                x="116"
                y="106"
                width="30"
                height="22"
                rx="8"
                fill="rgba(180,210,255,0.15)"
                stroke="#555"
                strokeWidth="2"
              />
              {/* Right lens frame */}
              <rect
                x="154"
                y="106"
                width="30"
                height="22"
                rx="8"
                fill="rgba(180,210,255,0.15)"
                stroke="#555"
                strokeWidth="2"
              />
              {/* Bridge */}
              <path
                d="M146 116 L154 116"
                stroke="#555"
                strokeWidth="1.8"
                fill="none"
              />
              {/* Temple left */}
              <path
                d="M116 116 L108 112"
                stroke="#555"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              {/* Temple right */}
              <path
                d="M184 116 L192 112"
                stroke="#555"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              {/* Lens glint left */}
              <path
                d="M120 110 L126 108"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
              {/* Lens glint right */}
              <path
                d="M158 110 L164 108"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />

              {/* ===== EYEBROWS ===== */}
              <path
                d="M120 103 Q131 99 141 102"
                stroke="#2C1810"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M159 102 Q169 99 180 103"
                stroke="#2C1810"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* ===== EYES ===== */}
              {/* Left eye */}
              <motion.g
                animate={{ scaleY: eyeScaleY }}
                transition={{ duration: blinkOpen ? 0.15 : 0.08 }}
                style={{ transformOrigin: "131px 117px" }}
              >
                <ellipse cx="131" cy="117" rx="9" ry="7" fill="#2A1A0A" />
                <ellipse cx="131" cy="117" rx="6" ry="5" fill="#4A3A8A" />
                <ellipse cx="131" cy="117" rx="3.5" ry="3.5" fill="#111" />
                <circle cx="133" cy="114" r="1.8" fill="white" opacity="0.9" />
                <circle cx="129" cy="119" r="0.8" fill="white" opacity="0.4" />
              </motion.g>
              {/* Left eyelid */}
              <path
                d="M122 113 Q131 108 140 113"
                stroke="#C88A6A"
                strokeWidth="1"
                fill="none"
              />

              {/* Right eye */}
              <motion.g
                animate={{ scaleY: eyeScaleY }}
                transition={{ duration: blinkOpen ? 0.15 : 0.08 }}
                style={{ transformOrigin: "169px 117px" }}
              >
                <ellipse cx="169" cy="117" rx="9" ry="7" fill="#2A1A0A" />
                <ellipse cx="169" cy="117" rx="6" ry="5" fill="#4A3A8A" />
                <ellipse cx="169" cy="117" rx="3.5" ry="3.5" fill="#111" />
                <circle cx="171" cy="114" r="1.8" fill="white" opacity="0.9" />
                <circle cx="167" cy="119" r="0.8" fill="white" opacity="0.4" />
              </motion.g>
              {/* Right eyelid */}
              <path
                d="M160 113 Q169 108 178 113"
                stroke="#C88A6A"
                strokeWidth="1"
                fill="none"
              />

              {/* ===== NOSE ===== */}
              <path
                d="M148 120 Q145 132 143 138 Q148 140 151 139 Q154 140 159 138 Q157 132 154 120"
                fill="none"
                stroke="#C88A6A"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <circle cx="145" cy="136" r="2" fill="#C88A6A" opacity="0.35" />
              <circle cx="157" cy="136" r="2" fill="#C88A6A" opacity="0.35" />

              {/* ===== MOUTH / SMILE ===== */}
              <path
                d="M138 148 Q151 158 164 148"
                stroke="#A06040"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              {/* Teeth hint */}
              <path
                d="M141 150 Q151 156 161 150 Q156 154 151 154 Q146 154 141 150 Z"
                fill="white"
                opacity="0.7"
              />
              {/* Smile dimples */}
              <circle cx="136" cy="149" r="2" fill="#D4906A" opacity="0.35" />
              <circle cx="166" cy="149" r="2" fill="#D4906A" opacity="0.35" />

              {/* ===== CHEEK FLUSH ===== */}
              <ellipse
                cx="120"
                cy="140"
                rx="12"
                ry="8"
                fill="#FF9999"
                opacity="0.18"
              />
              <ellipse
                cx="182"
                cy="140"
                rx="12"
                ry="8"
                fill="#FF9999"
                opacity="0.18"
              />
            </motion.g>
          </motion.g>

          {/* ===== KNOWLEDGE PARTICLES ===== */}
          <KnowledgeParticle x={100} y={232} delay={0} />
          <KnowledgeParticle x={130} y={228} delay={1.1} />
          <KnowledgeParticle x={158} y={230} delay={2.0} />
          <KnowledgeParticle x={180} y={233} delay={0.6} />
        </svg>
      </motion.div>
    </div>
  );
}
