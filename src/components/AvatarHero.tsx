import { Home, Radio } from "lucide-react";
import { useSongStore } from "@/store/useSongStore";

export function AvatarHero() {
  const resetFilters = useSongStore((s) => s.resetFilters);

  return (
    <section
      className="relative pt-12 pb-10 text-center opacity-0 animate-fade-in"
      onClick={resetFilters}
      role="banner"
    >
      {/* 装饰性光晕 */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-violet/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-64 h-64 bg-accent-blue/15 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-[15%] w-56 h-56 bg-accent-gold/10 blur-[70px] rounded-full pointer-events-none" />

      {/* 主头像 */}
      <div className="relative inline-block mb-8 animate-float cursor-pointer select-none">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-[3px] bg-violet-glow animate-breathe">
          <div className="w-full h-full rounded-full bg-wolf-900 p-1.5 overflow-hidden">
            <img
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cool%20anime%20wolf%20vtuber%20avatar%20portrait%2C%20mysterious%20lone%20wolf%20with%20dark%20purple%20hood%2C%20golden%20glowing%20eyes%2C%20moonlight%20background%2C%20high%20quality%20digital%20art&image_size=square_hd"
              alt="Dasy独狼头像"
              className="w-full h-full w-full h-full object-cover rounded-full"
              loading="eager"
            />
          </div>
        </div>
        {/* 月亮装饰 */}
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent-gold/90 shadow-glow-gold flex items-center justify-center text-xl rotate-12">
          🌙
        </div>
        {/* 音乐装饰 */}
        <div className="absolute -bottom-1 -left-3 w-9 h-9 rounded-full bg-accent-cyan/90 shadow-glow-blue flex items-center justify-center text-lg">
          🎵
        </div>
      </div>

      {/* 标题 */}
      <h1
        className="font-display text-5xl md:text-6xl lg:text-7xl mb-3 text-shadow-glow
                   opacity-0 animate-fade-in-up stagger-1 relative inline-block"
        style={{ animationFillMode: "forwards" }}
      >
        <span className="text-gradient-gold">Dasy</span>
        <span className="text-gradient-violet ml-3">独狼</span>
        <span className="inline-block ml-2 text-3xl md:text-4xl align-middle">🐺</span>
      </h1>

      {/* 副标题标签 */}
      <p
        className="text-lg md:text-xl text-white/70 mb-8 opacity-0 animate-fade-in-up stagger-2"
        style={{ animationFillMode: "forwards" }}
      >
        <span className="chip bg-accent-violet/20 text-accent-violet border border-accent-violet/30 mr-2">
          🌙 深夜电台
        </span>
        <span className="chip bg-accent-blue/20 text-accent-blue border border-accent-blue/30 mr-2">
          擅长 ACG · 术曲 · JPOP
        </span>
        <span className="chip bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
          苦情歌 · 流行
        </span>
      </p>

      {/* 快捷按钮组 */}
      <div
        className="flex flex-wrap justify-center gap-3 mb-2 opacity-0 animate-fade-in-up stagger-3"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href="https://space.bilibili.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          <Home className="w-4 h-4" />
          个人空间
        </a>
        <a
          href="https://live.bilibili.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary relative overflow-hidden"
        >
          <Radio className="w-4 h-4" />
          直播间
          <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
        </a>
      </div>

      <p
        className="text-xs text-white/40 opacity-0 animate-fade-in-up stagger-4"
        style={{ animationFillMode: "forwards" }}
      >
        点击任意上方区域可重置筛选条件
      </p>
    </section>
  );
}
