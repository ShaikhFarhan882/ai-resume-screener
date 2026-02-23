import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Job description is too short. Please paste the full job description." },
        { status: 400 }
      );
    }

    const prompt = `You are an expert technical recruiter and career coach with 10+ years of experience.

Analyze the following resume against the job description and return a detailed evaluation.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid JSON object with exactly this structure, no markdown, no explanation, no code blocks:
{
  "score": <number 0-100>,
  "summary": "<2 sentence overview of the candidate's fit>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "rewrite_suggestions": [
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" },
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" },
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" }
  ]
}

Scoring guide:
- 80-100: Strong match, most requirements met
- 60-79: Good match, some gaps
- 40-59: Partial match, significant gaps
- 0-39: Weak match, major gaps

Be specific and actionable. Reference actual skills and keywords from the job description.`;

    // ── Call Gemini 2.5 Flash with x-goog-api-key header ──
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
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

    // Extract text from Gemini response
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 }
      );
    }

    // Strip markdown code blocks if present
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", cleaned);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate required fields
    if (
      typeof parsed.score !== "number" ||
      !parsed.summary ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.gaps) ||
      !Array.isArray(parsed.rewrite_suggestions)
    ) {
      return NextResponse.json(
        { error: "Invalid AI response format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      score: Math.min(100, Math.max(0, Math.round(parsed.score))),
      summary: parsed.summary,
      strengths: parsed.strengths.slice(0, 6),
      gaps: parsed.gaps.slice(0, 6),
      rewrite_suggestions: parsed.rewrite_suggestions.slice(0, 5),
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}