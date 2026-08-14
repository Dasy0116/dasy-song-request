import { Github, Heart, Shield, Sparkles } from "lucide-react";

const bvLinks = [
  {
    title: "歌切合集",
    url: "https://www.bilibili.com/video/BV1zS4y1279K",
    bv: "BV1zS4y1279K",
    color: "from-pink-500/30 to-rose-500/30 border-pink-400/30",
  },
  {
    title: "直播回放",
    url: "https://www.bilibili.com/video/BV1aV4y197Ex",
    bv: "BV1aV4y197Ex",
    color: "from-violet-500/30 to-indigo-500/30 border-violet-400/30",
  },
  {
    title: "翻唱精选",
    url: "https://www.bilibili.com/video/BV1bu411R7c3",
    bv: "BV1bu411R7c3",
    color: "from-cyan-500/30 to-blue-500/30 border-cyan-400/30",
  },
  {
    title: "经典回顾",
    url: "https://www.bilibili.com/video/BV1bo4y1v7uB",
    bv: "BV1bo4y1v7uB",
    color: "from-amber-500/30 to-orange-500/30 border-amber-400/30",
  },
];

export function FooterLinks() {
  return (
    <footer
      className="opacity-0 animate-fade-in-up stagger-6 pt-12 pb-10"
      style={{ animationFillMode: "forwards" }}
    >
      {/* BV链接区 */}
      <section className="mb-10">
        <div className="flex items-center justify-center gap-2 mb-5 text-white/70">
          <Sparkles className="w-4 h-4 text-accent-gold" />
          <h3 className="font-display text-xl">精彩传送门</h3>
          <Sparkles className="w-4 h-4 text-accent-gold" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {bvLinks.map((link, i) => (
            <a
              key={link.bv}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative glass-card p-4 overflow-hidden
                bg-gradient-to-br ${link.color} border
                hover:scale-105 hover:shadow-glow transition-all duration-300
              `}
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <p className="text-xs text-white/60 mb-1">{link.title}</p>
              <p className="font-mono text-sm font-bold text-white mb-2 tracking-wide">
                {link.bv}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">点击前往 →</span>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <span className="text-xs">📺</span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/5 blur-xl group-hover:bg-white/10 transition-colors" />
            </a>
          ))}
        </div>
      </section>

      {/* 分隔线 */}
      <div className="border-t border-white/5 mb-6" />

      {/* 底部信息 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div className="flex items-center gap-3">
          <span className="chip bg-white/5 border-white/10 text-white/60">
            <Shield className="w-3 h-3" /> Powered by Dasy
          </span>
          <span>Built with <Heart className="w-3 h-3 inline text-red-400" /> React + Tailwind</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors inline-flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Github</span>
          </a>
          <a
            href="#"
            className="hover:text-white/70 transition-colors inline-flex items-center gap-1"
          >
            <span className="text-pink-400">Author</span>
          </a>
          <span>© 2026 Dasy独狼 · All Rights Reserved</span>
        </div>
      </div>

      {/* 底部签名 */}
      <div className="mt-6 text-center font-display text-lg">
        <span className="text-gradient-violet">🌙 深夜有狼，歌声有你 🎵</span>
      </div>
    </footer>
  );
}
