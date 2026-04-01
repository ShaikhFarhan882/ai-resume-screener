import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resumeText,
      jobDescription,
      tone = "professional",
      userName = "",
      companyName = "",
      hiringManagerName = "",
    } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    const prompt = `You are an expert career coach writing a concise, tailored cover letter.

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

INSTRUCTIONS:
- Candidate name: ${userName || "extract from resume"}
- Company name: ${companyName || "extract from job description"}
- Hiring manager: ${hiringManagerName || "Hiring Manager"}
- Tone: ${tone}
- STRICT maximum: 250 words for the cover letter body
- 3 short paragraphs only
- No filler phrases like "I am writing to express my interest"
- Reference specific skills and keywords from both documents
- Start with a strong hook showing immediate value
- End with a confident call to action

Return ONLY raw JSON. No markdown. No code fences. No backticks. No explanation before or after.
Use \\n for paragraph breaks inside the cover_letter string value.

{"subject":"<subject line>","cover_letter":"<letter text using \\n for breaks>","key_points":["<point 1>","<point 2>","<point 3>"],"word_count":<number>}`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192, // ← was 2048, now matches your analyze route
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 }
      );
    }

    console.log("Raw Gemini cover letter response:", rawText.slice(0, 300));

    // ── Robust JSON extraction ────────────────────────────────────
    let cleaned = rawText.trim();

    // Strip ```json ... ``` or ``` ... ``` code fences if present
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/,  "")
      .trim();

    // Find the outermost { ... } boundaries
    const start = cleaned.indexOf("{");
    const end   = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("No JSON braces found. Raw text was:", rawText.slice(0, 800));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    cleaned = cleaned.slice(start, end + 1);

    // Fix any unescaped literal newlines inside JSON string values
    cleaned = cleaned.replace(
      /"((?:[^"\\]|\\.)*)"/gs,
      (_match: string, inner: string) => {
        const fixed = inner
          .replace(/\r\n/g, "\\n")
          .replace(/\r/g,   "\\n")
          .replace(/\n/g,   "\\n");
        return `"${fixed}"`;
      }
    );

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON.parse failed:", parseErr);
      console.error("Cleaned string (first 600 chars):", cleaned.slice(0, 600));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    if (!parsed.cover_letter || !parsed.subject) {
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subject:      parsed.subject,
      cover_letter: parsed.cover_letter,
      key_points:   (parsed.key_points ?? []).slice(0, 3),
      word_count:
        parsed.word_count ??
        parsed.cover_letter.split(/\s+/).filter(Boolean).length,
    });

  } catch (err) {
    console.error("Cover letter error:", err);
    return NextResponse.json(
      { error: "Cover letter generation failed. Please try again." },
      { status: 500 }
    );
  }
}