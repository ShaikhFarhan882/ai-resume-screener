"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "./history.css";

export interface ScanRecord {
  id: string;
  date: string;
  filename: string;
  jobTitle: string;
  score: number;
  ats_score: number;
  summary: string;
}

const STORAGE_KEY = "resumeai_scan_history";
const MAX_RECORDS = 10;

export function saveScan(record: Omit<ScanRecord, "id" | "date">) {
  if (typeof window === "undefined") return;
  const existing = getHistory();
  const newRecord: ScanRecord = {
    ...record,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const updated = [newRecord, ...existing].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("resumeai_scan_saved"));
}

export function getHistory(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function scoreColor(s: number) {
  return s >= 80 ? "#4ADE80" : s >= 60 ? "#FBBF24" : "#F87171";
}

function scoreLabel(s: number) {
  return s >= 80 ? "Strong" : s >= 60 ? "Good" : s >= 40 ? "Partial" : "Weak";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="tooltip-label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="tooltip-row">
            <span className="tooltip-dot" style={{ background: p.color }} />
            <span className="tooltip-name">{p.name}</span>
            <span className="tooltip-value" style={{ color: p.color }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ScoreHistory() {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    const handler = () => setHistory(getHistory());
    window.addEventListener("resumeai_scan_saved", handler);
    return () => window.removeEventListener("resumeai_scan_saved", handler);
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setShowConfirm(false);
  };

  if (!mounted || history.length === 0) return null;

  const chartData = [...history]
    .reverse()
    .map((r, i) => ({
      name: `#${i + 1}`,
      date: formatShortDate(r.date),
      "Match Score": r.score,
      "ATS Score": r.ats_score,
    }));

  const latestScore = history[0].score;
  const previousScore = history[1]?.score;
  const scoreDiff = previousScore !== undefined ? latestScore - previousScore : null;
  const bestScore = Math.max(...history.map((r) => r.score));
  const avgScore = Math.round(
    history.reduce((a, r) => a + r.score, 0) / history.length
  );

  return (
    <section className="history-section">
      {/* Header */}
      <div className="history-header">
        <div className="history-header-left">
          <div className="history-label">
            <div className="history-label-dot" />
            Progress Tracker
          </div>
          <h2 className="history-title">
            Your score{" "}
            <span className="history-title-accent">over time</span>
          </h2>
          <p className="history-desc">
            Track how your resume improves with each scan.{" "}
            {history.length} scan{history.length !== 1 ? "s" : ""} recorded.
          </p>
        </div>

        <div className="history-stats">
          <div className="history-stat">
            <div
              className="history-stat-num"
              style={{ color: scoreColor(latestScore) }}
            >
              {latestScore}
            </div>
            <div className="history-stat-label">Latest</div>
          </div>
          <div className="history-stat-divider" />
          <div className="history-stat">
            <div className="history-stat-num" style={{ color: "#4ADE80" }}>
              {bestScore}
            </div>
            <div className="history-stat-label">Best</div>
          </div>
          <div className="history-stat-divider" />
          <div className="history-stat">
            <div className="history-stat-num">{avgScore}</div>
            <div className="history-stat-label">Avg</div>
          </div>
          {scoreDiff !== null && (
            <>
              <div className="history-stat-divider" />
              <div className="history-stat">
                <div
                  className="history-stat-num"
                  style={{ color: scoreDiff >= 0 ? "#4ADE80" : "#F87171" }}
                >
                  {scoreDiff >= 0 ? "+" : ""}
                  {scoreDiff}
                </div>
                <div className="history-stat-label">vs last</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="history-chart-card">
        <div className="chart-legend-custom">
          <span className="chart-legend-item">
            <span
              className="chart-legend-dot"
              style={{ background: "#7C6AF7" }}
            />
            Match Score
          </span>
          <span className="chart-legend-item">
            <span
              className="chart-legend-dot"
              style={{ background: "#F7A06A" }}
            />
            ATS Score
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#7A7890", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#7A7890", fontSize: 11, fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={80}
              stroke="rgba(74,222,128,0.15)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={60}
              stroke="rgba(251,191,36,0.15)"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="Match Score"
              stroke="#7C6AF7"
              strokeWidth={2.5}
              dot={{ fill: "#7C6AF7", r: 4, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: "#7C6AF7",
                stroke: "rgba(124,106,247,0.3)",
                strokeWidth: 4,
              }}
            />
            <Line
              type="monotone"
              dataKey="ATS Score"
              stroke="#F7A06A"
              strokeWidth={2.5}
              strokeDasharray="5 3"
              dot={{ fill: "#F7A06A", r: 4, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: "#F7A06A",
                stroke: "rgba(247,160,106,0.3)",
                strokeWidth: 4,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-zones">
          <span className="chart-zone" style={{ color: "#4ADE80" }}>
            ▸ 80+ Strong
          </span>
          <span className="chart-zone" style={{ color: "#FBBF24" }}>
            ▸ 60–79 Good
          </span>
          <span className="chart-zone" style={{ color: "#F87171" }}>
            ▸ Below 60 Needs work
          </span>
        </div>
      </div>

      {/* Scan Cards */}
      <div className="history-cards">
        {history.map((record, i) => (
          <div key={record.id} className={`history-card ${i === 0 ? "history-card-latest" : ""}`}>
            {i === 0 && <div className="latest-badge">✦ Latest</div>}
            <div className="history-card-top">
              <div className="history-card-left">
                <div className="scan-index">Scan #{history.length - i}</div>
                <div className="scan-filename">📎 {record.filename}</div>
                {record.jobTitle && (
                  <div className="scan-jobtitle">💼 {record.jobTitle}</div>
                )}
                <div className="scan-date">🕐 {formatDate(record.date)}</div>
              </div>
              <div className="history-card-scores">
                <div
                  className="history-score-pill"
                  style={{
                    color: scoreColor(record.score),
                    background: scoreColor(record.score) + "15",
                    border: `1px solid ${scoreColor(record.score)}30`,
                  }}
                >
                  <span className="score-pill-num">{record.score}</span>
                  <span className="score-pill-label">
                    Match · {scoreLabel(record.score)}
                  </span>
                </div>
                <div
                  className="history-score-pill"
                  style={{
                    color: scoreColor(record.ats_score),
                    background: scoreColor(record.ats_score) + "15",
                    border: `1px solid ${scoreColor(record.ats_score)}30`,
                  }}
                >
                  <span className="score-pill-num">{record.ats_score}</span>
                  <span className="score-pill-label">ATS Score</span>
                </div>
              </div>
            </div>
            {record.summary && (
              <div className="scan-summary">{record.summary}</div>
            )}
          </div>
        ))}
      </div>

      {/* Clear */}
      <div className="history-footer">
        {!showConfirm ? (
          <button className="btn-clear" onClick={() => setShowConfirm(true)}>
            🗑 Clear History
          </button>
        ) : (
          <div className="confirm-row">
            <span className="confirm-text">
              Are you sure? This can&apos;t be undone.
            </span>
            <button className="btn-confirm-yes" onClick={handleClear}>
              Yes, clear
            </button>
            <button
              className="btn-confirm-no"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}