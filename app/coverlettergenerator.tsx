"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoverLetterResult {
  subject: string;
  cover_letter: string;
  key_points: string[];
  word_count: number;
}

interface CoverLetterGeneratorProps {
  resumeText: string;
  jobDescription: string;
}

type Tone = "professional" | "confident" | "enthusiastic";

// ─── Tone config ──────────────────────────────────────────────────────────────
const TONES: { value: Tone; label: string; desc: string; icon: string }[] = [
  {
    value: "professional",
    label: "Professional",
    desc: "Formal but warm",
    icon: "💼",
  },
  {
    value: "confident",
    label: "Confident",
    desc: "Assertive & direct",
    icon: "⚡",
  },
  {
    value: "enthusiastic",
    label: "Enthusiastic",
    desc: "Energetic & passionate",
    icon: "🚀",
  },
];

// ─── Copy icon ────────────────────────────────────────────────────────────────
function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoverLetterGenerator({
  resumeText,
  jobDescription,
}: CoverLetterGeneratorProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringManagerName, setHiringManagerName] = useState("");

  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          tone,
          userName,
          companyName,
          hiringManagerName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, type: "letter" | "subject") => {
    await navigator.clipboard.writeText(text);
    if (type === "letter") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    }
  };

  const downloadTxt = () => {
    if (!result) return;
    const content = `Subject: ${result.subject}\n\n${result.cover_letter}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cover-letter-wrapper">
      {/* ── Header ── */}
      <div className="cl-header">
        <div className="cl-header-left">
          <span className="cl-icon">✉️</span>
          <div>
            <h2 className="cl-title">Cover Letter Generator</h2>
            <p className="cl-subtitle">
              AI-tailored to your resume &amp; job description
            </p>
          </div>
        </div>
      </div>

      {/* ── Config Panel ── */}
      <div className="cl-config">
        {/* Tone selector */}
        <div className="cl-field-group">
          <label className="cl-label">Tone</label>
          <div className="tone-grid">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`tone-btn ${tone === t.value ? "tone-btn--active" : ""}`}
              >
                <span className="tone-icon">{t.icon}</span>
                <span className="tone-label">{t.label}</span>
                <span className="tone-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <div className="cl-inputs-row">
          <div className="cl-field">
            <label className="cl-label">Your Name <span className="cl-optional">(optional)</span></label>
            <input
              className="cl-input"
              placeholder="e.g. Alex Johnson"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="cl-field">
            <label className="cl-label">Company Name <span className="cl-optional">(optional)</span></label>
            <input
              className="cl-input"
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="cl-field">
            <label className="cl-label">Hiring Manager <span className="cl-optional">(optional)</span></label>
            <input
              className="cl-input"
              placeholder="e.g. Sarah Chen"
              value={hiringManagerName}
              onChange={(e) => setHiringManagerName(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="cl-generate-btn"
        >
          {loading ? (
            <>
              <span className="cl-spinner" />
              Generating...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Generate Cover Letter
            </>
          )}
        </button>

        {error && (
          <div className="cl-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* ── Result ── */}
      {result && (
        <div className="cl-result">
          {/* Key points */}
          {result.key_points.length > 0 && (
            <div className="cl-key-points">
              <p className="cl-kp-title">✨ Key Selling Points Highlighted</p>
              <div className="cl-kp-list">
                {result.key_points.map((point, i) => (
                  <span key={i} className="cl-kp-tag">{point}</span>
                ))}
              </div>
            </div>
          )}

          {/* Subject line */}
          <div className="cl-subject-row">
            <div className="cl-subject-content">
              <span className="cl-subject-label">Email Subject</span>
              <span className="cl-subject-text">{result.subject}</span>
            </div>
            <button
              className="cl-copy-btn cl-copy-btn--sm"
              onClick={() => copyText(result.subject, "subject")}
              title="Copy subject"
            >
              <CopyIcon copied={copiedSubject} />
              {copiedSubject ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Letter body */}
          <div className="cl-letter-box">
            <div className="cl-letter-toolbar">
              <span className="cl-word-count">{result.word_count} words</span>
              <div className="cl-toolbar-actions">
                <button
                  className="cl-copy-btn"
                  onClick={() => copyText(result.cover_letter, "letter")}
                >
                  <CopyIcon copied={copied} />
                  {copied ? "Copied!" : "Copy Letter"}
                </button>
                <button className="cl-download-btn" onClick={downloadTxt}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download .txt
                </button>
              </div>
            </div>
            <div className="cl-letter-text">
              {result.cover_letter.split("\n").map((line, i) =>
                line.trim() === "" ? (
                  <br key={i} />
                ) : (
                  <p key={i}>{line}</p>
                )
              )}
            </div>
          </div>

          {/* Regenerate */}
          <button
            className="cl-regen-btn"
            onClick={generate}
            disabled={loading}
          >
            🔄 Regenerate
          </button>
        </div>
      )}

      {/* ── Styles ── */}
      <style jsx>{`
        .cover-letter-wrapper {
          margin-top: 2.5rem;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
        }

        /* Header */
        .cl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
        }
        .cl-header-left { display: flex; align-items: center; gap: 0.875rem; }
        .cl-icon { font-size: 1.75rem; }
        .cl-title { font-size: 1.15rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
        .cl-subtitle { font-size: 0.78rem; color: #94a3b8; margin: 2px 0 0; }

        /* Config */
        .cl-config { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; border-bottom: 1px solid #f1f5f9; }

        .cl-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .cl-optional { font-weight: 400; text-transform: none; color: #94a3b8; }

        /* Tone grid */
        .tone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.625rem; }
        .tone-btn {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          padding: 0.75rem 0.5rem; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; cursor: pointer; transition: all 0.15s ease;
        }
        .tone-btn:hover { border-color: #94a3b8; background: #f1f5f9; }
        .tone-btn--active { border-color: #3b82f6; background: #eff6ff; }
        .tone-icon { font-size: 1.25rem; }
        .tone-label { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
        .tone-desc { font-size: 0.7rem; color: #64748b; }

        /* Optional inputs */
        .cl-inputs-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .cl-field { display: flex; flex-direction: column; }
        .cl-input {
          padding: 0.6rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 0.875rem; color: #1e293b; background: #f8fafc; outline: none;
          transition: border-color 0.15s;
        }
        .cl-input:focus { border-color: #3b82f6; background: white; }
        .cl-input::placeholder { color: #94a3b8; }

        /* Generate button */
        .cl-generate-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.85rem 1.5rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease; letter-spacing: 0.01em;
        }
        .cl-generate-btn:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.35); }
        .cl-generate-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .cl-spinner {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Error */
        .cl-error {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-radius: 8px;
          background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.85rem;
        }

        /* Result */
        .cl-result { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

        /* Key points */
        .cl-key-points { padding: 0.875rem 1rem; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; }
        .cl-kp-title { font-size: 0.8rem; font-weight: 600; color: #15803d; margin: 0 0 0.5rem; }
        .cl-kp-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cl-kp-tag { padding: 0.25rem 0.625rem; border-radius: 20px; background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 500; }

        /* Subject row */
        .cl-subject-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; gap: 1rem;
        }
        .cl-subject-content { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
        .cl-subject-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .cl-subject-text { font-size: 0.875rem; color: #1e293b; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Letter box */
        .cl-letter-box { border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .cl-letter-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.625rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }
        .cl-word-count { font-size: 0.75rem; color: #64748b; font-weight: 500; }
        .cl-toolbar-actions { display: flex; gap: 0.5rem; }

        .cl-copy-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;
          background: white; color: #475569; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .cl-copy-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .cl-copy-btn--sm { flex-shrink: 0; }

        .cl-download-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid #e2e8f0;
          background: white; color: #475569; font-size: 0.78rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .cl-download-btn:hover { background: #f1f5f9; }

        .cl-letter-text {
          padding: 1.5rem; font-size: 0.9rem; line-height: 1.8; color: #1e293b;
          background: white; font-family: Georgia, serif;
        }
        .cl-letter-text p { margin: 0; }

        /* Regen */
        .cl-regen-btn {
          align-self: flex-start; padding: 0.5rem 1rem; border-radius: 8px;
          border: 1.5px solid #e2e8f0; background: white; color: #475569;
          font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.15s;
        }
        .cl-regen-btn:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
        .cl-regen-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Responsive */
        @media (max-width: 640px) {
          .cl-inputs-row { grid-template-columns: 1fr; }
          .tone-grid { grid-template-columns: 1fr; }
          .cl-letter-toolbar { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
}