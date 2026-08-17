import { useEffect } from "react";
import { StarBackground } from "@/components/StarBackground";
import { AvatarHero } from "@/components/AvatarHero";
import { FilterBar } from "@/components/FilterBar";
import { SongTable } from "@/components/SongTable";
import { SongCard } from "@/components/SongCard";
import { RequestModal } from "@/components/RequestModal";
import { SuccessToast } from "@/components/SuccessToast";
import { NicknameModal } from "@/components/NicknameModal";
import { FanQueuePanel, FanQueueTrigger } from "@/components/FanQueuePanel";
import { MyHistoryPanel, MyHistoryTrigger } from "@/components/MyHistoryPanel";
import { useSongStore } from "@/store/useSongStore";
import { useUserStore } from "@/store/useUserStore";

export default function Home() {
  const fetchSongs = useSongStore((s) => s.fetchSongs);
  const refreshPointStatus = useSongStore((s) => s.refreshPointStatus);
  const fetchLiveStatus = useSongStore((s) => s.fetchLiveStatus);
  const hydrateMyHistory = useSongStore((s) => s.hydrateMyHistory);
  const hydrate = useUserStore((s) => s.hydrate);

  useEffect(() => {
    fetchSongs();
    refreshPointStatus();
    fetchLiveStatus();
    hydrateMyHistory();
    hydrate();
    // 每 60 秒刷新直播状态（后台切换后粉丝端尽快感知）
    const t = setInterval(() => fetchLiveStatus(), 60000);
    return () => clearInterval(t);
  }, [fetchSongs, refreshPointStatus, fetchLiveStatus, hydrateMyHistory, hydrate]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* 星空背景 */}
      <StarBackground />

      {/* 装饰性渐变层 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 80% 30%, rgba(79,140,255,0.10) 0%, transparent 60%)," +
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(251,191,36,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 container max-w-7xl">
        <AvatarHero />
        <FilterBar />

        {/* 桌面显示表格，移动端显示卡片列表 */}
        <div className="hidden md:block">
          <SongTable />
        </div>
        <div className="md:hidden">
          <SongCard />
        </div>
      </div>

      {/* 弹窗 & Toast */}
      <RequestModal />
      <NicknameModal />
      {/* 左上角浮层按钮组 */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        <FanQueueTrigger />
        <MyHistoryTrigger />
      </div>
      <FanQueuePanel />
      <MyHistoryPanel />
      <SuccessToast />
    </div>
  );
}
