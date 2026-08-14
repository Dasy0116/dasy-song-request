import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#ffffff", "#8b5cf6", "#4f8cff", "#fbbf24"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const starCount = Math.floor((canvas.width * canvas.height) / 9000);
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedY: Math.random() * 0.15 + 0.02,
      speedX: (Math.random() - 0.5) * 0.05,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.x += s.speedX;
        s.y += s.speedY;
        s.twinklePhase += s.twinkleSpeed;

        if (s.y > canvas.height + 10) {
          s.y = -10;
          s.x = Math.random() * canvas.width;
        }
        if (s.x > canvas.width + 10) s.x = -10;
        if (s.x < -10) s.x = canvas.width + 10;

        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.twinklePhase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = s.size * 3;
        ctx.shadowColor = s.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
