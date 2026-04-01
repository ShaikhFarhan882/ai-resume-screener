import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription, gaps, strengths } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    const prompt = `You are a senior technical interviewer and career coach with 15+ years of experience conducting interviews at top tech companies.

Based on the resume, job description, identified skill gaps, and strengths below, predict the most likely interview questions this candidate will face — and provide a strong sample answer strategy for each.

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

SKILL GAPS:
${(gaps ?? []).map((g: { issue: string }) => `- ${g.issue}`).join("\n")}

STRENGTHS:
${(strengths ?? []).map((s: string) => `- ${s}`).join("\n")}

Generate exactly 8 interview questions across these categories:
- 2 questions targeting the skill GAPS (hardest questions they will likely face)
- 2 behavioral questions based on their experience (STAR format)
- 2 technical questions specific to the role and their background
- 1 question about their strongest strength
- 1 culture fit / motivation question based on the company/role

For each question provide:
- The question itself
- Why the interviewer is asking it (their real intent)
- A concise answer strategy (2-3 sentences, not a full script)
- Difficulty: easy | medium | hard
- Category: gap | behavioral | technical | strength | culture

Return ONLY raw JSON. No markdown. No code fences. No backticks.

{"questions":[{"id":1,"question":"<question text>","intent":"<why interviewer asks this>","strategy":"<how to answer>","difficulty":"medium","category":"technical"},{"id":2,"question":"...","intent":"...","strategy":"...","difficulty":"hard","category":"gap"}]}`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
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

    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      console.error("No JSON found:", rawText.slice(0, 400));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }
    cleaned = cleaned.slice(start, end + 1);

    cleaned = cleaned.replace(
      /"((?:[^"\\]|\\.)*)"/gs,
      (_match: string, inner: string) => {
        const fixed = inner
          .replace(/\r\n/g, "\\n")
          .replace(/\r/g, "\\n")
          .replace(/\n/g, "\\n");
        return `"${fixed}"`;
      }
    );

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON.parse failed:", parseErr);
      console.error("Cleaned (first 600):", cleaned.slice(0, 600));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed.questions)) {
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions: parsed.questions.slice(0, 8),
    });
  } catch (err) {
    console.error("Interview questions error:", err);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}