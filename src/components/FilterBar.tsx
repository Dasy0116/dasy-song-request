import {
  AArrowDown,
  Globe2,
  Music2,
  SlidersHorizontal,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { useSongStore } from "@/store/useSongStore";
import {
  firstLetters,
  languages,
  genres,
  conditions,
} from "@/data/songs";
import type { FilterKey } from "@/types";

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon: React.ReactNode;
  className?: string;
}

function GlassSelect({ value, onChange, options, icon, className = "" }: SelectProps) {
  const isSelected = value !== "全部";
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
        {icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none glass-input w-full pl-10 pr-8 cursor-pointer transition-all
          ${isSelected ? "border-accent-gold/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]" : ""}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-wolf-800 text-white">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">
        ▼
      </div>
    </div>
  );
}

export function FilterBar() {
  const firstLetter = useSongStore((s) => s.firstLetter);
  const language = useSongStore((s) => s.language);
  const genre = useSongStore((s) => s.genre);
  const condition = useSongStore((s) => s.condition);
  const searchKeyword = useSongStore((s) => s.searchKeyword);
  const setFilter = useSongStore((s) => s.setFilter);
  const resetFilters = useSongStore((s) => s.resetFilters);
  const playRandom = useSongStore((s) => s.playRandom);
  const totalCount = useSongStore((s) => s.allSongs.length);

  const hasActiveFilter =
    firstLetter !== "全部" ||
    language !== "全部" ||
    genre !== "全部" ||
    condition !== "全部" ||
    searchKeyword.trim() !== "";

  return (
    <section
      className="opacity-0 animate-fade-in-up stagger-4 mb-8"
      style={{ animationFillMode: "forwards" }}
    >
      <div className="glass-card p-4 md:p-5">
        {/* 桌面端：一排布局 */}
        <div className="hidden lg:flex items-center gap-3">
          <GlassSelect
            value={firstLetter}
            onChange={(v) => setFilter("firstLetter" as FilterKey, v)}
            options={firstLetters}
            icon={<AArrowDown className="w-4 h-4" />}
            className="w-[110px] shrink-0"
          />
          <GlassSelect
            value={language}
            onChange={(v) => setFilter("language" as FilterKey, v)}
            options={languages}
            icon={<Globe2 className="w-4 h-4" />}
            className="w-[120px] shrink-0"
          />
          <GlassSelect
            value={genre}
            onChange={(v) => setFilter("genre" as FilterKey, v)}
            options={genres}
            icon={<Music2 className="w-4 h-4" />}
            className="w-[120px] shrink-0"
          />

          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            {searchKeyword && (
              <button
                onClick={() => setFilter("searchKeyword" as FilterKey, "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                aria-label="清空搜索"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setFilter("searchKeyword" as FilterKey, e.target.value)}
              placeholder="搜搜歌名或歌手..."
              className={`glass-input w-full pl-10 pr-10
                ${searchKeyword ? "border-accent-gold/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]" : ""}`}
            />
          </div>

          <GlassSelect
            value={condition}
            onChange={(v) => setFilter("condition" as FilterKey, v)}
            options={conditions}
            icon={<SlidersHorizontal className="w-4 h-4" />}
            className="w-[130px] shrink-0"
          />

          <button
            onClick={playRandom}
            className="btn-primary shrink-0 relative overflow-hidden"
            aria-label="随便听听"
          >
            <Shuffle className="w-4 h-4" />
            随便听听
            <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
          </button>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="btn-capsule shrink-0 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 hover:border-red-400/30 transition-all"
              title="重置筛选"
            >
              <X className="w-4 h-4" />
              重置
            </button>
          )}
        </div>

        {/* 移动端/平板：多排布局 */}
        <div className="lg:hidden space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GlassSelect
              value={firstLetter}
              onChange={(v) => setFilter("firstLetter" as FilterKey, v)}
              options={firstLetters}
              icon={<AArrowDown className="w-4 h-4" />}
            />
            <GlassSelect
              value={language}
              onChange={(v) => setFilter("language" as FilterKey, v)}
              options={languages}
              icon={<Globe2 className="w-4 h-4" />}
            />
            <GlassSelect
              value={genre}
              onChange={(v) => setFilter("genre" as FilterKey, v)}
              options={genres}
              icon={<Music2 className="w-4 h-4" />}
            />
            <GlassSelect
              value={condition}
              onChange={(v) => setFilter("condition" as FilterKey, v)}
              options={conditions}
              icon={<SlidersHorizontal className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              {searchKeyword && (
                <button
                  onClick={() => setFilter("searchKeyword" as FilterKey, "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setFilter("searchKeyword" as FilterKey, e.target.value)}
                placeholder="搜搜歌名或歌手..."
                className="glass-input w-full pl-10 pr-10"
              />
            </div>
            <button onClick={playRandom} className="btn-primary shrink-0">
              <Shuffle className="w-4 h-4" />
              随便
            </button>
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="btn-capsule shrink-0 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 底部统计信息 */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
          <span>
            📚 歌单共 <span className="text-accent-gold font-semibold">{totalCount}</span> 首
          </span>
          {hasActiveFilter && (
            <span className="chip bg-accent-violet/15 text-accent-violet border border-accent-violet/30 animate-pulse">
              🔍 筛选模式已激活
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
