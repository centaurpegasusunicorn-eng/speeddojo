"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
  type Plugin,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Rep } from "@/lib/belts";
import { formatDuration } from "@/lib/format";
import { useTheme } from "@/lib/theme";

// Every chart type used must be registered. The bar + line controllers are
// essential: without them the live (optimised) build crashes the page.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Tooltip,
  Legend
);

type Range = "week" | "month";

const RED = "#CC1010";

// Chart colours per theme. RED (best tempo) is shared.
const PALETTE = {
  light: {
    cleanFill: "", // page background (see globals.css)
    cleanEdge: "#D4D4D4",
    missed: "#D4D4D4",
    nextBelt: "#737373",
    labelHalo: "", // none: plain black text in light mode
    bestLabel: "#000000",
    tick: "#666666",
    grid: "rgba(0,0,0,0.1)",
    tooltip: "#000000",
    tooltipEdge: "#000000",
  },
  dark: {
    cleanFill: "", // page background (see globals.css)
    cleanEdge: "#737373",
    missed: "#525252",
    nextBelt: "#A3A3A3",
    labelHalo: "", // filled with the page background below
    bestLabel: "#FFFFFF",
    tick: "#A3A3A3",
    grid: "rgba(255,255,255,0.12)",
    tooltip: "#171717",
    tooltipEdge: "#404040",
  },
};

type Session = { day: string; seconds: number };

/** The belt this exercise earns: reach `tempo` cleanly `needed` times.
 *  null once it's been earned (no target line is drawn). */
export type BeltTarget = {
  name: string;
  tempo: number;
  progress: number;
  needed: number;
} | null;

