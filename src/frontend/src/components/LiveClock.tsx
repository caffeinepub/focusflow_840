import { useEffect, useState } from "react";

export function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [colonOn, setColonOn] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setTime(new Date());
      setColonOn((v) => !v);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const h = time.getHours().toString().padStart(2, "0");
  const m = time.getMinutes().toString().padStart(2, "0");
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="flex flex-col items-end select-none">
      <div
        className="flex items-baseline gap-0.5 tabular-nums"
        style={{
          fontFamily: "'Bricolage Grotesque', 'JetBrains Mono', monospace",
          fontSize: "1.85rem",
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        <span className="text-gradient-primary">{h}</span>
        <span
          style={{
            color: "oklch(0.72 0.17 162)",
            opacity: colonOn ? 1 : 0.2,
            transition: "opacity 0.3s ease",
            display: "inline-block",
            width: "0.45em",
            textAlign: "center",
          }}
        >
          :
        </span>
        <span className="text-gradient-primary">{m}</span>
      </div>
      <div className="text-[11px] text-muted-foreground/50 mt-0.5 tracking-wider">
        {days[time.getDay()]}, {months[time.getMonth()]} {time.getDate()}
      </div>
    </div>
  );
}
