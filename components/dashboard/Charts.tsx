"use client";

import { MOOD_GROUPS, MOOD_GROUP_META, type MoodGroup } from "@/lib/moods";
import type { DashboardData } from "./types";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function GroupDonut({ dist }: { dist: Record<MoodGroup, number> }) {
  const total = MOOD_GROUPS.reduce((s, g) => s + dist[g], 0);
  if (total === 0) return <Empty text="Chưa có tâm trạng nào được chọn trong kỳ này." />;

  const present = MOOD_GROUPS.filter((g) => dist[g] > 0);
  const stops = present.map((g, i) => {
    const before = present.slice(0, i).reduce((s, x) => s + dist[x], 0);
    return `${MOOD_GROUP_META[g].color} ${(before / total) * 100}% ${((before + dist[g]) / total) * 100}%`;
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div
        className="relative w-32 h-32 rounded-full shrink-0"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-[22%] rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[#3a332c] leading-none">{total}</span>
          <span className="text-[10px] text-[#a1968a]">nhật ký</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {MOOD_GROUPS.filter((g) => dist[g] > 0).map((g) => (
          <li key={g} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: MOOD_GROUP_META[g].color }} />
            <span className="text-[#3a332c]">{MOOD_GROUP_META[g].label}</span>
            <span className="text-[#a1968a]">
              {dist[g]} · {Math.round((dist[g] / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Daily mood "score": +2 positive, 0 neutral, -1 anxious/sad/angry (average
// when a day has several moods). Gaps are days with no mood chosen.
export function TrendChart({ valence }: { valence: DashboardData["valence"] }) {
  if (valence.every((v) => v.value === null)) {
    return <Empty text="Chọn tâm trạng cho nhật ký để xem xu hướng." />;
  }

  const W = 600;
  const H = 170;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const MIN = -1;
  const MAX = 2;
  const x = (i: number) =>
    valence.length === 1 ? W / 2 : pad.l + (i / (valence.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((MAX - v) / (MAX - MIN)) * (H - pad.t - pad.b);

  const segments: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  valence.forEach((v, i) => {
    if (v.value === null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else cur.push({ x: x(i), y: y(v.value) });
  });
  if (cur.length) segments.push(cur);

  const color = (v: number) => (v >= 1 ? "#ff7fa6" : v > -0.5 ? "#f0b955" : "#7aa5d6");
  const labelEvery = valence.length > 10 ? 5 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[2, 0, -1].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#efe5d8" strokeDasharray="4 4" />
          <text x={W - pad.r} y={y(v) - 3} textAnchor="end" fontSize="10" fill="#b0a498">
            {v === 2 ? "Tích cực" : v === 0 ? "Bình thường" : "Tiêu cực"}
          </text>
        </g>
      ))}
      {segments.map((seg, i) =>
        seg.length > 1 ? (
          <polyline
            key={i}
            points={seg.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#e8829e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null
      )}
      {valence.map((v, i) =>
        v.value === null ? null : (
          <circle key={v.date} cx={x(i)} cy={y(v.value)} r="4.5" fill={color(v.value)} stroke="#fff" strokeWidth="1.5" />
        )
      )}
      {valence.map((v, i) =>
        i % labelEvery === 0 || i === valence.length - 1 ? (
          <text key={`l${v.date}`} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#a1968a">
            {Number(v.date.slice(8))}
          </text>
        ) : null
      )}
    </svg>
  );
}

export function MoodBars({ dist }: { dist: DashboardData["moodDistribution"] }) {
  if (dist.length === 0) return <Empty text="Chưa có tâm trạng nào được chọn trong kỳ này." />;
  const top = dist.slice(0, 6);
  const max = top[0].count;
  return (
    <ul className="space-y-2">
      {top.map(({ mood, count }) => (
        <li key={mood.id} className="flex items-center gap-2.5 text-sm">
          <span className="w-6 text-center text-lg leading-none">{mood.icon}</span>
          <span className="w-28 truncate text-[#3a332c]">{mood.name}</span>
          <div className="flex-1 h-2.5 rounded-full bg-[#f6eee3] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(count / max) * 100}%`, background: MOOD_GROUP_META[mood.group].color }}
            />
          </div>
          <span className="w-6 text-right text-[#a1968a] tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  );
}

export function WeekdayChart({ weekday }: { weekday: DashboardData["weekday"] }) {
  const max = Math.max(...weekday.map((w) => w.total));
  if (max === 0) return <Empty text="Chưa đủ dữ liệu tâm trạng." />;
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekday.map((w, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="h-24 w-full max-w-9 flex flex-col-reverse rounded-lg overflow-hidden bg-[#faf3ea]">
            {MOOD_GROUPS.filter((g) => w.counts[g] > 0).map((g) => (
              <div
                key={g}
                style={{ height: `${(w.counts[g] / max) * 100}%`, background: MOOD_GROUP_META[g].color }}
                title={`${MOOD_GROUP_META[g].label}: ${w.counts[g]}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#8a7f73]">{WEEKDAY_LABELS[i]}</span>
          <span className="text-[10px] text-[#a1968a] h-3 leading-3 text-center">
            {w.topGroup ? MOOD_GROUP_META[w.topGroup].short : "–"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="text-sm text-[#a1968a] py-4">{text}</p>;
}
