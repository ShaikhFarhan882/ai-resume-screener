"use client";
import { useState, useRef, useCallback } from "react";

type AppStatus = "idle" | "parsing" | "analyzing" | "success" | "error";

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0A0A0F; --card: #16161F;
          --border: rgba(255,255,255,0.07); --border-hover: rgba(255,255,255,0.15);
          --text: #F0EEF8; --muted: #7A7890;
          --accent: #7C6AF7; --accent-glow: rgba(124,106,247,0.22);
          --accent2: #F7A06A; --green: #4ADE80; --red: #F87171; --yellow: #FBBF24;
        }
        body { background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; min-height:100vh; overflow-x:hidden; }
        body::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:0.4; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); }
        .blob { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; animation:drift 12s ease-in-out infinite alternate; }
        .blob-1 { width:600px; height:600px; background:rgba(124,106,247,0.12); top:-200px; left:-150px; }
        .blob-2 { width:500px; height:500px; background:rgba(247,160,106,0.08); bottom:-100px; right:-100px; animation-delay:-6s; }
        @keyframes drift { from{transform:translate(0,0) scale(1);}to{transform:translate(30px,-30px) scale(1.05);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }

        nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:1.2rem 0; border-bottom:1px solid var(--border); background:rgba(10,10,15,0.8); backdrop-filter:blur(20px); }
        .nav-inner { max-width:1100px; margin:0 auto; padding:0 2rem; display:flex; align-items:center; justify-content:space-between; }
        .logo { font-family:'Syne',sans-serif; font-weight:800; font-size:1.15rem; letter-spacing:-0.02em; display:flex; align-items:center; gap:0.5rem; }
        .logo-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 12px var(--accent); }
        .nav-badge { font-size:0.72rem; padding:0.25rem 0.7rem; border-radius:100px; border:1px solid var(--border); color:var(--muted); letter-spacing:0.05em; }
        .wrapper { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:0 2rem; }
        .hero { padding:140px 0 60px; text-align:center; }
        .hero-label { display:inline-flex; align-items:center; gap:0.5rem; font-size:0.75rem; font-weight:500; letter-spacing:0.1em; color:var(--accent); padding:0.35rem 0.9rem; border:1px solid rgba(124,106,247,0.3); border-radius:100px; margin-bottom:2rem; text-transform:uppercase; animation:fadeUp 0.6s ease both; }
        .hero-label-dot { width:5px; height:5px; border-radius:50%; background:var(--accent); animation:pulse 2s infinite; }
        h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(2.8rem,6vw,5.2rem); line-height:1.0; letter-spacing:-0.04em; margin-bottom:1.5rem; animation:fadeUp 0.6s 0.1s ease both; }
        .h1-line2 { background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .hero-sub { font-size:1.1rem; font-weight:300; color:var(--muted); max-width:500px; margin:0 auto 3rem; line-height:1.7; animation:fadeUp 0.6s 0.2s ease both; }
        .stats { display:flex; justify-content:center; gap:3rem; margin-bottom:4rem; animation:fadeUp 0.6s 0.3s ease both; }
        .stat { text-align:center; }
        .stat-num { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; letter-spacing:-0.03em; }
        .stat-label { font-size:0.78rem; color:var(--muted); margin-top:0.2rem; letter-spacing:0.05em; }
        .stat-divider { width:1px; background:var(--border); }
        .main-card { background:var(--card); border:1px solid var(--border); border-radius:24px; overflow:hidden; margin-bottom:1.5rem; animation:fadeUp 0.6s 0.35s ease both; box-shadow:0 0 0 1px rgba(255,255,255,0.03),0 40px 80px rgba(0,0,0,0.4); }
        .card-header { padding:1.25rem 1.75rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.02); }
        .traffic-dot { width:11px; height:11px; border-radius:50%; }
        .card-header-title { margin-left:auto; font-size:0.75rem; color:var(--muted); letter-spacing:0.05em; font-weight:500; }
        .card-body { display:grid; grid-template-columns:1fr 1fr; }
        .panel { padding:2rem; }
        .panel:first-child { border-right:1px solid var(--border); }
        .panel-label { font-size:0.7rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem; }
        .drop-zone { border:1.5px dashed var(--border); border-radius:16px; padding:2.5rem 1.5rem; text-align:center; cursor:pointer; transition:all 0.25s ease; background:rgba(255,255,255,0.015); }
        .drop-zone:hover,.drop-zone.drag-over { border-color:var(--accent); background:var(--accent-glow); }
        .drop-zone.has-file { border-color:var(--green); background:rgba(74,222,128,0.06); border-style:solid; }
        .drop-zone.has-error { border-color:var(--red); background:rgba(248,113,113,0.06); border-style:solid; }
        .drop-icon { width:48px; height:48px; border-radius:12px; background:rgba(124,106,247,0.15); border:1px solid rgba(124,106,247,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; font-size:1.3rem; transition:transform 0.25s ease; }
        .drop-zone:hover .drop-icon { transform:translateY(-3px); }
        .drop-title { font-size:0.9rem; font-weight:500; margin-bottom:0.3rem; }
        .drop-sub { font-size:0.78rem; color:var(--muted); }
        .file-meta { display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-top:0.5rem; font-size:0.8rem; color:var(--green); font-weight:500; }
        textarea { width:100%; background:rgba(255,255,255,0.03); border:1.5px solid var(--border); border-radius:12px; color:var(--text); font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:300; line-height:1.7; padding:1rem 1.1rem; resize:none; outline:none; transition:border-color 0.2s; min-height:180px; }
        textarea::placeholder { color:var(--muted); }
        textarea:focus { border-color:var(--accent); }
        .card-footer { padding:1.25rem 2rem; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.01); gap:1rem; }
        .footer-hint { font-size:0.78rem; color:var(--muted); }
        .btn-primary { display:flex; align-items:center; gap:0.6rem; background:var(--accent); color:#fff; border:none; border-radius:12px; padding:0.75rem 1.75rem; font-family:'Syne',sans-serif; font-size:0.9rem; font-weight:700; cursor:pointer; transition:all 0.2s ease; box-shadow:0 0 30px rgba(124,106,247,0.3); white-space:nowrap; }
        .btn-primary:hover:not(:disabled) { background:#6B59E8; box-shadow:0 0 40px rgba(124,106,247,0.5); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:0.4; cursor:not-allowed; box-shadow:none; }
        .btn-arrow { display:inline-block; transition:transform 0.2s; }
        .btn-primary:hover:not(:disabled) .btn-arrow { transform:translateX(3px); }
        .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
        .error-banner { border-radius:16px; padding:1.25rem 1.5rem; margin-bottom:1.5rem; animation:slideDown 0.3s ease; border:1px solid rgba(248,113,113,0.25); background:rgba(248,113,113,0.08); }
        .banner-top { display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem; }
        .banner-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; color:var(--red); }
        .results { animation:slideDown 0.4s ease; margin-bottom:3rem; }
        .score-card { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:2rem; margin-bottom:1rem; display:flex; align-items:center; gap:2.5rem; }
        .score-ring-wrap { position:relative; flex-shrink:0; }
        .score-ring-wrap svg { transform:rotate(-90deg); }
        .score-ring-bg { fill:none; stroke:rgba(255,255,255,0.06); stroke-width:8; }
        .score-ring-fill { fill:none; stroke-width:8; stroke-linecap:round; transition:stroke-dashoffset 1s ease; }
        .score-number { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .score-num { font-family:'Syne',sans-serif; font-weight:800; font-size:2rem; line-height:1; }
        .score-max { font-size:0.7rem; color:var(--muted); }
        .score-info { flex:1; }
        .score-label { font-family:'Syne',sans-serif; font-weight:800; font-size:1.4rem; letter-spacing:-0.02em; margin-bottom:0.5rem; }
        .score-summary { font-size:0.9rem; color:var(--muted); line-height:1.6; font-weight:300; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
        .info-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:1.5rem; }
        .info-card-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.9rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem; }
        .info-item { display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.6rem; font-size:0.85rem; color:var(--muted); line-height:1.5; }
        .info-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:0.45rem; }
        .rewrites-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:1.5rem; margin-bottom:1rem; }
        .rewrites-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.9rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem; }
        .rewrite-item { margin-bottom:1.25rem; padding-bottom:1.25rem; border-bottom:1px solid var(--border); }
        .rewrite-item:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
        .rewrite-label { font-size:0.68rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0.35rem; }
        .rewrite-text { font-size:0.85rem; line-height:1.6; padding:0.75rem 1rem; border-radius:10px; margin-bottom:0.5rem; }
        .rewrite-before { background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.15); color:var(--muted); }
        .rewrite-after { background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.15); color:var(--text); }
        .features { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:5rem; animation:fadeUp 0.6s 0.45s ease both; }
        .feature-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:1.5rem; transition:border-color 0.25s,transform 0.25s; position:relative; overflow:hidden; }
        .feature-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,var(--accent),transparent); opacity:0; transition:opacity 0.3s; }
        .feature-card:hover { border-color:var(--border-hover); transform:translateY(-3px); }
        .feature-card:hover::before { opacity:1; }
        .feature-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; margin-bottom:1rem; }
        .feature-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; margin-bottom:0.4rem; }
        .feature-desc { font-size:0.82rem; color:var(--muted); line-height:1.6; font-weight:300; }
        .page-footer { text-align:center; padding:2rem 0 4rem; color:var(--muted); font-size:0.78rem; border-top:1px solid var(--border); }
        .page-footer a { color:var(--accent); text-decoration:none; }
        @media(max-width:680px) {
          .card-body{grid-template-columns:1fr;} .panel:first-child{border-right:none;border-bottom:1px solid var(--border);}
          .features{grid-template-columns:1fr;} .two-col{grid-template-columns:1fr;} .stats{gap:1.5rem;}
          .card-footer{flex-direction:column;align-items:stretch;} .btn-primary{justify-content:center;}
          .score-card{flex-direction:column;text-align:center;}
        }
      `}</style>

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
                  <div key={i} className="info-item">
                    <div className="info-dot" style={{ background: "var(--red)" }} />{g}
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
                </div>
              ))}
            </div>
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