"use client";
import { useState } from "react";
import "./faq.css";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  label: string;
  icon: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    label: "About the Product",
    icon: "🧠",
    items: [
      {
        question: "What is ResumeAI and how does it work?",
        answer:
          "Upload your resume PDF, paste a job description, and our AI analyzes the match using keyword detection, ATS compatibility checks, and recruiter-style evaluation. You get a match score, skill gap breakdown, ATS report, and rewrite suggestions — all in under 10 seconds.",
      },
      {
        question: "Is my resume data stored or shared?",
        answer:
          "No. Your resume and job description are processed in real time and never saved to any database or server. Once the analysis is complete, the data is gone. We take your privacy seriously.",
      },
      {
        question: "What AI model powers this?",
        answer:
          "ResumeAI uses Google's Gemini 2.5 Flash — one of the most capable and fast AI models available today, fine-tuned with recruiter-level prompting to give you actionable, specific feedback.",
      },
    ],
  },
  {
    label: "Understanding Your Scores",
    icon: "🎯",
    items: [
      {
        question: "What does the Match Score mean?",
        answer:
          "It's a 0–100 rating of how well your resume aligns with the specific job description you provided. 80+ is a strong match, 60–79 is good with minor gaps, 40–59 has significant gaps, and below 40 is a weak match. The score reflects your resume's wording and keywords, not your actual ability.",
      },
      {
        question: "What is an ATS score?",
        answer:
          "ATS stands for Applicant Tracking System — software that most companies use to automatically filter resumes before a human ever sees them. Your ATS score shows how likely your resume is to pass that automated filter, based on keyword presence, formatting compatibility, and section structure.",
      },
      {
        question: "Why is my score low even though I'm qualified?",
        answer:
          "The score reflects how your resume is written, not your actual ability. ATS systems and early-stage screening are purely pattern-matching — they look for specific words and structure. That's exactly why the rewrite suggestions exist: to help your resume reflect your real qualifications in the language hiring systems understand.",
      },
    ],
  },
  {
    label: "Using the Tool",
    icon: "🔧",
    items: [
      {
        question: "What file types are supported?",
        answer:
          "PDF only, up to 5MB. Make sure it's a text-based PDF — not a scanned image. If you created your resume in Word, Google Docs, or Notion, export it as a fresh PDF and it should work perfectly.",
      },
      {
        question: "Why does my PDF say it can't extract text?",
        answer:
          "Your resume is likely a scanned image or was saved as a flattened/image PDF. Try re-exporting it directly from Word, Google Docs, or Notion. If you received a PDF from someone else, ask for the original editable version and re-export it yourself.",
      },
      {
        question: "How detailed should the job description be?",
        answer:
          "The more complete, the better. Include the full responsibilities, requirements, and any skills or tools mentioned. A one-liner will give you a much weaker analysis. Copy the entire JD from the job posting for best results.",
      },
      {
        question: "Can I scan the same resume against multiple job descriptions?",
        answer:
          'Yes! Hit "Scan Another Resume" after any analysis and paste a different JD. Each analysis is completely independent, so you can compare how your resume performs across different roles.',
      },
    ],
  },
  {
    label: "Results & Next Steps",
    icon: "✍️",
    items: [
      {
        question: "How do I use the rewrite suggestions?",
        answer:
          'Click the "Copy" button next to any improved bullet point and paste it directly into your resume. The rewrites are written to match the specific language and keywords of the JD you provided — so they\'re most effective when used for that exact role.',
      },
      {
        question: "Should I apply every rewrite suggestion?",
        answer:
          "Use your judgment. The suggestions are tailored to the JD but you should make sure they still accurately reflect your actual experience. Never add skills or experiences you don't have — the goal is better representation, not fabrication.",
      },
      {
        question: "Can I download my results?",
        answer:
          'Yes — hit "Download Report PDF" after your analysis to get a full formatted report including your match score, ATS score, strengths, skill gaps with fixes, and all rewrite suggestions. Great for keeping track of applications.',
      },
    ],
  },
  {
    label: "Trust & Privacy",
    icon: "🔒",
    items: [
      {
        question: "Is this tool free?",
        answer:
          "Yes, ResumeAI is completely free during our beta period. We may introduce a Pro tier in the future with advanced features, but the core analysis will remain accessible.",
      },
      {
        question: "How accurate is the analysis?",
        answer:
          "It's a strong signal, not a guarantee. The analysis reflects how an ATS and a pattern-matching recruiter would evaluate your resume on paper. Human recruiters may weigh experience, culture fit, and other factors differently. Use it as a powerful optimization tool, not the final word.",
      },
      {
        question: "Does ResumeAI work for all industries?",
        answer:
          "Yes — the AI adapts to whatever job description you provide, whether it's software engineering, marketing, finance, healthcare, or creative roles. The more specific the JD, the more targeted and useful the analysis will be.",
      },
    ],
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <section className="faq-section">
      {/* Header */}
      <div className="faq-header">
        <div className="faq-label">
          <div className="faq-label-dot" />
          FAQ
        </div>
        <h2 className="faq-title">
          Got questions?<br />
          <span className="faq-title-accent">We've got answers.</span>
        </h2>
        <p className="faq-desc">
          Everything you need to know about ResumeAI — how it works, what the scores mean, and how to get the most out of it.
        </p>
      </div>

      {/* Category tabs */}
      <div className="faq-tabs">
        {FAQ_DATA.map((cat, i) => (
          <button
            key={i}
            className={`faq-tab ${activeCategory === i ? "faq-tab-active" : ""}`}
            onClick={() => { setActiveCategory(i); setOpenIndex(null); }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="faq-list">
        {FAQ_DATA[activeCategory].items.map((item, i) => {
          const id = `${activeCategory}-${i}`;
          const isOpen = openIndex === id;
          return (
            <div
              key={id}
              className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
              onClick={() => toggle(id)}
            >
              <div className="faq-question">
                <span className="faq-q-text">{item.question}</span>
                <span className={`faq-chevron ${isOpen ? "faq-chevron-open" : ""}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className={`faq-answer-wrap ${isOpen ? "faq-answer-open" : ""}`}>
                <div className="faq-answer">{item.answer}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="faq-cta">
        <span className="faq-cta-text">Still have questions?</span>
        <a href="mailto:hello@resumeai.com" className="faq-cta-link">
          Reach out →
        </a>
      </div>
    </section>
  );
}