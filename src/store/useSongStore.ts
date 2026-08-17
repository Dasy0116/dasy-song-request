import { create } from "zustand";
import type { Song, SongRequest, FilterKey, FilterState } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface SongStore extends FilterState {
  // 歌曲数据
  allSongs: Song[];
  highlightedSongId: number | null;
  // 加载状态
  isLoading: boolean;
  loadError: string | null;
  // 弹窗状态
  isRequestModalOpen: boolean;
  selectedSong: Song | null;
  // 点歌记录（粉丝端通常不看，后台看）
  requestHistory: SongRequest[];
  // 成功提示
  successToast: string | null;
  errorToast: string | null;
  // 提交中
  submittingRequest: boolean;
  // 每首歌的点歌可点状态：{ [songId]: { disabled, reason? } }
  songPointStatus: Record<number, { disabled: boolean; reason?: string }>;

  // Actions
  fetchSongs: () => Promise<void>;
  refreshPointStatus: () => Promise<void>;
  setFilter: <K extends FilterKey>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setHighlighted: (id: number | null) => void;
  playRandom: () => void;
  openRequestModal: (song: Song) => void;
  closeRequestModal: () => void;
  submitRequest: (data: { nickname: string; message: string }) => Promise<void>;
  clearToast: () => void;

  // 后台相关 actions
  adminFetchRequests: () => Promise<SongRequest[]>;
  adminUpdateStatus: (id: string, status: SongRequest["status"]) => Promise<void>;
  adminDelete: (id: string) => Promise<void>;
  adminReorder: (id: string, direction: "up" | "down", list: SongRequest[]) => Promise<void>;
}

export const useSongStore = create<SongStore>((set, get) => ({
  // 筛选条件默认值
  firstLetter: "全部",
  language: "全部",
  genre: "全部",
  condition: "全部",
  searchKeyword: "",

  // 歌曲数据（初始为空，异步加载）
  allSongs: [],
  highlightedSongId: null,

  // 加载状态
  isLoading: false,
  loadError: null,

  // 弹窗
  isRequestModalOpen: false,
  selectedSong: null,

  // 记录
  requestHistory: [],

  // Toast
  successToast: null,
  errorToast: null,
  submittingRequest: false,

  // 点歌状态：默认所有歌可点
  songPointStatus: {},

  fetchSongs: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const url = `./songs.json?t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Song[] = await res.json();
      set({ allSongs: data, isLoading: false, loadError: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      set({ isLoading: false, loadError: `歌单加载失败: ${msg}` });
    }
  },

  // 拉取所有点歌记录，计算每首歌的可点状态
  // - pending 在队列中 → "歌曲在队列中"
  // - sung/deleted 后，created_at 之后又有 <5 条新记录 → "重复点歌"
  // - 否则可点
  refreshPointStatus: async () => {
    if (!isSupabaseConfigured) {
      set({ songPointStatus: {} });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("song_requests")
        .select("song_id,status,created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const records = (data || []) as {
        song_id: number;
        status: "pending" | "sung" | "deleted";
        created_at: string;
      }[];

      // 按歌曲分组，找每首歌最新的一条记录
      const latestBySong = new Map<
        number,
        { status: string; created_at: string }
      >();
      for (const r of records) {
        const prev = latestBySong.get(r.song_id);
        if (!prev || r.created_at > prev.created_at) {
          latestBySong.set(r.song_id, {
            status: r.status,
            created_at: r.created_at,
          });
        }
      }

      const statusMap: Record<
        number,
        { disabled: boolean; reason?: string }
      > = {};

      for (const [songId, latest] of latestBySong.entries()) {
        if (latest.status === "pending") {
          statusMap[songId] = {
            disabled: true,
            reason: "歌曲已在点歌队列中",
          };
        } else {
          // sung 或 deleted：数 created_at 之后有多少条记录
          const laterCount = records.filter(
            (r) => r.created_at > latest.created_at
          ).length;
          if (laterCount < 5) {
            statusMap[songId] = {
              disabled: true,
              reason: "重复点歌（刚被点过，再等等~）",
            };
          }
          // 否则可点，不写入 map
        }
      }

      set({ songPointStatus: statusMap });
    } catch (err) {
      console.warn("刷新点歌状态失败:", err);
      set({ songPointStatus: {} });
    }
  },

  setFilter: (key, value) => set({ [key]: value } as Pick<SongStore, FilterKey>),

  resetFilters: () =>
    set({
      firstLetter: "全部",
      language: "全部",
      genre: "全部",
      condition: "全部",
      searchKeyword: "",
    }),

  setHighlighted: (id) => {
    set({ highlightedSongId: id });
    if (id !== null) {
      setTimeout(() => set({ highlightedSongId: null }), 1500);
    }
  },

  playRandom: () => {
    const { allSongs } = get();
    const availableSongs = allSongs.filter((s) => s.status === "available");
    if (availableSongs.length === 0) return;
    const random =
      availableSongs[Math.floor(Math.random() * availableSongs.length)];
    set({ highlightedSongId: random.id });
    setTimeout(() => set({ highlightedSongId: null }), 2000);
  },

  openRequestModal: (song) => {
    set({ selectedSong: song, isRequestModalOpen: true });
    // 异步刷新点歌状态（不阻塞弹窗打开），让按钮状态保持较新
    get().refreshPointStatus();
  },

  closeRequestModal: () =>
    set({ isRequestModalOpen: false, selectedSong: null }),

  submitRequest: async ({ nickname, message }) => {
    const { selectedSong } = get();
    if (!selectedSong) return;

    set({ submittingRequest: true, errorToast: null });
    const now = new Date().toISOString();
    const payload = {
      song_id: selectedSong.id,
      song_title: selectedSong.title,
      song_artist: selectedSong.artist,
      nickname,
      message,
      status: "pending" as const,
      order_index: Date.now(),
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from("song_requests")
          .insert([payload]);
        if (error) throw error;
      } else {
        // 未配置 Supabase 时退化到本地记录，便于本地预览
        console.warn("[Supabase未配置] 点歌仅写入本地 requestHistory:", payload);
      }

      set({
        isRequestModalOpen: false,
        selectedSong: null,
        submittingRequest: false,
        successToast: `🐺 点歌成功！已为「${nickname}」登记《${selectedSong.title}》`,
      });
      setTimeout(() => set({ successToast: null }), 4000);
      // 提交成功后刷新点歌状态（这首歌进入队列）
      get().refreshPointStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      console.error(err);
      set({
        submittingRequest: false,
        errorToast: `点歌提交失败，请稍后重试（${msg}）`,
      });
      setTimeout(() => set({ errorToast: null }), 6000);
    }
  },

  clearToast: () => set({ successToast: null, errorToast: null }),

  // ============ 后台 ============
  adminFetchRequests: async () => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from("song_requests")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []) as SongRequest[];
  },

  adminUpdateStatus: async (id, status) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("song_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  adminDelete: async (id) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("song_requests")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  adminReorder: async (id, direction, list) => {
    if (!isSupabaseConfigured) return;
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= list.length) return;
    const a = list[idx];
    const b = list[target];
    const aOrder = a.order_index;
    const bOrder = b.order_index;
    const { error: e1 } = await supabase
      .from("song_requests")
      .update({ order_index: bOrder, updated_at: new Date().toISOString() })
      .eq("id", a.id);
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from("song_requests")
      .update({ order_index: aOrder, updated_at: new Date().toISOString() })
      .eq("id", b.id);
    if (e2) throw e2;
  },
}));
