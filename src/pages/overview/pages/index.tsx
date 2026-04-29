import {
  Activity,
  AlertTriangle,
  CloudRain,
  Droplets,
  Radio,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const countdownSeconds = 3.5;

export default function Overview() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepMs = 50;
    const totalSteps = (countdownSeconds * 1000) / stepMs;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setProgress(Math.min(100, Math.round((current / totalSteps) * 100)));

      if (current >= totalSteps) {
        clearInterval(timer);

        const accessToken = localStorage.getItem("accessToken");

        if (accessToken) {
          navigate("/app/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }
    }, stepMs);

    return () => clearInterval(timer);
  }, [countdownSeconds, navigate]);

  const skip = () => navigate("/app/dashboard", { replace: true });

  const orbitingIcons = [
    { Icon: Droplets, delay: 0, color: "text-cyan-400" },
    { Icon: Waves, delay: 1, color: "text-blue-400" },
    { Icon: CloudRain, delay: 2, color: "text-sky-400" },
    { Icon: AlertTriangle, delay: 3, color: "text-amber-400" },
    { Icon: Activity, delay: 4, color: "text-emerald-400" },
    { Icon: Radio, delay: 5, color: "text-cyan-300" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b2340] via-[#0f345f] to-[#1a5d9f] px-4 py-6 text-white">
      {/* Background blur effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center">
        {/* Logo container with orbiting icons */}
        <div className="relative mb-8 h-48 w-48 sm:h-56 sm:w-56">
          {/* Orbit rings */}
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-4 rounded-full border border-white/5" />
          <div className="absolute inset-8 rounded-full border border-dashed border-white/10" />

          {/* Orbiting icons */}
          {orbitingIcons.map(({ Icon, delay, color }, index) => (
            <div
              key={index}
              className="absolute left-1/2 top-1/2 h-full w-full"
              style={{
                animation: `orbit 12s linear infinite`,
                animationDelay: `${delay * -2}s`,
              }}
            >
              <div
                className={`absolute -left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm sm:h-7 sm:w-7 ${color}`}
              >
                <Icon size={14} className="sm:h-4 sm:w-4" />
              </div>
            </div>
          ))}

          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm ring-1 ring-white/20 sm:h-28 sm:w-28">
              {/* Inner glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-300/10 to-transparent" />

              {/* Logo icon */}
              <svg
                viewBox="0 0 48 48"
                className="relative z-10 h-12 w-12 text-cyan-300 sm:h-14 sm:w-14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M24 4v8" />
                <path d="M24 36v8" />
                <path d="M4 24h8" />
                <path d="M36 24h8" />
                <circle cx="24" cy="24" r="10" />
                <path d="M18 24c0-3.3 2.7-6 6-6" />
                <path d="M30 24c0 3.3-2.7 6-6 6" />
              </svg>

              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400/20 opacity-30" />
            </div>
          </div>
        </div>

        {/* Title and description */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-xl font-bold sm:text-2xl">Splash</h1>
          <p className="text-sm text-white/70 sm:text-base">
            Hệ thống giám sát mưa & ngập
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 w-64 sm:w-80">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>Đang khởi động</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={skip}
          className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
        >
          Bỏ qua
        </button>
      </div>

      {/* CSS for orbit animation */}
      <style>{`
        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
