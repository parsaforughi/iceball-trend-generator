import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------------------- PROMPT ------------------------

const PROMPT = `
Create a vertical 9:16 cinematic composite of the user (identity must remain EXACT as in the uploaded face image). 
The final portrait must be divided into **three vertically stacked frames**:

TOP FRAME:
- Extreme close-up of the user's eye and cheek  
- Small snowflakes resting on eyelashes  
- Soft overcast daylight creating natural winter glow  

MIDDLE FRAME:
- 3/4 profile of the user  
- User is gently using the Ice Ball skincare applicator on their cheek  
- The Ice Ball must be **small and realistic**, human-scale, about the size of a golf ball  
- White handle + frosted pink translucent sphere  
- Subtle snowlight reflection  
- No distortion, no oversized effect, no magical glow  
- Should look like a natural skincare product in real use  

BOTTOM FRAME:
- Chest-up portrait of the user facing the camera  
- User holding the Ice Ball close to the face  
- Calm, emotional winter mood  
- Gentle falling snow, shallow depth of field  

LIGHTING & STYLE:
- Soft overcast daylight  
- Cinematic HDR tone  
- Shallow depth (Canon EOS R5, 85mm f/1.2 aesthetic)  
- Photorealistic  
- Fine skin texture  
- Visible snow particles  
- Korean winter skincare campaign aesthetic  

OUTFIT:
- Black wool coat  
- Thick white scarf  
- Hair neatly tucked  
- No hat  

ENVIRONMENT:
- Snowy background with soft focus  
- Luxurious and emotional winter mood  

PRODUCT RULES:
- Use the Ice Ball reference image ONLY for accurate shape, material, and reflection  
- Product must appear premium and elegantly integrated  
- Absolutely DO NOT enlarge, distort, warp, or glow the Ice Ball  
`;

// -------------------- MAIN ROUTE ----------------------

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log("🔵 /api/generate called");

    // Add generation to tracking
    try {
      const { addGeneration } = await import("@/lib/generations");
      addGeneration(generationId, "processing");
    } catch (e) {
      console.warn("Failed to track generation:", e);
    }

    const form = await req.formData();
    const userFile = form.get("image");

    if (!(userFile instanceof File)) {
      return NextResponse.json(
        { error: "No user image file" },
        { status: 400 }
      );
    }

    // ---------------- ENV CHECK ----------------

    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error("❌ Missing env vars");
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY or NEXT_PUBLIC_BASE_URL" },
        { status: 500 }
      );
    }

    console.log("🔑 API key OK, length:", apiKey.length);

    // ---------------- USER IMAGE ----------------

    const userMime = userFile.type || "image/png";
    const userBase64 = Buffer.from(await userFile.arrayBuffer()).toString("base64");

    // ---------------- ICEBALL REF ----------------

    const refURL = `${baseUrl}/iceball_ref.PNG`;
    console.log("🧊 Loading IceBall ref:", refURL);

    const refRes = await fetch(refURL);
    if (!refRes.ok) {
      return NextResponse.json(
        { error: "Cannot load IceBall reference file" },
        { status: 500 }
      );
    }

    const refBase64 = Buffer.from(await refRes.arrayBuffer()).toString("base64");

    // ---------------- GEMINI REQUEST ----------------

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" +
      `?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: userMime, data: userBase64 } },
            { inlineData: { mimeType: "image/png", data: refBase64 } }
          ]
        }
      ]
    };

    console.log("📡 Sending to Gemini…");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    console.log("📥 Gemini RAW:", raw.slice(0, 300));

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gemini error", details: raw },
        { status: 500 }
      );
    }

    const json = JSON.parse(raw);

    // ------------- Extract Base64 Output -------------

    let base64Out = null;

    for (const cand of json.candidates || []) {
      for (const part of cand.content?.parts || []) {
        if (part.inlineData?.data) base64Out = part.inlineData.data;
      }
    }

    if (!base64Out) {
      return NextResponse.json(
        { error: "No image returned by Gemini" },
        { status: 500 }
      );
    }

    const outputBuffer = Buffer.from(base64Out, "base64");

    // Update stats and generation tracking
    const processingTime = (Date.now() - startTime) / 1000; // in seconds
    console.log("📊 Updating stats after successful generation", { processingTime, generationId });
    try {
      const { updateStats } = await import("@/lib/stats");
      updateStats(true, processingTime);
      console.log("✅ Stats updated successfully");
      
      const { updateGeneration } = await import("@/lib/generations");
      updateGeneration(generationId, "completed", processingTime);
      console.log("✅ Generation tracked successfully");
    } catch (e: any) {
      // Stats update failed, but generation succeeded
      console.error("❌ Failed to update stats:", e.message, e.stack);
    }

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      }
    });
  } catch (err: any) {
    console.error("🔥 API ERROR:", err);
    
    // Update stats for failure
    const processingTime = startTime ? (Date.now() - startTime) / 1000 : 0;
    try {
      const { updateStats } = await import("@/lib/stats");
      updateStats(false, processingTime);
      
      const { updateGeneration } = await import("@/lib/generations");
      updateGeneration(generationId, "failed", processingTime, String(err));
    } catch (e) {
      // Stats update failed
    }
    
    return NextResponse.json(
      { error: "Server crashed", details: String(err) },
      { status: 500 }
    );
  }
}