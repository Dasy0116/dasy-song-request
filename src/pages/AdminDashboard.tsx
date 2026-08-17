import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  Trash2,
  RefreshCw,
  Search,
  ListOrdered,
  Mic2,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Radio,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSongStore } from "@/store/useSongStore";
import type { SongRequest } from "@/types";
import { StarBackground } from "@/components/StarBackground";

const ADMIN_PASSWORD = "Dasy0116";

type Tab = "all" | "pending" | "sung";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDay(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${pad(d.getDate())}`;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: SongRequest["status"] }) {
  if (status === "sung")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
        <Check className="w-3 h-3" /> 已唱
      </span>
    );
  if (status === "deleted")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full border border-red-400/40 bg-red-400/15 text-red-300">
        <Trash2 className="w-3 h-3" /> 已删除
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full border border-accent-gold/50 bg-accent-gold/15 text-accent-gold">
      <Clock className="w-3 h-3" /> 待唱
    </span>
  );
}

export function AdminPasswordGate({
  onUnlock,
}: {
  onUnlock: () => void;
}) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) onUnlock();
    else setErr("密码错误，再想想？🐺");
  };
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <StarBackground />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 80% 30%, rgba(79,140,255,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md glass-card p-8 text-center shadow-2xl shadow-accent-violet/20">
        <div className="h-1 w-full bg-gold-glow rounded-full -mx-8 -mt-8 mb-6 w-[calc(100%+4rem)]" />
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-glow shadow-glow-gold mb-4 animate-breathe">
          <Sparkles className="w-8 h-8 text-accent-gold" />
        </div>
        <h1 className="font-display text-3xl text-gradient-violet mb-2">
          主播后台
        </h1>
        <p className="text-sm text-white/60 mb-6">
          输入主播专属密码进入 Dasy 独狼点歌后台
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={(e) => {
                setPwd(e.target.value);
                setErr(null);
              }}
              placeholder="请输入密码"
              className="glass-input w-full pl-4 pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
              aria-label="显示/隐藏密码"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err && (
            <p className="text-xs text-red-400 text-left">{err}</p>
          )}
          <button type="submit" className="btn-primary w-full relative overflow-hidden">
            <Check className="w-4 h-4" />
            解锁后台
            <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 返回点歌主页
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("dasy_admin_unlocked") === "1");
  const [list, setList] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [keyword, setKeyword] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const adminFetchRequests = useSongStore((s) => s.adminFetchRequests);
  const adminUpdateStatus = useSongStore((s) => s.adminUpdateStatus);
  const adminDelete = useSongStore((s) => s.adminDelete);
  const adminReorder = useSongStore((s) => s.adminReorder);
  const isLive = useSongStore((s) => s.isLive);
  const setLiveStatus = useSongStore((s) => s.setLiveStatus);
  const setLiveLoading = useSongStore((s) => s.setLiveStatusLoading);
  const fetchLiveStatus = useSongStore((s) => s.fetchLiveStatus);

  useEffect(() => {
    if (unlocked) fetchLiveStatus();
  }, [unlocked, fetchLiveStatus]);

  const toggleLive = async () => {
    try {
      await setLiveStatus(!isLive);
    } catch {
      alert("切换直播状态失败，请重试");
    }
  };

  // 统计计算
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    let todayCount = 0;
    let pendingCount = 0;
    let sungCount = 0;
    let deletedCount = 0;
    const songCounter = new Map<number, { title: string; artist: string; count: number }>();
    const userSet = new Set<string>();
    const dayCounter = new Map<string, number>();

    // 最近 7 天的日期键
    const last7Days: { key: string; label: string; ts: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = startOfDay(new Date(now.getTime() - i * 24 * 3600 * 1000));
      last7Days.push({
        key: d.toISOString().slice(0, 10),
        label: formatDay(d),
        ts: d.getTime(),
      });
      dayCounter.set(d.toISOString().slice(0, 10), 0);
    }

    for (const r of list) {
      const created = new Date(r.created_at);
      const createdTs = created.getTime();
      if (createdTs >= todayStart) todayCount++;
      if (r.status === "pending") pendingCount++;
      else if (r.status === "sung") sungCount++;
      else if (r.status === "deleted") deletedCount++;

      if (r.nickname) userSet.add(r.nickname);

      // 歌曲计数
      const prev = songCounter.get(r.song_id);
      if (prev) prev.count++;
      else
        songCounter.set(r.song_id, {
          title: r.song_title,
          artist: r.song_artist,
          count: 1,
        });

      // 7 天分布
      const dayKey = startOfDay(created).toISOString().slice(0, 10);
      if (dayCounter.has(dayKey)) {
        dayCounter.set(dayKey, (dayCounter.get(dayKey) || 0) + 1);
      }
    }

    const topSongs = Array.from(songCounter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxDayCount = Math.max(1, ...Array.from(dayCounter.values()));

    return {
      total: list.length,
      today: todayCount,
      pending: pendingCount,
      sung: sungCount,
      deleted: deletedCount,
      uniqueUsers: userSet.size,
      topSongs,
      last7Days,
      dayCounts: last7Days.map((d) => dayCounter.get(d.key) || 0),
      maxDayCount,
    };
  }, [list]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await adminFetchRequests();
      setList(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setErr(`加载失败：${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  // 每 15 秒自动刷新
  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [unlocked]);

  if (!unlocked) {
    return (
      <AdminPasswordGate
        onUnlock={() => {
          sessionStorage.setItem("dasy_admin_unlocked", "1");
          setUnlocked(true);
        }}
      />
    );
  }

  const filtered = list.filter((r) => {
    if (tab === "pending" && r.status !== "pending") return false;
    if (tab === "sung" && r.status !== "sung") return false;
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      return (
        r.song_title.toLowerCase().includes(k) ||
        r.nickname.toLowerCase().includes(k) ||
        (r.message || "").toLowerCase().includes(k)
      );
    }
    return true;
  });

  const setStatus = async (id: string, status: SongRequest["status"]) => {
    setWorkingId(id);
    try {
      await adminUpdateStatus(id, status);
      await load();
    } finally {
      setWorkingId(null);
    }
  };

  const del = async (id: string) => {
    if (!confirm("确认删除这条点歌？删除后不可恢复。")) return;
    setWorkingId(id);
    try {
      await adminDelete(id);
      await load();
    } finally {
      setWorkingId(null);
    }
  };

  const reorder = async (id: string, dir: "up" | "down") => {
    setWorkingId(id);
    try {
      await adminReorder(id, dir, filtered);
      await load();
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <StarBackground />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 0%, rgba(139,92,246,0.14) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 80% 30%, rgba(79,140,255,0.10) 0%, transparent 60%)," +
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(251,191,36,0.07) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 container max-w-6xl pt-10 pb-20">
        {/* 顶栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-gradient-gold mb-1">
              🐺 主播后台 · 点歌队列
            </h1>
            <p className="text-xs text-white/50">
              调整顺序 · 标记已唱 · 删除。每 15 秒自动刷新，或手动点刷新按钮
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* 直播状态切换 */}
            <button
              onClick={toggleLive}
              disabled={setLiveLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all border ${
                isLive
                  ? "bg-red-500/30 border-red-400/50 text-red-200 hover:bg-red-500/40 shadow-lg shadow-red-500/20"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              } ${setLiveLoading ? "opacity-70 cursor-wait" : ""}`}
              title={isLive ? "点击下播" : "点击开播"}
            >
              {setLiveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
              )}
              {isLive ? "直播中 · 点击下播" : "未直播 · 点击开播"}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="btn-secondary inline-flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              刷新
            </button>
            <Link to="/" className="btn-secondary inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              回到主页
            </Link>
          </div>
        </div>

        {/* 统计卡片：核心数字 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
              <ListOrdered className="w-3.5 h-3.5" /> 总点歌
            </div>
            <div className="font-display text-3xl text-white">{stats.total}</div>
          </div>
          <div className="glass-card p-4 border-accent-gold/40">
            <div className="flex items-center gap-1.5 text-xs text-accent-gold mb-1">
              <Clock className="w-3.5 h-3.5" /> 待唱
            </div>
            <div className="font-display text-3xl text-accent-gold">{stats.pending}</div>
          </div>
          <div className="glass-card p-4 border-emerald-400/30">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 mb-1">
              <Mic2 className="w-3.5 h-3.5" /> 已唱
            </div>
            <div className="font-display text-3xl text-emerald-300">{stats.sung}</div>
          </div>
          <div className="glass-card p-4 border-accent-violet/30">
            <div className="flex items-center gap-1.5 text-xs text-accent-violet mb-1">
              <Users className="w-3.5 h-3.5" /> 独立粉丝
            </div>
            <div className="font-display text-3xl text-accent-violet">
              {stats.uniqueUsers}
            </div>
          </div>
        </div>

        {/* 详细统计：可折叠 */}
        <div className="glass-card mb-6 overflow-hidden">
          <button
            onClick={() => setStatsOpen((v) => !v)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.04] transition"
          >
            <span className="inline-flex items-center gap-2 text-sm text-white/80">
              <BarChart3 className="w-4 h-4 text-accent-gold" />
              详细统计
              <span className="text-xs text-white/40">
                · 今日 {stats.today} · 已删 {stats.deleted}
              </span>
            </span>
            {statsOpen ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>

          {statsOpen && (
            <div className="px-5 pb-5 pt-1 grid md:grid-cols-2 gap-5 border-t border-white/5">
              {/* 7 天趋势 */}
              <div>
                <h4 className="text-xs text-white/60 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> 最近 7 天点歌分布
                </h4>
                <div className="flex items-end justify-between gap-2 h-32">
                  {stats.last7Days.map((d, i) => {
                    const count = stats.dayCounts[i];
                    const h = Math.max(
                      4,
                      Math.round((count / stats.maxDayCount) * 100)
                    );
                    return (
                      <div
                        key={d.key}
                        className="flex-1 flex flex-col items-center gap-1"
                        title={`${d.label}: ${count} 首`}
                      >
                        <span className="text-[10px] text-white/60">
                          {count > 0 ? count : ""}
                        </span>
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-accent-violet/40 to-accent-gold/70 transition-all"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-white/40">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top 5 热门歌曲 */}
              <div>
                <h4 className="text-xs text-white/60 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Top 5 热门歌曲
                </h4>
                {stats.topSongs.length === 0 ? (
                  <p className="text-xs text-white/40 py-4 text-center">
                    暂无点歌数据
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.topSongs.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            i === 0
                              ? "bg-accent-gold text-wolf-900"
                              : i === 1
                              ? "bg-white/30 text-white"
                              : i === 2
                              ? "bg-amber-700/60 text-amber-100"
                              : "bg-white/5 text-white/60"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            {s.title}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {s.artist}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-accent-gold font-mono">
                          ×{s.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab + 搜索 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            {(
              [
                { key: "pending", label: `待唱 ${stats.pending}` },
                { key: "all", label: `全部 ${stats.total}` },
                { key: "sung", label: `已唱 ${stats.sung}` },
              ] as { key: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                  tab === t.key
                    ? "bg-gradient-to-r from-accent-violet to-accent-blue text-white shadow-lg shadow-accent-violet/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex-1 md:flex-none md:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索歌名 / 昵称 / 寄语..."
              className="glass-input w-full pl-9 pr-4"
            />
          </div>
        </div>

        {/* 错误提示 */}
        {err && (
          <div className="mb-4 p-3 rounded-xl border border-red-400/40 bg-red-400/10 text-red-300 text-sm">
            {err}
          </div>
        )}

        {/* 空态 */}
        {!loading && filtered.length === 0 && (
          <div className="glass-card py-20 text-center text-white/50">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-accent-gold/50" />
            <p>当前没有点歌记录</p>
            <p className="text-xs mt-1">粉丝点歌后会显示在这里 ✨</p>
          </div>
        )}

        {/* 点歌列表 */}
        {loading && filtered.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            点歌队列加载中...
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r, i) => (
              <div
                key={r.id}
                id={`req-${r.id}`}
                className={`glass-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] ${
                  r.status === "sung" ? "opacity-60" : ""
                } ${workingId === r.id ? "pointer-events-none opacity-70" : ""}`}
              >
                {/* 序号 + 上下 */}
                <div className="flex md:flex-col items-center md:items-stretch gap-2 md:gap-1 md:w-16 shrink-0">
                  <div className="font-display text-2xl text-gradient-gold w-10 text-center md:w-auto">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex md:flex-col gap-1">
                    <button
                      onClick={() => reorder(r.id, "up")}
                      disabled={i === 0}
                      className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => reorder(r.id, "down")}
                      disabled={i === filtered.length - 1}
                      className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 主信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3
                      className={`font-semibold text-lg ${
                        r.status === "sung" ? "line-through decoration-wavy decoration-white/30" : ""
                      }`}
                    >
                      《{r.song_title}》
                    </h3>
                    <span className="text-xs text-white/50">— {r.song_artist}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                      {r.nickname}
                    </span>
                    <span className="text-white/40 text-xs">
                      {formatTime(r.created_at)}
                    </span>
                  </div>
                  {r.message && (
                    <p className="mt-2 p-3 rounded-lg bg-black/20 border border-white/5 text-sm text-white/70 leading-relaxed">
                      💬 {r.message}
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex md:flex-col items-center md:items-stretch gap-2 shrink-0">
                  {r.status !== "sung" && (
                    <button
                      onClick={() => setStatus(r.id, "sung")}
                      className="px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-sm bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 transition"
                    >
                      <Check className="w-4 h-4" /> 标记已唱
                    </button>
                  )}
                  {r.status === "sung" && (
                    <button
                      onClick={() => setStatus(r.id, "pending")}
                      className="px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-sm bg-accent-gold/20 border border-accent-gold/50 text-accent-gold hover:bg-accent-gold/30 transition"
                    >
                      <Clock className="w-4 h-4" /> 恢复待唱
                    </button>
                  )}
                  <button
                    onClick={() => del(r.id)}
                    className="px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-sm bg-red-500/15 border border-red-400/40 text-red-300 hover:bg-red-500/25 transition"
                  >
                    <Trash2 className="w-4 h-4" /> 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部操作 */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="btn-secondary inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> 回到点歌主页
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem("dasy_admin_unlocked");
              location.reload();
            }}
            className="ml-3 px-4 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            🔒 退出后台（锁定密码）
          </button>
        </div>
      </div>
    </div>
  );
}
