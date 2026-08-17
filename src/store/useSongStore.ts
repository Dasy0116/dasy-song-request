import { create } from "zustand";
import type { Song, SongRequest, FilterKey, FilterState } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const MY_HISTORY_KEY = "dasy_my_history";
const MY_HISTORY_MAX = 50;

// 直播状态哨兵记录：复用 song_requests 表，固定 id 避免新建表
const LIVE_RECORD_ID = "00000000-0000-0000-0000-000000000001";
const LIVE_SENTINEL_SONG_ID = -1;
const LIVE_SENTINEL_TITLE = "__LIVE_STATE__";

function isLiveSentinel(r: { song_id?: number; song_title?: string }) {
  return (
    r.song_id === LIVE_SENTINEL_SONG_ID ||
    r.song_title === LIVE_SENTINEL_TITLE
  );
}

export interface MyHistoryItem {
  local_id: string;
  song_id: number;
  song_title: string;
  song_artist: string;
  nickname: string;
  message: string;
  created_at: string;
}

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
  // 粉丝端可见的点唱队列（仅 pending，按 order_index 排序，不含昵称/留言）
  fanQueue: Array<{
    id: string;
    song_id: number;
    song_title: string;
    song_artist: string;
    order_index: number;
    created_at: string;
  }>;
  isFanQueueOpen: boolean;
  // 本设备点歌历史（localStorage 持久化）
  myHistory: MyHistoryItem[];
  isMyHistoryOpen: boolean;
  // 打开"我的点歌"时，对每条历史查询 Supabase 最新状态的结果
  myHistoryStatus: Record<string, "pending" | "sung" | "deleted" | "unknown">;
  // 直播状态
  isLive: boolean;
  liveUpdatedAt: string | null;
  setLiveStatusLoading: boolean;

  // Actions
  fetchSongs: () => Promise<void>;
  refreshPointStatus: () => Promise<void>;
  setFanQueueOpen: (open: boolean) => void;
  hydrateMyHistory: () => void;
  addMyHistory: (item: Omit<MyHistoryItem, "local_id" | "created_at">) => void;
  removeMyHistory: (local_id: string) => void;
  setMyHistoryOpen: (open: boolean) => void;
  refreshMyHistoryStatus: () => Promise<void>;
  fetchLiveStatus: () => Promise<void>;
  setLiveStatus: (live: boolean) => Promise<void>;
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
  // 粉丝端点唱队列
  fanQueue: [],
  isFanQueueOpen: false,
  // 我的点歌历史
  myHistory: [],
  isMyHistoryOpen: false,
  myHistoryStatus: {},
  // 直播状态
  isLive: false,
  liveUpdatedAt: null,
  setLiveStatusLoading: false,

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

  // 拉取所有点歌记录，计算每首歌的可点状态 + 粉丝端可见的待唱队列
  // - pending 在队列中 → "歌曲在队列中"
  // - sung/deleted 后，created_at 之后又有 <5 条新记录 → "重复点歌"
  // - 否则可点
  refreshPointStatus: async () => {
    if (!isSupabaseConfigured) {
      set({ songPointStatus: {}, fanQueue: [] });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("song_requests")
        .select("id,song_id,song_title,song_artist,status,order_index,created_at,updated_at,message")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const records = (data || []) as {
        id: string;
        song_id: number;
        song_title: string;
        song_artist: string;
        status: "pending" | "sung" | "deleted";
        order_index: number;
        created_at: string;
        updated_at?: string;
        message?: string;
      }[];

      // 排除直播状态哨兵记录
      const realRecords = records.filter((r) => !isLiveSentinel(r));

      // 按歌曲分组，找每首歌最新的一条记录
      const latestBySong = new Map<
        number,
        { status: string; created_at: string }
      >();
      for (const r of realRecords) {
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
          const laterCount = realRecords.filter(
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

      // 粉丝端可见队列：只 pending，按 order_index 升序，再按 created_at 升序
      const fanQueue = realRecords
        .filter((r) => r.status === "pending")
        .sort((a, b) =>
          a.order_index === b.order_index
            ? a.created_at.localeCompare(b.created_at)
            : a.order_index - b.order_index
        )
        .map((r) => ({
          id: r.id,
          song_id: r.song_id,
          song_title: r.song_title,
          song_artist: r.song_artist,
          order_index: r.order_index,
          created_at: r.created_at,
        }));

      // 顺便更新直播状态（从原 records 找哨兵记录）
      const liveRec = records.find((r) => isLiveSentinel(r));
      set({
        songPointStatus: statusMap,
        fanQueue,
        isLive: liveRec?.message === "true",
        liveUpdatedAt: liveRec?.updated_at || liveRec?.created_at || null,
      });
    } catch (err) {
      console.warn("刷新点歌状态失败:", err);
      set({ songPointStatus: {}, fanQueue: [] });
    }
  },

  setFanQueueOpen: (open) => set({ isFanQueueOpen: open }),

  // ============ 我的点歌历史（本地） ============
  hydrateMyHistory: () => {
    if (get().myHistory.length > 0) return;
    try {
      const raw = localStorage.getItem(MY_HISTORY_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as MyHistoryItem[];
        if (Array.isArray(arr)) set({ myHistory: arr });
      }
    } catch {
      // 解析失败忽略
    }
  },

  addMyHistory: (item) => {
    const full: MyHistoryItem = {
      ...item,
      local_id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    const next = [full, ...get().myHistory].slice(0, MY_HISTORY_MAX);
    set({ myHistory: next });
    try {
      localStorage.setItem(MY_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  },

  removeMyHistory: (local_id) => {
    const next = get().myHistory.filter((x) => x.local_id !== local_id);
    set({ myHistory: next });
    try {
      localStorage.setItem(MY_HISTORY_KEY, JSON.stringify(next));
    } catch {}
  },

  setMyHistoryOpen: (open) => set({ isMyHistoryOpen: open }),

  // ============ 直播状态 ============
  fetchLiveStatus: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from("song_requests")
        .select("message,updated_at,created_at")
        .eq("id", LIVE_RECORD_ID)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        set({
          isLive: (data as { message?: string }).message === "true",
          liveUpdatedAt:
            (data as { updated_at?: string }).updated_at ||
            (data as { created_at?: string }).created_at ||
            null,
        });
      } else {
        set({ isLive: false, liveUpdatedAt: null });
      }
    } catch (err) {
      console.warn("拉取直播状态失败:", err);
    }
  },

  setLiveStatus: async (live) => {
    if (!isSupabaseConfigured) {
      set({ isLive: live });
      return;
    }
    set({ setLiveStatusLoading: true });
    try {
      const now = new Date().toISOString();
      const payload = {
        id: LIVE_RECORD_ID,
        song_id: LIVE_SENTINEL_SONG_ID,
        song_title: LIVE_SENTINEL_TITLE,
        song_artist: "",
        nickname: "__SYSTEM__",
        message: live ? "true" : "false",
        status: "pending",
        order_index: -999,
        created_at: now,
        updated_at: now,
      };
      // upsert：如果不存在则插入，存在则更新
      const { error } = await supabase
        .from("song_requests")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      set({ isLive: live, liveUpdatedAt: now });
    } catch (err) {
      console.error("切换直播状态失败:", err);
      throw err;
    } finally {
      set({ setLiveStatusLoading: false });
    }
  },

  // 查询 myHistory 中每条记录对应 Supabase 最新状态
  refreshMyHistoryStatus: async () => {
    const { myHistory } = get();
    if (!isSupabaseConfigured || myHistory.length === 0) {
      set({ myHistoryStatus: {} });
      return;
    }
    try {
      // 一次性查询所有相关 song_id 的全部记录，前端分组取最新
      const songIds = Array.from(new Set(myHistory.map((h) => h.song_id)));
      const { data, error } = await supabase
        .from("song_requests")
        .select("song_id,status,created_at")
        .in("song_id", songIds)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const records = (data || []) as {
        song_id: number;
        status: "pending" | "sung" | "deleted";
        created_at: string;
      }[];

      // 对每个 song_id 取 created_at 最大的那条
      const latestBySong = new Map<number, { status: string; created_at: string }>();
      for (const r of records) {
        const prev = latestBySong.get(r.song_id);
        if (!prev || r.created_at > prev.created_at) {
          latestBySong.set(r.song_id, { status: r.status, created_at: r.created_at });
        }
      }

      // 对每条 myHistory 项，如果它创建时间 <= Supabase 中该 song_id 最新记录的创建时间，
      // 用 Supabase 的最新状态；否则说明这条本地记录可能没提交成功，标记为 unknown
      const statusMap: Record<string, "pending" | "sung" | "deleted" | "unknown"> = {};
      for (const h of myHistory) {
        const latest = latestBySong.get(h.song_id);
        if (latest && latest.created_at >= h.created_at) {
          statusMap[h.local_id] = latest.status as "pending" | "sung" | "deleted";
        } else {
          statusMap[h.local_id] = "unknown";
        }
      }
      set({ myHistoryStatus: statusMap });
    } catch (err) {
      console.warn("刷新我的历史状态失败:", err);
      set({ myHistoryStatus: {} });
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
      // 写入本地"我的点歌"历史
      get().addMyHistory({
        song_id: selectedSong.id,
        song_title: selectedSong.title,
        song_artist: selectedSong.artist,
        nickname,
        message,
      });
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
    // 过滤掉直播状态哨兵记录，主播看不到这条
    return ((data || []) as SongRequest[]).filter(
      (r) => !isLiveSentinel(r)
    );
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
