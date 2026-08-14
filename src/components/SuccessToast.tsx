import { useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useSongStore } from "@/store/useSongStore";

export function SuccessToast() {
  const toast = useSongStore((s) => s.successToast);
  const clearToast = useSongStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up w-[92%] max-w-md">
      <div className="glass-card px-4 py-3 pr-10 border-emerald-400/40 bg-emerald-500/10 shadow-glow flex items-start gap-3 relative">
        <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-sm text-white/90 leading-relaxed pt-0.5">{toast}</p>
        <button
          onClick={clearToast}
          aria-label="关闭提示"
          className="absolute right-2 top-2 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        {/* 进度条 */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-400 via-accent-cyan to-accent-violet origin-left animate-[shrink_4s_linear_forwards]" style={{ width: "100%" }} />
        <style>{`@keyframes shrink { to { transform: scaleX(0); } }`}</style>
      </div>
    </div>
  );
}
