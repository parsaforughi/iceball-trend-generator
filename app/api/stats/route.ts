import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";

export async function GET() {
  console.log("📊 /api/stats endpoint called");
  try {
    const stats = getStats();
    console.log("✅ Returning stats:", stats);
    return NextResponse.json(stats);
  } catch (e: any) {
    console.error("❌ Error in /api/stats:", e.message);
    return NextResponse.json({
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageProcessingTime: 0,
      todayGenerations: 0,
      last24Hours: 0,
    }, { status: 500 });
  }
}

