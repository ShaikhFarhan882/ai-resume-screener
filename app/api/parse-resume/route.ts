//simple node impl
// import { NextRequest, NextResponse } from "next/server";

// // Pure Node.js PDF text extractor — no external dependencies
// // Works by reading raw PDF byte streams directly
// function extractTextFromBuffer(buffer: Buffer): { text: string; pages: number } {
//   const raw = buffer.toString("binary");

//   // Count pages
//   const pageMatches = raw.match(/\/Type\s*\/Page[^s]/g);
//   const pages = pageMatches ? pageMatches.length : 1;

//   const textParts: string[] = [];

//   // Extract all BT...ET blocks (PDF text blocks)
//   const btEtRegex = /BT([\s\S]*?)ET/g;
//   let block;

//   while ((block = btEtRegex.exec(raw)) !== null) {
//     const content = block[1];

//     // Match (text) Tj — simple text show
//     const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
//     let tj;
//     while ((tj = tjRegex.exec(content)) !== null) {
//       textParts.push(tj[1]);
//     }

//     // Match [(text) spacing (text)] TJ — array text show
//     const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
//     let tja;
//     while ((tja = tjArrRegex.exec(content)) !== null) {
//       const inner = tja[1];
//       const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
//       let s;
//       while ((s = strRegex.exec(inner)) !== null) {
//         textParts.push(s[1]);
//       }
//     }
//   }

//   // Clean up PDF escape sequences
//   const text = textParts
//     .map((t) =>
//       t
//         .replace(/\\n/g, " ")
//         .replace(/\\r/g, " ")
//         .replace(/\\t/g, " ")
//         .replace(/\\\(/g, "(")
//         .replace(/\\\)/g, ")")
//         .replace(/\\\\/g, "\\")
//         .replace(/\\(\d{3})/g, (_, oct) =>
//           String.fromCharCode(parseInt(oct, 8))
//         )
//     )
//     .join(" ")
//     .replace(/\s+/g, " ")
//     .trim();

//   return { text, pages };
// }

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("resume") as File | null;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
//     }

//     if (file.type !== "application/pdf") {
//       return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
//     }

//     const MAX_SIZE = 5 * 1024 * 1024;
//     if (file.size > MAX_SIZE) {
//       return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Verify it's actually a PDF
//     const header = buffer.slice(0, 5).toString();
//     if (!header.startsWith("%PDF")) {
//       return NextResponse.json({ error: "Invalid PDF file." }, { status: 400 });
//     }

//     const { text, pages } = extractTextFromBuffer(buffer);

//     if (!text || text.length < 30) {
//       return NextResponse.json(
//         { error: "Could not extract text. May be a scanned or image-based PDF. Please use a text-based PDF." },
//         { status: 422 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       text,
//       pages,
//       wordCount: text.split(/\s+/).filter(Boolean).length,
//     });

//   } catch (err) {
//     console.error("PDF parse error:", err);
//     return NextResponse.json(
//       { error: "Failed to parse PDF. Please try a different file." },
//       { status: 500 }
//     );
//   }
// }

//pdf-parse impl

// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("resume") as File | null;

//     // ── Validation ──
//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
//     }

//     if (file.type !== "application/pdf") {
//       return NextResponse.json(
//         { error: "Only PDF files are supported." },
//         { status: 400 }
//       );
//     }

//     const MAX_SIZE = 5 * 1024 * 1024; // 5MB
//     if (file.size > MAX_SIZE) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 5MB." },
//         { status: 400 }
//       );
//     }

//     // ── Convert File → Buffer ──
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // ── Parse PDF ──
//     // pdf-parse 1.1.1 exports a single function directly
//     // eslint-disable-next-line @typescript-eslint/no-require-imports
//     const pdfParse = require("pdf-parse");
//     const data = await pdfParse(buffer);

//     const text = data.text?.trim() ?? "";

//     if (!text || text.length < 50) {
//       return NextResponse.json(
//         {
//           error:
//             "Could not extract text from this PDF. It may be a scanned or image-based PDF. Please use a text-based PDF.",
//         },
//         { status: 422 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       text,
//       pages: data.numpages ?? 1,
//       wordCount: text.split(/\s+/).filter(Boolean).length,
//     });

//   } catch (err) {
//     console.error("PDF parse error:", err);
//     return NextResponse.json(
//       { error: "Failed to parse PDF. Please try a different file." },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    // ── Validation ──
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // ── Convert File → Buffer ──
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Parse PDF ──
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");

    const data = await pdfParse(buffer, {
      // Extract ALL pages — default is only first page
      max: 0,
      // Preserve full text layout
      pagerender: (pageData: {
        getTextContent: () => Promise<{
          items: { str: string; hasEOL?: boolean }[];
        }>;
      }) => {
        return pageData.getTextContent().then((textContent) => {
          let text = "";
          let lastY = -1;

          for (const item of textContent.items as {
            str: string;
            transform: number[];
            hasEOL?: boolean;
          }[]) {
            const y = item.transform[5];
            // Add newline when y position changes (new line in PDF)
            if (lastY !== -1 && Math.abs(lastY - y) > 5) {
              text += "\n";
            }
            text += item.str;
            if (item.hasEOL) text += "\n";
            lastY = y;
          }
          return text;
        });
      },
    });

    const text = data.text?.trim() ?? "";

    if (!text || text.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. It may be a scanned or image-based PDF. Please use a text-based PDF.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text,
      pages: data.numpages ?? 1,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });

  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. Please try a different file." },
      { status: 500 }
    );
  }
}