"use client";
import { useState, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import "./page.css";

type AppStatus = "idle" | "parsing" | "analyzing" | "success" | "error";

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: { issue: string; fix: string }[];
  rewrite_suggestions: { original: string; improved: string }[];
}

export default function Home() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setStatus("idle");
      setResult(null);
      setErrorMsg("");
    } else {
      setErrorMsg("Please upload a PDF file.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStatus("idle");
      setResult(null);
      setErrorMsg("");
    }
  };

  const handleAnalyze = async () => {
    if (!file || !jd.trim()) return;
    setStatus("parsing");
    setErrorMsg("");
    setResult(null);

    try {
      // Step 1: Parse PDF
      const formData = new FormData();
      formData.append("resume", file);
      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok || parseData.error) {
        setErrorMsg(parseData.error || "Failed to parse PDF.");
        setStatus("error");
        return;
      }

      // Step 2: Analyze with Gemini
      setStatus("analyzing");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: parseData.text, jobDescription: jd }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok || analyzeData.error) {
        setErrorMsg(analyzeData.error || "Analysis failed.");
        setStatus("error");
        return;
      }

      setResult(analyzeData);
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setStatus("error");
    }
  };

  const canSubmit = file && jd.trim().length > 0 && status !== "parsing" && status !== "analyzing";

  const scoreColor = (s: number) => s >= 80 ? "#4ADE80" : s >= 60 ? "#FBBF24" : "#F87171";
  const scoreLabel = (s: number) => s >= 80 ? "Strong Match" : s >= 60 ? "Good Match" : s >= 40 ? "Partial Match" : "Weak Match";

  const handleReset = () => {
    setFile(null);
    setJd("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, color: [number,number,number], bold = false, indent = 0) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentW - indent);
      lines.forEach((line: string) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin + indent, y);
        y += size * 0.45;
      });
      y += 2;
    };

    const addDivider = (color: [number,number,number] = [50,50,70]) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
    };

    // Header
    doc.setFillColor(27, 42, 74);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(240,238,248);
    doc.text("Resume Analysis Report", margin, 13);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(180,170,210);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}`, margin, 21);
    y = 38;

    // Score
    const scoreColor: [number,number,number] = result.score >= 80 ? [74,222,128] : result.score >= 60 ? [251,191,36] : [248,113,113];
    const scoreLabel = result.score >= 80 ? "Strong Match" : result.score >= 60 ? "Good Match" : result.score >= 40 ? "Partial Match" : "Weak Match";
    addText(`Match Score: ${result.score}/100 — ${scoreLabel}`, 16, scoreColor, true);
    addText(result.summary, 10, [150,140,180]);
    addDivider();

    // Strengths
    addText("STRENGTHS", 11, [74,222,128], true);
    result.strengths.forEach(s => addText(`+ ${s}`, 9.5, [200,195,230], false, 3));
    y += 3;
    addDivider();

    // Gaps
    addText("SKILL GAPS  HOW TO FIX", 11, [248,113,113], true);
    result.gaps.forEach(g => {
      const issue = typeof g === "string" ? g : g.issue;
      const fix = typeof g === "string" ? "" : g.fix;
      addText(`- ${issue}`, 9.5, [200,195,230], false, 3);
      if (fix) addText(`  Fix: ${fix}`, 9, [124,106,247], false, 6);
    });
    y += 3;
    addDivider();

    // Rewrites
    addText("REWRITE SUGGESTIONS", 11, [124,106,247], true);
    result.rewrite_suggestions.forEach((rw, i) => {
      addText(`${i+1}. Before:`, 9, [180,100,100], true, 2);
      addText(rw.original, 9, [160,155,190], false, 5);
      addText(`   After:`, 9, [80,160,110], true, 2);
      addText(rw.improved, 9, [200,230,210], false, 5);
      y += 2;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(100,95,130);
      doc.text(`ResumeAI Report · Page ${i} of ${pageCount}`, margin, 290);
    }

    doc.save("resume-analysis.pdf");
  };

  return (
    <>

      <div className="blob blob-1" /><div className="blob blob-2" />

      <nav>
        <div className="nav-inner">
          <div className="logo"><div className="logo-dot" />ResumeAI</div>
          <div className="nav-badge">BETA</div>
        </div>
      </nav>

      <div className="wrapper">
        <section className="hero">
          <div className="hero-label"><div className="hero-label-dot" />Powered by AI</div>
          <h1>Land the job<br /><span className="h1-line2">you actually want.</span></h1>
          <p className="hero-sub">Upload your resume, paste a job description — get a match score, skill gap analysis, and rewrite suggestions in seconds.</p>
          <div className="stats">
            <div className="stat"><div className="stat-num">84%</div><div className="stat-label">Avg. score lift</div></div>
            <div className="stat-divider" />
            <div className="stat"><div className="stat-num">&lt;10s</div><div className="stat-label">Analysis time</div></div>
            <div className="stat-divider" />
            <div className="stat"><div className="stat-num">3+</div><div className="stat-label">Rewrites per scan</div></div>
          </div>
        </section>

        <div className="main-card">
          <div className="card-header">
            <div className="traffic-dot" style={{ background: "#FF5F57" }} />
            <div className="traffic-dot" style={{ background: "#FFBD2E" }} />
            <div className="traffic-dot" style={{ background: "#28CA41" }} />
            <span className="card-header-title">RESUME SCREENER</span>
          </div>
          <div className="card-body">
            <div className="panel">
              <div className="panel-label">📄 Resume PDF</div>
              <div
                className={`drop-zone ${dragOver ? "drag-over" : ""} ${file && status !== "error" ? "has-file" : ""} ${status === "error" ? "has-error" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
                <div className="drop-icon">{status === "error" ? "❌" : file ? "✅" : "☁️"}</div>
                {file ? (
                  <>
                    <div className="drop-title">{status === "error" ? "Upload failed" : "Resume ready"}</div>
                    <div className="file-meta">📎 {file.name}</div>
                    <div className="drop-sub" style={{ marginTop: "0.3rem" }}>Click to replace</div>
                  </>
                ) : (
                  <>
                    <div className="drop-title">Drop your PDF here</div>
                    <div className="drop-sub">or click to browse · PDF only · max 5MB</div>
                  </>
                )}
              </div>
            </div>
            <div className="panel">
              <div className="panel-label">💼 Job Description</div>
              <textarea
                placeholder="Paste the full job description here — include responsibilities, requirements, and any skills mentioned..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={7}
              />
            </div>
          </div>
          <div className="card-footer">
            <div className="footer-hint">
              {status === "parsing" && "⏳ Reading your resume..."}
              {status === "analyzing" && "🤖 Analyzing against job description..."}
              {(status === "idle" || status === "success" || status === "error") && "Your data is never stored or shared"}
            </div>
            <button className="btn-primary" onClick={handleAnalyze} disabled={!canSubmit}>
              {status === "parsing" || status === "analyzing" ? (
                <><div className="spinner" />{status === "parsing" ? "Parsing PDF..." : "Analyzing..."}</>
              ) : (
                <>Analyze Resume <span className="btn-arrow">→</span></>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {status === "error" && errorMsg && (
          <div className="error-banner">
            <div className="banner-top"><span>⚠️</span><span className="banner-title">Error</span></div>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>{errorMsg}</p>
          </div>
        )}

        {/* Results */}
        {status === "success" && result && (
          <div className="results">
            {/* Score ring */}
            <div className="score-card">
              <div className="score-ring-wrap">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle className="score-ring-bg" cx="55" cy="55" r="45" />
                  <circle
                    className="score-ring-fill"
                    cx="55" cy="55" r="45"
                    stroke={scoreColor(result.score)}
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * result.score) / 100}
                  />
                </svg>
                <div className="score-number">
                  <span className="score-num" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                  <span className="score-max">/ 100</span>
                </div>
              </div>
              <div className="score-info">
                <div className="score-label" style={{ color: scoreColor(result.score) }}>{scoreLabel(result.score)}</div>
                <div className="score-summary">{result.summary}</div>
              </div>
            </div>

            {/* Strengths & Gaps */}
            <div className="two-col">
              <div className="info-card">
                <div className="info-card-title" style={{ color: "var(--green)" }}>✅ Strengths</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="info-item">
                    <div className="info-dot" style={{ background: "var(--green)" }} />{s}
                  </div>
                ))}
              </div>
              <div className="info-card">
                <div className="info-card-title" style={{ color: "var(--red)" }}>⚠️ Skill Gaps</div>
                {result.gaps.map((g, i) => (
                  <div key={i} style={{ marginBottom: "0.9rem" }}>
                    <div className="info-item" style={{ marginBottom: "0.2rem" }}>
                      <div className="info-dot" style={{ background: "var(--red)" }} />
                      <span style={{ color: "var(--text)", fontWeight: 500 }}>{g.issue ?? g}</span>
                    </div>
                    {g.fix && (
                      <div style={{ marginLeft: "1.1rem", fontSize: "0.78rem", color: "var(--accent)", lineHeight: 1.5, background: "rgba(124,106,247,0.08)", border: "1px solid rgba(124,106,247,0.15)", borderRadius: "8px", padding: "0.4rem 0.7rem" }}>
                        💡 {g.fix}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rewrites */}
            <div className="rewrites-card">
              <div className="rewrites-title" style={{ color: "var(--accent)" }}>✍️ Rewrite Suggestions</div>
              {result.rewrite_suggestions.map((rw, i) => (
                <div key={i} className="rewrite-item">
                  <div className="rewrite-label" style={{ color: "var(--red)" }}>Before</div>
                  <div className="rewrite-text rewrite-before">{rw.original}</div>
                  <div className="rewrite-label" style={{ color: "var(--green)" }}>After</div>
                  <div className="rewrite-text rewrite-after">{rw.improved}</div>
                  <button
                    className={`copy-btn ${copiedIndex === i ? "copied" : ""}`}
                    onClick={() => handleCopy(rw.improved, i)}
                  >
                    {copiedIndex === i ? "✅ Copied!" : "📋 Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Another Resume button */}
        {status === "success" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button className="btn-download" onClick={handleDownloadPDF}>
              ⬇ Download Report PDF
            </button>
            <button className="btn-reset" onClick={handleReset}>
              ↩ Scan Another Resume
            </button>
          </div>
        )}

        {/* Features — hide when results shown */}
        {status !== "success" && (
          <div className="features" style={{ marginTop: "2rem" }}>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: "rgba(124,106,247,0.15)", border: "1px solid rgba(124,106,247,0.25)" }}>🎯</div>
              <div className="feature-title">Match Score</div>
              <div className="feature-desc">Get a 0–100 score showing exactly how well your resume aligns with the job requirements.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: "rgba(247,160,106,0.15)", border: "1px solid rgba(247,160,106,0.25)" }}>🔍</div>
              <div className="feature-title">Skill Gap Analysis</div>
              <div className="feature-desc">See which skills you're missing and which strengths already make you a strong candidate.</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.25)" }}>✍️</div>
              <div className="feature-title">Rewrite Suggestions</div>
              <div className="feature-desc">Get bullet-by-bullet rewrites that tailor your experience to the specific role.</div>
            </div>
          </div>
        )}

        <div className="page-footer">Built with Next.js + AI · <a href="#">View on GitHub</a></div>
      </div>
    </>
  );
}