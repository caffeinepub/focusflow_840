import { useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  disabled?: boolean;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 7,
  disabled = false,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((py - cy) / cy) * -maxTilt;
    const rotY = ((px - cx) / cx) * maxTilt;
    setTilt({ x: rotX, y: rotY });
    setShine({ x: (px / rect.width) * 100, y: (py / rect.height) * 100 });
  }

  function onLeave() {
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
    setHovered(false);
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered
          ? "transform 0.08s ease-out"
          : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
      {/* Specular highlight layer */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
        style={{
          background: hovered
            ? `radial-gradient(circle at ${shine.x}% ${shine.y}%, oklch(1 0 0 / 0.09) 0%, transparent 55%)`
            : "none",
          transition: "background 0.06s ease",
        }}
      />
    </div>
  );
}
