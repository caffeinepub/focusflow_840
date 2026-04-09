import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type HardcoreSensors = {
  mic: boolean;
  camera: boolean;
};

export type HardcoreStatus = "off" | "active" | "warning";

interface Props {
  /** Whether the timer/stopwatch is currently running */
  isRunning: boolean;
  /** Called when hardcore mode wants to pause the active timer */
  onPauseTimer: () => void;
  /** Fired when hardcore mode is deactivated so the parent can reflect state */
  onStatusChange: (status: HardcoreStatus) => void;
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const SOUND_DB_THRESHOLD = 75;
const CAMERA_CHECK_INTERVAL_MS = 500;
const NO_PRESENCE_SECONDS = 5;
const PRESENCE_VARIANCE_THRESHOLD = 12;

/* ─────────────────────────────────────────────
   Module-level refs for stream handoff
   (PermissionModal acquires streams inside click handler,
    parent consumes them synchronously in onActivate callback)
───────────────────────────────────────────── */
let pendingMicStream: MediaStream | null = null;
let pendingCamStream: MediaStream | null = null;

/* ─────────────────────────────────────────────
   Warning Modal
───────────────────────────────────────────── */
function WarningModal({
  type,
  dbValue,
  onResume,
  onDeactivate,
}: {
  type: "sound" | "camera";
  dbValue?: number;
  onResume: () => void;
  onDeactivate: () => void;
}) {
  const isSoundWarning = type === "sound";
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(0.04 0.02 20 / 0.85)",
          backdropFilter: "blur(18px)",
        }}
      />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 rounded-3xl p-8 mx-4"
        style={{
          background: "oklch(0.10 0.04 20 / 0.95)",
          border: "1.5px solid oklch(0.55 0.22 25 / 0.7)",
          boxShadow:
            "0 0 60px oklch(0.55 0.22 25 / 0.35), 0 0 120px oklch(0.55 0.22 25 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.06)",
          maxWidth: 420,
          width: "100%",
        }}
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.8 }}
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 90,
              height: 90,
              border: "2px solid oklch(0.60 0.23 25 / 0.5)",
            }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="relative z-10 flex items-center justify-center rounded-full text-4xl"
            style={{
              width: 72,
              height: 72,
              background:
                "radial-gradient(circle, oklch(0.22 0.10 25) 0%, oklch(0.12 0.06 25) 100%)",
              border: "1.5px solid oklch(0.55 0.22 25 / 0.6)",
              boxShadow: "0 0 24px oklch(0.60 0.23 25 / 0.50)",
            }}
            animate={{ rotate: [-4, 4, -4, 4, 0] }}
            transition={{ duration: 0.5, repeat: 3, ease: "easeInOut" }}
          >
            {isSoundWarning ? "🔊" : "👁️"}
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <h2
            className="text-xl font-display font-bold"
            style={{ color: "oklch(0.78 0.18 25)" }}
          >
            {isSoundWarning ? "Loud Sound Detected!" : "You Left Your Desk!"}
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.62 0.05 25)" }}
          >
            {isSoundWarning
              ? `A loud sound of ${dbValue !== undefined ? `${Math.round(dbValue)} dB` : "above 75 dB"} was detected. Please maintain a quiet environment.`
              : "No one was detected at the study area for 5 seconds. Please return to your desk."}
          </p>
          <p
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: "oklch(0.55 0.22 25 / 0.8)" }}
          >
            ⏸ Your timer has been paused
          </p>
        </div>

        <div
          className="w-full h-px"
          style={{ background: "oklch(0.55 0.22 25 / 0.20)" }}
        />

        <div className="flex flex-col gap-3 w-full">
          <motion.button
            type="button"
            data-ocid="hardcore.warning_resume_button"
            className="w-full py-3 rounded-2xl font-bold text-sm tracking-wide"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.48 0.22 25), oklch(0.40 0.20 30))",
              color: "oklch(0.96 0.02 25)",
              boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.35)",
              border: "1px solid oklch(0.55 0.22 25 / 0.4)",
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 28px oklch(0.60 0.23 25 / 0.50)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={onResume}
          >
            ▶ Resume Timer
          </motion.button>
          <motion.button
            type="button"
            data-ocid="hardcore.warning_deactivate_button"
            className="w-full py-2.5 rounded-2xl text-sm font-medium"
            style={{
              background: "oklch(0.14 0.03 25 / 0.6)",
              color: "oklch(0.50 0.04 25)",
              border: "1px solid oklch(0.22 0.04 25 / 0.5)",
            }}
            whileHover={{ color: "oklch(0.70 0.06 25)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onDeactivate}
          >
            Deactivate Hardcore Mode
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Permission Modal
   Key fix: getUserMedia is called DIRECTLY inside the async onClick
   handler, preserving the user-gesture context so browsers show
   the native permission dialog.
───────────────────────────────────────────── */
function PermissionModal({
  onActivate,
  onCancel,
}: {
  onActivate: (sensors: HardcoreSensors) => void;
  onCancel: () => void;
}) {
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const canActivate = mic || camera;

  const handleActivateClick = async () => {
    if (!canActivate || isRequesting) return;
    setIsRequesting(true);

    let micOk = false;
    let camOk = false;

    // ── Microphone: call getUserMedia directly here (user gesture context) ──
    if (mic) {
      let denied = false;
      try {
        const perm = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (perm.state === "denied") denied = true;
      } catch {
        /* permissions.query not supported — proceed */
      }

      if (denied) {
        toast.error("🎤 Microphone blocked", {
          description:
            "Click the 🔒 lock icon in your browser's address bar → allow Microphone → try again.",
          duration: 8000,
        });
      } else {
        try {
          // This getUserMedia call is in the user-gesture stack — browser WILL prompt
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          pendingMicStream = stream;
          micOk = true;
        } catch (err) {
          const e = err as Error;
          if (
            e.name === "NotAllowedError" ||
            e.name === "SecurityError" ||
            e.name === "PermissionDeniedError"
          ) {
            toast.error("🎤 Microphone permission denied", {
              description:
                "Click the 🔒 lock icon in your address bar → allow Microphone → try again.",
              duration: 8000,
            });
          } else {
            toast.error("🎤 Microphone unavailable", {
              description: e.message || "Could not access microphone.",
              duration: 5000,
            });
          }
        }
      }
    }

    // ── Camera: call getUserMedia directly here ──
    if (camera) {
      let denied = false;
      try {
        const perm = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (perm.state === "denied") denied = true;
      } catch {
        /* permissions.query not supported — proceed */
      }

      if (denied) {
        toast.error("📷 Camera blocked", {
          description:
            "Click the 🔒 lock icon in your browser's address bar → allow Camera → try again.",
          duration: 8000,
        });
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" },
          });
          pendingCamStream = stream;
          camOk = true;
        } catch (err) {
          const e = err as Error;
          if (
            e.name === "NotAllowedError" ||
            e.name === "SecurityError" ||
            e.name === "PermissionDeniedError"
          ) {
            toast.error("📷 Camera permission denied", {
              description:
                "Click the 🔒 lock icon in your address bar → allow Camera → try again.",
              duration: 8000,
            });
          } else {
            toast.error("📷 Camera unavailable", {
              description: e.message || "Could not access camera.",
              duration: 5000,
            });
          }
        }
      }
    }

    setIsRequesting(false);

    if (!micOk && !camOk) {
      // Clean up any partial streams
      if (pendingMicStream) {
        for (const t of pendingMicStream.getTracks()) t.stop();
        pendingMicStream = null;
      }
      if (pendingCamStream) {
        for (const t of pendingCamStream.getTracks()) t.stop();
        pendingCamStream = null;
      }
      return;
    }

    // Hand off to parent — streams are stored in module-level refs
    onActivate({ mic: micOk, camera: camOk });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Close modal"
        className="absolute inset-0 cursor-pointer"
        style={{
          background: "oklch(0.04 0.02 270 / 0.80)",
          backdropFilter: "blur(20px)",
        }}
        onClick={onCancel}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      />

      <motion.div
        className="relative z-10 rounded-3xl p-8 mx-4 flex flex-col gap-6"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.11 0.04 25 / 0.97) 0%, oklch(0.09 0.03 270 / 0.97) 100%)",
          border: "1.5px solid oklch(0.48 0.20 30 / 0.55)",
          boxShadow:
            "0 0 80px oklch(0.55 0.22 25 / 0.28), 0 0 160px oklch(0.55 0.22 25 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.06)",
          maxWidth: 440,
          width: "100%",
        }}
        initial={{ scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.75, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24, mass: 0.9 }}
      >
        <motion.div
          className="absolute -inset-4 rounded-[2rem] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, oklch(0.55 0.22 25 / 0.12) 0%, transparent 65%)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
        />

        {/* Header */}
        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center justify-center rounded-2xl text-3xl flex-shrink-0"
            style={{
              width: 60,
              height: 60,
              background:
                "linear-gradient(135deg, oklch(0.25 0.12 25), oklch(0.15 0.08 35))",
              border: "1.5px solid oklch(0.55 0.22 25 / 0.45)",
              boxShadow: "0 0 30px oklch(0.60 0.23 25 / 0.40)",
            }}
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            🔥
          </motion.div>
          <div>
            <h2
              className="font-display font-bold text-xl tracking-tight"
              style={{ color: "oklch(0.88 0.12 30)" }}
            >
              Hardcore Study Mode
            </h2>
            <p
              className="text-xs mt-0.5 tracking-wide"
              style={{ color: "oklch(0.50 0.06 30)" }}
            >
              Environment monitoring for maximum focus
            </p>
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: "oklch(0.55 0.04 25)" }}
        >
          When you click{" "}
          <strong style={{ color: "oklch(0.75 0.12 28)" }}>Activate</strong>,
          your browser will show a permission popup for the sensors you select
          below. Click{" "}
          <strong style={{ color: "oklch(0.75 0.12 28)" }}>Allow</strong> to
          enable monitoring.
        </p>

        {/* Sensor toggles */}
        <div className="space-y-3">
          <p
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: "oklch(0.45 0.06 25)" }}
          >
            Enable sensors
          </p>

          {/* Microphone toggle */}
          <motion.button
            type="button"
            data-ocid="hardcore.mic_toggle"
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
            style={{
              background: mic
                ? "oklch(0.18 0.08 25 / 0.7)"
                : "oklch(0.12 0.03 270 / 0.5)",
              border: mic
                ? "1.5px solid oklch(0.55 0.22 25 / 0.50)"
                : "1.5px solid oklch(0.22 0.04 270 / 0.35)",
              boxShadow: mic ? "0 0 16px oklch(0.55 0.22 25 / 0.18)" : "none",
            }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMic((v) => !v)}
          >
            <span className="text-2xl flex-shrink-0">🎤</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold"
                style={{
                  color: mic ? "oklch(0.82 0.12 28)" : "oklch(0.50 0.03 270)",
                }}
              >
                Microphone Monitoring
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.42 0.04 25)" }}
              >
                Pauses timer if sound exceeds 75 dB
              </div>
            </div>
            <div
              className="relative flex-shrink-0"
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: mic
                  ? "linear-gradient(90deg, oklch(0.48 0.22 25), oklch(0.55 0.22 30))"
                  : "oklch(0.20 0.03 270)",
                transition: "background 0.3s ease",
                boxShadow: mic ? "0 0 10px oklch(0.55 0.22 25 / 0.45)" : "none",
              }}
            >
              <motion.div
                className="absolute top-1 rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  background: "oklch(0.96 0.01 60)",
                  boxShadow: "0 1px 4px oklch(0 0 0 / 0.4)",
                }}
                animate={{ left: mic ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </motion.button>

          {/* Camera toggle */}
          <motion.button
            type="button"
            data-ocid="hardcore.camera_toggle"
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
            style={{
              background: camera
                ? "oklch(0.18 0.08 25 / 0.7)"
                : "oklch(0.12 0.03 270 / 0.5)",
              border: camera
                ? "1.5px solid oklch(0.55 0.22 25 / 0.50)"
                : "1.5px solid oklch(0.22 0.04 270 / 0.35)",
              boxShadow: camera
                ? "0 0 16px oklch(0.55 0.22 25 / 0.18)"
                : "none",
            }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCamera((v) => !v)}
          >
            <span className="text-2xl flex-shrink-0">📷</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold"
                style={{
                  color: camera
                    ? "oklch(0.82 0.12 28)"
                    : "oklch(0.50 0.03 270)",
                }}
              >
                Camera Monitoring
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.42 0.04 25)" }}
              >
                Pauses timer if you leave your desk for 5s
              </div>
            </div>
            <div
              className="relative flex-shrink-0"
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: camera
                  ? "linear-gradient(90deg, oklch(0.48 0.22 25), oklch(0.55 0.22 30))"
                  : "oklch(0.20 0.03 270)",
                transition: "background 0.3s ease",
                boxShadow: camera
                  ? "0 0 10px oklch(0.55 0.22 25 / 0.45)"
                  : "none",
              }}
            >
              <motion.div
                className="absolute top-1 rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  background: "oklch(0.96 0.01 60)",
                  boxShadow: "0 1px 4px oklch(0 0 0 / 0.4)",
                }}
                animate={{ left: camera ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </motion.button>
        </div>

        {/* Permission info note */}
        <div
          className="flex items-start gap-2.5 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            background: "oklch(0.14 0.04 200 / 0.5)",
            border: "1px solid oklch(0.35 0.08 200 / 0.35)",
            color: "oklch(0.58 0.06 200)",
          }}
        >
          <span className="text-sm mt-0.5 flex-shrink-0">ℹ️</span>
          <span>
            Your browser will show a <strong>native permission popup</strong>{" "}
            when you activate. If the popup doesn't appear, click the{" "}
            <strong>🔒 lock</strong> icon in the address bar to reset site
            permissions.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            data-ocid="hardcore.activate_button"
            disabled={!canActivate || isRequesting}
            className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                canActivate && !isRequesting
                  ? "linear-gradient(135deg, oklch(0.50 0.22 25), oklch(0.42 0.20 32))"
                  : "oklch(0.20 0.04 25)",
              color: "oklch(0.96 0.02 25)",
              boxShadow:
                canActivate && !isRequesting
                  ? "0 0 28px oklch(0.55 0.22 25 / 0.40)"
                  : "none",
              border: "1px solid oklch(0.55 0.22 25 / 0.40)",
            }}
            whileHover={
              canActivate && !isRequesting
                ? {
                    scale: 1.02,
                    boxShadow: "0 0 36px oklch(0.60 0.23 25 / 0.55)",
                  }
                : {}
            }
            whileTap={canActivate && !isRequesting ? { scale: 0.97 } : {}}
            onClick={handleActivateClick}
          >
            {isRequesting
              ? "⏳ Requesting permissions…"
              : "🔥 Activate Hardcore Mode"}
          </motion.button>
          <motion.button
            type="button"
            data-ocid="hardcore.cancel_button"
            className="w-full py-2.5 rounded-2xl text-sm font-medium"
            style={{
              background: "oklch(0.13 0.03 270 / 0.6)",
              color: "oklch(0.48 0.04 270)",
              border: "1px solid oklch(0.20 0.03 270 / 0.5)",
            }}
            whileHover={{ color: "oklch(0.65 0.04 270)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Active Badge (shown in timer card)
───────────────────────────────────────────── */
export function HardcoreActiveBadge({
  sensors,
  onDeactivate,
}: {
  sensors: HardcoreSensors;
  onDeactivate: () => void;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0, scale: 0.7, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide"
        style={{
          background: "oklch(0.18 0.08 25 / 0.85)",
          border: "1.5px solid oklch(0.55 0.22 25 / 0.55)",
          color: "oklch(0.82 0.15 28)",
          boxShadow: "0 0 16px oklch(0.55 0.22 25 / 0.30)",
        }}
        animate={{
          boxShadow: [
            "0 0 12px oklch(0.55 0.22 25 / 0.25)",
            "0 0 22px oklch(0.60 0.23 25 / 0.55)",
            "0 0 12px oklch(0.55 0.22 25 / 0.25)",
          ],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <span>🔥</span>
        <span>HARDCORE MODE</span>
        {sensors.mic && <span title="Mic active">🎤</span>}
        {sensors.camera && <span title="Camera active">📷</span>}
      </motion.div>

      <motion.button
        type="button"
        data-ocid="hardcore.deactivate_button"
        className="px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: "oklch(0.13 0.03 25 / 0.6)",
          color: "oklch(0.48 0.06 25)",
          border: "1px solid oklch(0.28 0.06 25 / 0.45)",
        }}
        whileHover={{
          color: "oklch(0.72 0.10 25)",
          border: "1px solid oklch(0.45 0.10 25 / 0.6)",
        }}
        whileTap={{ scale: 0.93 }}
        onClick={onDeactivate}
      >
        Deactivate
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main HardcoreMode Component
───────────────────────────────────────────── */
export function HardcoreMode({
  isRunning,
  onPauseTimer,
  onStatusChange,
}: Props) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [status, setStatus] = useState<HardcoreStatus>("off");
  const [sensors, setSensors] = useState<HardcoreSensors>({
    mic: false,
    camera: false,
  });
  const [warningType, setWarningType] = useState<"sound" | "camera" | null>(
    null,
  );
  const [lastDb, setLastDb] = useState<number | undefined>(undefined);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRafRef = useRef<number | null>(null);
  const noPresenceCountRef = useRef<number>(0);
  const camCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const statusRef = useRef(status);
  statusRef.current = status;
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const sensorsRef = useRef(sensors);
  sensorsRef.current = sensors;

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (status === "active" && !isRunning) {
      stopMicMonitoring();
      stopCameraMonitoring();
    } else if (status === "active" && isRunning) {
      if (sensorsRef.current.mic) startMicMonitoring();
      if (sensorsRef.current.camera) startCameraMonitoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, status]);

  useEffect(
    () => () => {
      releaseAllStreams();
    },
    [],
  );

  function startMicMonitoring() {
    if (micIntervalRef.current) return;
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    micIntervalRef.current = setInterval(() => {
      if (!isRunningRef.current || statusRef.current !== "active") return;
      analyser.getFloatTimeDomainData(dataArray);
      let sumSquares = 0;
      for (const v of dataArray) sumSquares += v * v;
      const rms = Math.sqrt(sumSquares / bufferLength);
      const db = rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY;
      if (db > SOUND_DB_THRESHOLD) {
        setLastDb(db);
        triggerWarning("sound");
      }
    }, 500);
  }

  function stopMicMonitoring() {
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
  }

  function startCameraMonitoring() {
    if (camCheckIntervalRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    noPresenceCountRef.current = 0;
    camCheckIntervalRef.current = setInterval(() => {
      if (!isRunningRef.current || statusRef.current !== "active") return;
      if (video.readyState < 2) return;
      const w = video.videoWidth || 320;
      const h = video.videoHeight || 240;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const cx = Math.floor(w * 0.3);
      const cy = Math.floor(h * 0.3);
      const cw = Math.floor(w * 0.4);
      const ch = Math.floor(h * 0.4);
      const imageData = ctx.getImageData(cx, cy, cw, ch);
      const pixels = imageData.data;
      let sum = 0;
      const totalPx = cw * ch;
      for (let i = 0; i < pixels.length; i += 4) {
        sum +=
          0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      const mean = sum / totalPx;
      let varianceSum = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const luma =
          0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        varianceSum += (luma - mean) ** 2;
      }
      const variance = varianceSum / totalPx;
      if (variance < PRESENCE_VARIANCE_THRESHOLD) {
        noPresenceCountRef.current += 1;
        const secondsAbsent =
          (noPresenceCountRef.current * CAMERA_CHECK_INTERVAL_MS) / 1000;
        if (secondsAbsent >= NO_PRESENCE_SECONDS) {
          noPresenceCountRef.current = 0;
          triggerWarning("camera");
        }
      } else {
        noPresenceCountRef.current = 0;
      }
    }, CAMERA_CHECK_INTERVAL_MS);
  }

  function stopCameraMonitoring() {
    if (camCheckIntervalRef.current) {
      clearInterval(camCheckIntervalRef.current);
      camCheckIntervalRef.current = null;
    }
    if (cameraRafRef.current) {
      cancelAnimationFrame(cameraRafRef.current);
      cameraRafRef.current = null;
    }
  }

  function triggerWarning(type: "sound" | "camera") {
    if (statusRef.current !== "active") return;
    stopMicMonitoring();
    stopCameraMonitoring();
    onPauseTimer();
    setWarningType(type);
    setStatus("warning");
  }

  function releaseAllStreams() {
    stopMicMonitoring();
    stopCameraMonitoring();
    if (micStreamRef.current) {
      for (const t of micStreamRef.current.getTracks()) t.stop();
      micStreamRef.current = null;
    }
    if (camStreamRef.current) {
      for (const t of camStreamRef.current.getTracks()) t.stop();
      camStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  /**
   * Called by PermissionModal after getUserMedia succeeds.
   * Streams are already in pendingMicStream / pendingCamStream.
   * We just wire them up and start monitoring.
   */
  function handleActivate(chosenSensors: HardcoreSensors) {
    setShowPermissionModal(false);

    const micStream = pendingMicStream;
    const camStream = pendingCamStream;
    pendingMicStream = null;
    pendingCamStream = null;

    let micReady = false;
    if (chosenSensors.mic && micStream) {
      micStreamRef.current = micStream;
      try {
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(micStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;
        micReady = true;
      } catch {
        toast.error("🎤 Audio context failed", { duration: 4000 });
      }
    }

    if (chosenSensors.camera && camStream) {
      camStreamRef.current = camStream;
      if (!videoRef.current) {
        videoRef.current = document.createElement("video");
        videoRef.current.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;width:320px;height:240px;";
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        document.body.appendChild(videoRef.current);
      }
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        canvasRef.current.style.display = "none";
        document.body.appendChild(canvasRef.current);
      }
      videoRef.current.srcObject = camStream;
      videoRef.current.play().catch(() => {});
    }

    const finalSensors = {
      mic: chosenSensors.mic && !!micStream && micReady,
      camera: chosenSensors.camera && !!camStream,
    };
    setSensors(finalSensors);

    if (!finalSensors.mic && !finalSensors.camera) {
      toast.error("❌ No sensors available", {
        description: "Hardcore mode requires at least one sensor permission.",
        duration: 5000,
      });
      return;
    }

    setStatus("active");
    if (finalSensors.mic && isRunning) startMicMonitoring();
    if (finalSensors.camera && isRunning) startCameraMonitoring();

    toast.success("🔥 Hardcore Mode Activated!", {
      description: `Monitoring: ${[finalSensors.mic && "🎤 Mic", finalSensors.camera && "📷 Camera"].filter(Boolean).join(", ")}`,
      duration: 4000,
    });
  }

  function handleWarningResume() {
    setWarningType(null);
    setStatus("active");
    toast("▶ Hardcore Mode still active — press Start to resume your timer.", {
      duration: 4000,
    });
    setTimeout(() => {
      if (sensors.mic) startMicMonitoring();
      if (sensors.camera) startCameraMonitoring();
    }, 1500);
  }

  function handleDeactivate() {
    setWarningType(null);
    releaseAllStreams();
    setSensors({ mic: false, camera: false });
    setStatus("off");
    setLastDb(undefined);
    toast("Hardcore mode deactivated.", { duration: 3000 });
  }

  function handleBadgeDeactivate() {
    releaseAllStreams();
    setSensors({ mic: false, camera: false });
    setStatus("off");
    setLastDb(undefined);
    toast("Hardcore mode deactivated.", { duration: 3000 });
  }

  return (
    <>
      <AnimatePresence>
        {status === "off" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              type="button"
              data-ocid="hardcore.enable_button"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold"
              style={{
                background: "oklch(0.14 0.06 25 / 0.7)",
                border: "1.5px solid oklch(0.40 0.16 25 / 0.45)",
                color: "oklch(0.70 0.14 28)",
                boxShadow: "0 0 12px oklch(0.50 0.18 25 / 0.18)",
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 0 20px oklch(0.55 0.22 25 / 0.35)",
                color: "oklch(0.85 0.16 28)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPermissionModal(true)}
            >
              🔥 Hardcore Mode
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "active" && (
          <HardcoreActiveBadge
            sensors={sensors}
            onDeactivate={handleBadgeDeactivate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "warning" && (
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "oklch(0.20 0.08 25 / 0.9)",
              border: "1.5px solid oklch(0.55 0.22 25 / 0.65)",
              color: "oklch(0.78 0.16 25)",
              boxShadow: "0 0 14px oklch(0.55 0.22 25 / 0.40)",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            initial={{ opacity: 0, scale: 0.8 }}
          >
            ⚠️ PAUSED — DISTRACTION DETECTED
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPermissionModal && (
          <PermissionModal
            onActivate={handleActivate}
            onCancel={() => setShowPermissionModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {warningType && (
          <WarningModal
            type={warningType}
            dbValue={lastDb}
            onResume={handleWarningResume}
            onDeactivate={handleDeactivate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
