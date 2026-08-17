import { Home, Radio, UserCog, Circle, LogIn, LogOut } from "lucide-react";
import { useSongStore } from "@/store/useSongStore";
import { useUserStore } from "@/store/useUserStore";
import { useAuthStore } from "@/store/useAuthStore";

export function AvatarHero() {
  const resetFilters = useSongStore((s) => s.resetFilters);
  const localNick = useUserStore((s) => s.nickname);
  const openEdit = useUserStore((s) => s.openEdit);
  const isLive = useSongStore((s) => s.isLive);

  // 登录状态
  const user = useAuthStore((s) => s.user);
  const authNick = useAuthStore((s) => s.nickname);
  const setAuthModalOpen = useAuthStore((s) => s.setAuthModalOpen);
  const signOut = useAuthStore((s) => s.signOut);
  const onUserLogout = useSongStore((s) => s.onUserLogout);

  const isLoggedIn = !!user;
  const displayNick = isLoggedIn ? authNick || "已登录" : localNick;

  return (
    <section
      className="relative pt-12 pb-10 text-center opacity-0 animate-fade-in"
      onClick={resetFilters}
      role="banner"
    >
      {/* 右上角：登录/账号入口 */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAuthModalOpen(true);
              }}
              className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-white/90 hover:text-white hover:bg-white/10 transition-all"
              title="账号信息（点击查看 / 退出登录）"
            >
              <UserCog className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[120px] truncate">{displayNick}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("确定退出登录？")) {
                  signOut();
                  onUserLogout();
                }
              }}
              className="glass-card px-2.5 py-2 flex items-center gap-1 text-xs text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit();
              }}
              className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all"
              title="设置本地昵称（未登录）"
            >
              <UserCog className="w-3.5 h-3.5 text-accent-gold" />
              {localNick ? (
                <span className="max-w-[100px] truncate">{localNick}</span>
              ) : (
                <span className="text-white/50">设置昵称</span>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAuthModalOpen(true);
              }}
              className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-accent-gold hover:bg-accent-gold/10 transition-all border border-accent-gold/30"
              title="登录/注册账号（跨设备同步）"
            >
              <LogIn className="w-3.5 h-3.5" />
              登录
            </button>
          </>
        )}
      </div>
      {/* 装饰性光晕 */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-violet/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-[20%] w-64 h-64 bg-accent-blue/15 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-[15%] w-56 h-56 bg-accent-gold/10 blur-[70px] rounded-full pointer-events-none" />

      {/* 主头像 */}
      <div className="relative inline-block mb-8 animate-float cursor-pointer select-none">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full p-[3px] bg-violet-glow animate-breathe">
          <div className="w-full h-full rounded-full bg-wolf-900 p-1.5 overflow-hidden">
            <img
              src="./avatar.png"
              alt="Dasy独狼头像"
              className="w-full h-full w-full h-full object-cover rounded-full"
              loading="eager"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes("__retry")) {
                  // 兜底：如果加载失败，加时间戳重试一次
                  img.src = `./avatar.png?__retry=${Date.now()}`;
                }
              }}
            />
          </div>
        </div>

        {/* 直播状态徽标 */}
        {isLive ? (
          <a
            href="https://live.bilibili.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-500/90 border border-red-300/40 shadow-lg shadow-red-500/40 flex items-center gap-1.5 text-[11px] font-bold text-white animate-fade-in"
            title="直播中，点击进入直播间"
          >
            <Circle className="w-2 h-2 fill-white text-white animate-pulse" />
            LIVE 直播中
          </a>
        ) : (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-1.5 text-[11px] text-white/60">
            <Circle className="w-2 h-2 fill-white/40 text-white/40" />
            休息中
          </div>
        )}

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
          href="https://space.bilibili.com/509305711"
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
          className={`btn-primary relative overflow-hidden ${
            isLive ? "ring-2 ring-red-400/60" : ""
          }`}
        >
          <Radio className="w-4 h-4" />
          {isLive ? "进入直播间" : "直播间"}
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
