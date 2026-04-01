"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  question: string;
  intent: string;
  strategy: string;
  difficulty: "easy" | "medium" | "hard";
  category: "gap" | "behavioral" | "technical" | "strength" | "culture";
}

interface InterviewPrepProps {
  resumeText: string;
  jobDescription: string;
  gaps: { issue: string; fix: string }[];
  strengths: string[];
}

// ─── Config maps ──────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  Question["category"],
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  gap:        { label: "Skill Gap",  color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", icon: "⚠️" },
  behavioral: { label: "Behavioral", color: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  icon: "🧠" },
  technical:  { label: "Technical",  color: "#818CF8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)", icon: "⚙️" },
  strength:   { label: "Strength",   color: "#4ADE80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)",  icon: "💪" },
  culture:    { label: "Culture Fit",color: "#38BDF8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)",  icon: "🤝" },
};

const DIFFICULTY_CONFIG: Record<
  Question["difficulty"],
  { label: string; color: string; bg: string }
> = {
  easy:   { label: "Easy",   color: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  medium: { label: "Medium", color: "#FBBF24", bg: "rgba(251,191,36,0.12)"  },
  hard:   { label: "Hard",   color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

// ─── Single Question Card ─────────────────────────────────────────────────────
function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false);
  const cat  = CATEGORY_CONFIG[q.category]  ?? CATEGORY_CONFIG.technical;
  const diff = DIFFICULTY_CONFIG[q.difficulty] ?? DIFFICULTY_CONFIG.medium;

  return (
    <div className={`iq-card ${open ? "iq-card--open" : ""}`}>
      <button className="iq-card-header" onClick={() => setOpen(!open)}>
        <div className="iq-card-left">
          <span className="iq-num">{String(index + 1).padStart(2, "0")}</span>
          <div className="iq-meta">
            <div className="iq-badges">
              <span
                className="iq-badge"
                style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}
              >
                {cat.icon} {cat.label}
              </span>
              <span
                className="iq-badge"
                style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.color}30` }}
              >
                {diff.label}
              </span>
            </div>
            <p className="iq-question">{q.question}</p>
          </div>
        </div>
        <span className={`iq-chevron ${open ? "iq-chevron--open" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="iq-card-body">
          <div className="iq-insight">
            <div className="iq-insight-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Why they ask this
            </div>
            <p className="iq-insight-text">{q.intent}</p>
          </div>
          <div className="iq-strategy">
            <div className="iq-insight-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              How to answer
            </div>
            <p className="iq-strategy-text">{q.strategy}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .iq-card {
          border: 1.5px solid #1e293b;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #0f172a;
        }
        .iq-card:hover { border-color: #334155; }
        .iq-card--open { border-color: #7c6af7; box-shadow: 0 0 0 1px rgba(124,106,247,0.2); }

        .iq-card-header {
          width: 100%; display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem;
          padding: 1rem 1.1rem; background: transparent;
          border: none; cursor: pointer; text-align: left;
          transition: background 0.15s;
        }
        .iq-card-header:hover { background: rgba(255,255,255,0.02); }

        .iq-card-left { display: flex; align-items: flex-start; gap: 0.875rem; flex: 1; min-width: 0; }
        .iq-num { font-size: 0.7rem; font-weight: 700; color: #475569; font-variant-numeric: tabular-nums; padding-top: 3px; flex-shrink: 0; }
        .iq-meta { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; min-width: 0; }

        .iq-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .iq-badge { font-size: 0.68rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 20px; white-space: nowrap; }

        .iq-question { margin: 0; font-size: 0.88rem; font-weight: 500; color: #e2e8f0; line-height: 1.55; }

        .iq-chevron { flex-shrink: 0; color: #475569; padding-top: 2px; transition: transform 0.2s; }
        .iq-chevron--open { transform: rotate(180deg); color: #7c6af7; }

        .iq-card-body {
          padding: 0 1.1rem 1.1rem 1.1rem;
          margin-left: calc(0.875rem + 1.5rem);
          display: flex; flex-direction: column; gap: 0.75rem;
          animation: fadeSlide 0.2s ease;
        }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .iq-insight, .iq-strategy {
          padding: 0.75rem 0.875rem; border-radius: 8px;
        }
        .iq-insight { background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.15); }
        .iq-strategy { background: rgba(124,106,247,0.07); border: 1px solid rgba(124,106,247,0.2); }

        .iq-insight-label {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.35rem;
        }
        .iq-insight-text { margin: 0; font-size: 0.82rem; color: #94a3b8; line-height: 1.6; }
        .iq-strategy-text { margin: 0; font-size: 0.82rem; color: #c4b5fd; line-height: 1.6; }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewPrep({
  resumeText,
  jobDescription,
  gaps,
  strengths,
}: InterviewPrepProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [generated, setGenerated] = useState(false);
  const [filter, setFilter]       = useState<Question["category"] | "all">("all");

  const generate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, gaps, strengths }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setQuestions(data.questions);
      setGenerated(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? questions : questions.filter((q) => q.category === filter);

  const counts = questions.reduce(
    (acc, q) => { acc[q.category] = (acc[q.category] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="ip-wrapper">
      {/* Header */}
      <div className="ip-header">
        <div className="ip-header-left">
          <span className="ip-icon">🎯</span>
          <div>
            <h2 className="ip-title">Interview Prep</h2>
            <p className="ip-subtitle">AI-predicted questions based on your gaps &amp; experience</p>
          </div>
        </div>
        {generated && (
          <button className="ip-regen-btn" onClick={generate} disabled={loading}>
            🔄 Regenerate
          </button>
        )}
      </div>

      {/* Body */}
      <div className="ip-body">
        {!generated ? (
          /* CTA state */
          <div className="ip-cta">
            <div className="ip-cta-grid">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="ip-cta-pill" style={{ borderColor: cfg.border, background: cfg.bg }}>
                  <span>{cfg.icon}</span>
                  <span style={{ color: cfg.color, fontSize: "0.75rem", fontWeight: 600 }}>{cfg.label}</span>
                </div>
              ))}
            </div>
            <p className="ip-cta-desc">
              Get 8 tailored questions — covering your skill gaps, behavioral scenarios, technical depth, and culture fit — with answer strategies for each.
            </p>
            <button className="ip-generate-btn" onClick={generate} disabled={loading}>
              {loading ? (
                <><span className="ip-spinner" /> Predicting questions...</>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Generate Interview Questions
                </>
              )}
            </button>
            {error && <div className="ip-error">{error}</div>}
          </div>
        ) : (
          /* Results state */
          <div className="ip-results">
            {/* Stats row */}
            <div className="ip-stats-row">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) =>
                counts[key] ? (
                  <div key={key} className="ip-stat-chip" style={{ borderColor: cfg.border, background: cfg.bg }}>
                    <span style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                    <span className="ip-stat-count" style={{ color: cfg.color }}>{counts[key]}</span>
                  </div>
                ) : null
              )}
            </div>

            {/* Filter tabs */}
            <div className="ip-filters">
              <button
                className={`ip-filter-btn ${filter === "all" ? "ip-filter-btn--active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All <span className="ip-filter-count">{questions.length}</span>
              </button>
              {(Object.keys(CATEGORY_CONFIG) as Question["category"][]).map((cat) =>
                counts[cat] ? (
                  <button
                    key={cat}
                    className={`ip-filter-btn ${filter === cat ? "ip-filter-btn--active" : ""}`}
                    onClick={() => setFilter(cat)}
                    style={filter === cat ? {
                      color: CATEGORY_CONFIG[cat].color,
                      borderColor: CATEGORY_CONFIG[cat].border,
                      background: CATEGORY_CONFIG[cat].bg,
                    } : {}}
                  >
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    <span className="ip-filter-count">{counts[cat]}</span>
                  </button>
                ) : null
              )}
            </div>

            {/* Question cards */}
            <div className="ip-cards">
              {filtered.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={questions.indexOf(q)} />
              ))}
            </div>

            {error && <div className="ip-error">{error}</div>}
          </div>
        )}
      </div>

      <style jsx>{`
        .ip-wrapper {
          margin-top: 1.5rem;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #1e293b;
          background: #080f1a;
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        }

        /* Header */
        .ip-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-bottom: 1px solid #1e293b;
        }
        .ip-header-left { display: flex; align-items: center; gap: 0.875rem; }
        .ip-icon { font-size: 1.75rem; }
        .ip-title { font-size: 1.15rem; font-weight: 700; margin: 0; color: #f1f5f9; letter-spacing: -0.01em; }
        .ip-subtitle { font-size: 0.78rem; color: #475569; margin: 2px 0 0; }

        .ip-regen-btn {
          padding: 0.45rem 0.875rem; border-radius: 8px;
          border: 1px solid #1e293b; background: #0f172a;
          color: #64748b; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .ip-regen-btn:hover:not(:disabled) { border-color: #334155; color: #94a3b8; }

        /* Body */
        .ip-body { padding: 1.5rem; }

        /* CTA */
        .ip-cta { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; padding: 0.5rem 0; }
        .ip-cta-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
        .ip-cta-pill {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid;
        }
        .ip-cta-desc { font-size: 0.85rem; color: #475569; text-align: center; line-height: 1.6; max-width: 480px; margin: 0; }

        .ip-generate-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.85rem 1.75rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c6af7, #5b4fcc);
          color: white; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s; letter-spacing: 0.01em;
        }
        .ip-generate-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,106,247,0.4); }
        .ip-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ip-spinner {
          width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .ip-error {
          width: 100%; padding: 0.75rem 1rem; border-radius: 8px;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
          color: #F87171; font-size: 0.82rem;
        }

        /* Results */
        .ip-results { display: flex; flex-direction: column; gap: 1rem; }

        /* Stats */
        .ip-stats-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .ip-stat-chip {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.3rem 0.75rem; border-radius: 20px; border: 1px solid; font-size: 0.75rem; font-weight: 500;
        }
        .ip-stat-count { font-weight: 700; }

        /* Filters */
        .ip-filters { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ip-filter-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.35rem 0.75rem; border-radius: 8px;
          border: 1px solid #1e293b; background: #0f172a;
          color: #475569; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .ip-filter-btn:hover { border-color: #334155; color: #64748b; }
        .ip-filter-btn--active { border-color: #7c6af7; background: rgba(124,106,247,0.1); color: #a78bfa; }
        .ip-filter-count {
          font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.35rem;
          border-radius: 10px; background: rgba(255,255,255,0.07); color: inherit;
        }

        /* Cards */
        .ip-cards { display: flex; flex-direction: column; gap: 0.6rem; }

        @media (max-width: 640px) {
          .ip-filters { gap: 0.3rem; }
          .ip-filter-btn { font-size: 0.72rem; padding: 0.3rem 0.6rem; }
        }
      `}</style>
    </div>
  );
}