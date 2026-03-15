const BAR_COUNT = 20;

const DELAYS = [
  0, 0.05, 0.12, 0.08, 0.18, 0.03, 0.15, 0.22, 0.07, 0.14, 0.19, 0.02, 0.11,
  0.09, 0.16, 0.06, 0.21, 0.04, 0.13, 0.1,
];
const DURATIONS = [
  0.7, 0.82, 0.65, 0.9, 0.75, 0.88, 0.6, 0.95, 0.72, 0.85, 0.68, 0.92, 0.78,
  0.63, 0.87, 0.8, 0.66, 0.93, 0.74, 0.83,
];

// stable keys — never reordered
const BAR_KEYS = Array.from({ length: BAR_COUNT }, (_, i) => `wf-bar-${i}`);

export function WaveformVisualizer({
  isPlaying,
  color = "oklch(0.72 0.17 162)",
}: {
  isPlaying: boolean;
  color?: string;
}) {
  return (
    <div
      className="flex items-end gap-[2px]"
      style={{ height: 28, width: BAR_COUNT * 6 }}
      aria-hidden="true"
    >
      {BAR_KEYS.map((key, i) => (
        <div
          key={key}
          className="rounded-full"
          style={{
            flex: 1,
            height: isPlaying ? undefined : 3,
            minHeight: 3,
            background: color,
            opacity: 0.35 + (i / BAR_COUNT) * 0.65,
            animation: isPlaying
              ? `music-bar ${DURATIONS[i]}s ease-in-out infinite ${DELAYS[i]}s`
              : "none",
            transition: "height 0.4s ease, opacity 0.3s ease",
            willChange: isPlaying ? "height" : "auto",
          }}
        />
      ))}
    </div>
  );
}