export default function ProgressChart({
  reps,
  sessions = [],
  target = null,
}: {
  reps: Rep[];
  sessions?: Session[];
  target?: BeltTarget;
}) {
  const [range, setRange] = useState<Range>("week");
  const theme = useTheme();
  // Canvas can't read CSS variables, so look up the page background here
  const bg = useMemo(() => {
    if (typeof document === "undefined") return theme === "dark" ? "#000000" : "#FFFFFF";
    return (
      getComputedStyle(document.documentElement).getPropertyValue("--background").trim() ||
      (theme === "dark" ? "#000000" : "#FFFFFF")
    );
  }, [theme]);
  const p = {
    ...PALETTE[theme],
    cleanFill: bg,
    labelHalo: theme === "dark" ? bg : "",
  };

  const model = useMemo(() => {
    // Per-day counts and best clean tempo, over ALL reps so the record
    // line starts at the right level even if the record was set before
    // the visible range.
    const counts = new Map<string, { clean: number; missed: number }>();
    const dayBest = new Map<string, number>();
    for (const r of reps) {
      const c = counts.get(r.createdAt) ?? { clean: 0, missed: 0 };
      if (r.clean) {
        c.clean += 1;
        dayBest.set(r.createdAt, Math.max(dayBest.get(r.createdAt) ?? 0, r.bpm));
      } else {
        c.missed += 1;
      }
      counts.set(r.createdAt, c);
    }

    // Practice time per day. Days with time but no reps still get a slot.
    const timeByDay = new Map<string, number>();
    for (const t of sessions) {
      timeByDay.set(t.day, (timeByDay.get(t.day) ?? 0) + t.seconds);
      if (!counts.has(t.day)) counts.set(t.day, { clean: 0, missed: 0 });
    }

    const allDays = Array.from(counts.keys()).sort();
    let running = 0;
    const runningAt = new Map<string, number>();
    const recordDays = new Set<string>();
    for (const d of allDays) {
      const b = dayBest.get(d) ?? 0;
      if (b > running) {
        running = b;
        recordDays.add(d);
      }
      runningAt.set(d, running);
    }
    const personalBest = running;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range === "week" ? 7 : 30));
    const labels = allDays.filter((d) => new Date(d) >= cutoff);

    const timeByLabel = labels.map((d) => timeByDay.get(d) ?? 0);
    const rangeSeconds = timeByLabel.reduce((sum, v) => sum + v, 0);

    const recordLine = labels.map((d) => {
      const v = runningAt.get(d) ?? 0;
      return v > 0 ? v : null;
    });

    // Axis range always includes the best line and the next-belt target
    const known = [
      ...recordLine.filter((v): v is number => v !== null),
      ...(personalBest ? [personalBest] : []),
    ];
    const lo = known.length ? Math.min(...known) : target ? target.tempo - 20 : 50;
    const hi = Math.max(target?.tempo ?? 0, personalBest || (target ? 0 : 100));
    const yMin = Math.max(0, Math.floor((lo - 10) / 10) * 10);
    const yMax = Math.ceil((hi + 5) / 10) * 10;

    return {
      labels,
      clean: labels.map((d) => counts.get(d)!.clean),
      missed: labels.map((d) => counts.get(d)!.missed),
      recordLine,
      isRecord: labels.map((d) => recordDays.has(d)),
      timeByLabel,
      rangeSeconds,
      personalBest,
      target,
      yMin,
      yMax,
    };
  }, [reps, sessions, range, target]);

  // Draws the dashed best line and next-belt line across the full chart
  // Chart.js keeps the plugin it was created with, so the plugin reads the
  // latest data and colours from this ref instead of a stale copy. Without
  // this, switching light/dark kept the old label colours until a reload.
  const live = useRef({ model, p });
  useLayoutEffect(() => {
    live.current = { model, p };
  });

  const guidePlugin: Plugin = useMemo(
    () => ({
      id: "guides",
      afterDatasetsDraw(chart) {
        const { model, p } = live.current;
        const { ctx, chartArea, scales } = chart;
        const y = scales.y;
        if (!y) return;

        const drawLine = (
          value: number,
          color: string,
          dash: number[],
          text: string,
          textAbove: boolean,
          textColor = color
        ) => {
          const py = y.getPixelForValue(value);
          if (py < chartArea.top || py > chartArea.bottom) return;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, py);
          ctx.lineTo(chartArea.right, py);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.font = "600 11px sans-serif";
          ctx.textAlign = "right";
          ctx.lineWidth = 3;
          if (p.labelHalo) ctx.strokeStyle = p.labelHalo;
          const ty = textAbove ? py - 5 : py + 13;
          if (p.labelHalo) ctx.strokeText(text, chartArea.right - 4, ty);
          ctx.fillStyle = textColor;
          ctx.fillText(text, chartArea.right - 4, ty);
          ctx.restore();
        };

        if (model.target) {
          const t = model.target;
          // Below the target tempo: show the BPM gap. At it: clean reps left.
          const toGo =
            model.personalBest < t.tempo
              ? `${t.tempo - model.personalBest} bpm to go`
              : `${t.needed - t.progress} clean ${t.needed - t.progress === 1 ? "rep" : "reps"} to go`;
          drawLine(
            t.tempo,
            p.nextBelt,
            [2, 4],
            `${t.name} belt · ${toGo}`,
            true
          );
        }
        if (model.personalBest > 0) {
          drawLine(
            model.personalBest,
            RED,
            [6, 4],
            `Best ${model.personalBest} bpm`,
            false,
            p.bestLabel
          );
        }
      },
    }),
    []
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[16.8px] font-medium">
          Your Progress
          {model.rangeSeconds > 0 && (
            <span className="ml-2 text-[14.4px] font-normal text-neutral-500 dark:text-neutral-400">
              {range === "week" ? "7 days" : "30 days"}:{" "}
              {formatDuration(model.rangeSeconds)}
            </span>
          )}
        </p>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-md p-0.5">
          {(["week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2.5 py-1 rounded ${
                range === r
                  ? "bg-white shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {r === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        <Chart
          type="bar"
          plugins={[guidePlugin]}
          data={{
            labels: model.labels,
            datasets: [
              {
                type: "bar" as const,
                label: "Clean",
                data: model.clean,
                backgroundColor: p.cleanFill,
                borderColor: p.cleanEdge,
                borderWidth: 1.5,
                hoverBackgroundColor: p.cleanFill,
                hoverBorderColor: p.cleanEdge,
                hoverBorderWidth: 1.5,
                stack: "reps",
                yAxisID: "y1",
              },
              {
                type: "bar" as const,
                label: "Missed",
                data: model.missed,
                backgroundColor: p.missed,
                hoverBackgroundColor: p.missed,
                stack: "reps",
                yAxisID: "y1",
              },
              {
                type: "line" as const,
                label: "Best BPM",
                data: model.recordLine,
                borderColor: RED,
                backgroundColor: RED,
                borderWidth: 2,
                tension: 0,
                spanGaps: true,
                pointStyle: model.isRecord.map((r) => (r ? "star" : "circle")),
                pointRadius: model.isRecord.map((r) => (r ? 9 : 3)),
                pointHoverRadius: model.isRecord.map((r) => (r ? 9 : 3)),
                pointBackgroundColor: RED,
                pointBorderColor: RED,
                pointHoverBackgroundColor: RED,
                pointHoverBorderColor: RED,
                yAxisID: "y",
                order: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                // 15% bigger than Chart.js defaults (12px text, 6px padding)
                titleFont: { size: 13.8 },
                bodyFont: { size: 13.8 },
                padding: 7,
                caretSize: 6,
                cornerRadius: 7,
                boxWidth: 11.5,
                boxHeight: 11.5,
                boxPadding: 5, // space between colour square and text
                backgroundColor: p.tooltip,
                borderColor: p.tooltipEdge,
                borderWidth: 1,
                callbacks: {
                  // No date heading; practice time goes at the very top
                  title: () => [],
                  beforeBody: (items) => {
                    const secs = model.timeByLabel[items[0]?.dataIndex ?? -1];
                    return secs ? [`Practice time: ${formatDuration(secs)}`] : [];
                  },
                },
              },
            },
            scales: {
              y: {
                position: "left",
                min: model.yMin,
                max: model.yMax,
                ticks: { color: p.tick },
                grid: { color: p.grid },
                border: { color: p.grid },
              },
              x: {
                ticks: { color: p.tick },
                grid: { color: p.grid },
                border: { color: p.grid },
              },
              // Rep-count axis stays (bars need it) but is hidden from view
              y1: { display: false, stacked: true },
            },
          }}
        />
      </div>
    </div>
  );
}
