import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const systemPrompt = `
You are an advanced image editor.

Your output MUST be exactly ONE image.
Return it ONLY as inlineData (image/png).
Do NOT return text. Do NOT speak. ONLY return an edited image.

TASK:
- Take the user face photo (first image)
- Preserve identity and face shape 100%
- Apply Korean winter skincare aesthetic
- Soft cold light, light snowfall
- Subtle frost reflections inspired by IceBall (second image)
- Photorealistic, cinematic HDR
- Vertical 9:16 portrait
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userFile = formData.get("image");

    if (!(userFile instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!apiKey) {
      console.error("GEMINI_API_KEY missing in environment");
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    console.log("GEMINI_API_KEY length:", apiKey.length);
    console.log("GEMINI_API_KEY prefix:", apiKey.slice(0, 6));

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      );
    }

    const userMime = userFile.type || "image/png";
    const userBase64 = Buffer.from(await userFile.arrayBuffer()).toString("base64");

    const refUrl = `${baseUrl}/iceball_ref.PNG`;
    const refRes = await fetch(refUrl);

    if (!refRes.ok) {
      return NextResponse.json(
        { error: "Failed to load IceBall reference image" },
        { status: 500 }
      );
    }

    const refBase64 = Buffer.from(await refRes.arrayBuffer()).toString("base64");

    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                { inlineData: { mimeType: userMime, data: userBase64 } },
                { inlineData: { mimeType: "image/png", data: refBase64 } },
              ],
            },
          ],
        }),
      }
    );

    const raw = await gRes.json();

    console.log("Gemini RAW:", JSON.stringify(raw, null, 2));

    const base64Out =
      raw?.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.data
      )?.inlineData?.data;

    if (!base64Out) {
      return NextResponse.json(
        { error: "Gemini returned no image", raw },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(base64Out, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("❌ /api/generate error:", err);
    return NextResponse.json(
      { error: "Server crash", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
