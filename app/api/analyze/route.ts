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

    const prompt = `You are an expert technical recruiter and career coach with 10+ years of experience, also specialized in ATS (Applicant Tracking System) optimization.

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
  "gaps": [
    { "issue": "<gap 1>", "fix": "<specific actionable advice to fix this gap>" },
    { "issue": "<gap 2>", "fix": "<specific actionable advice to fix this gap>" },
    { "issue": "<gap 3>", "fix": "<specific actionable advice to fix this gap>" }
  ],
  "rewrite_suggestions": [
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" },
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" },
    { "original": "<original bullet from resume>", "improved": "<improved version tailored to JD>" }
  ],
  "ats": {
    "ats_score": <number 0-100, overall ATS compatibility score>,
    "keywords": {
      "found": ["<keyword found in both resume and JD>", "<keyword 2>", "<keyword 3>"],
      "missing": ["<important JD keyword missing from resume>", "<keyword 2>", "<keyword 3>"]
    },
    "formatting_warnings": [
      "<warning about tables, columns, headers, graphics, or other ATS-unfriendly formatting detected>",
      "<warning 2 if applicable>"
    ],
    "sections": {
      "contact": <true if contact info section detected>,
      "summary": <true if professional summary/objective detected>,
      "experience": <true if work experience section detected>,
      "education": <true if education section detected>,
      "skills": <true if skills section detected>,
      "certifications": <true if certifications section detected>
    },
    "ats_tips": [
      "<specific actionable tip to improve ATS score>",
      "<tip 2>",
      "<tip 3>"
    ]
  }
}

Scoring guide for main score:
- 80-100: Strong match, most requirements met
- 60-79: Good match, some gaps
- 40-59: Partial match, significant gaps
- 0-39: Weak match, major gaps

ATS score guide:
- 80-100: Well optimized for ATS parsing
- 60-79: Mostly compatible, minor issues
- 40-59: Several ATS issues that may cause filtering
- 0-39: Major ATS problems, likely to be filtered out

For formatting_warnings: look for indicators in the text like unusual characters, garbled text, missing spaces between words (which suggests columns/tables), or very sparse text (which suggests graphics/images). Return an empty array [] if no formatting issues detected.

Be specific and actionable. Reference actual skills and keywords from the job description.`;

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
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 500 }
      );
    }

    // Extract JSON — handle markdown code blocks and any surrounding text
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    let cleaned: string;
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    } else {
      // Find the outermost { ... } block using first { and last }
      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      cleaned = start !== -1 && end !== -1
        ? rawText.slice(start, end + 1).trim()
        : rawText.trim();
    }

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

    // Build ATS object with fallbacks
    const ats = parsed.ats ?? {};

    return NextResponse.json({
      success: true,
      score: Math.min(100, Math.max(0, Math.round(parsed.score))),
      summary: parsed.summary,
      strengths: parsed.strengths.slice(0, 6),
      gaps: parsed.gaps.slice(0, 6),
      rewrite_suggestions: parsed.rewrite_suggestions.slice(0, 5),
      ats: {
        ats_score: Math.min(100, Math.max(0, Math.round(ats.ats_score ?? 0))),
        keywords: {
          found: (ats.keywords?.found ?? []).slice(0, 12),
          missing: (ats.keywords?.missing ?? []).slice(0, 12),
        },
        formatting_warnings: (ats.formatting_warnings ?? []).slice(0, 5),
        sections: {
          contact: ats.sections?.contact ?? false,
          summary: ats.sections?.summary ?? false,
          experience: ats.sections?.experience ?? false,
          education: ats.sections?.education ?? false,
          skills: ats.sections?.skills ?? false,
          certifications: ats.sections?.certifications ?? false,
        },
        ats_tips: (ats.ats_tips ?? []).slice(0, 5),
      },
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}