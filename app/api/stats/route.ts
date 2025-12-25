import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";

export async function GET() {
  console.log("📊 /api/stats endpoint called");
  try {
    const stats = getStats();
    console.log("✅ Returning stats:", stats);
    
    // Disable caching to ensure fresh data
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e: any) {
    console.error("❌ Error in /api/stats:", e.message);
    return NextResponse.json({
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageProcessingTime: 0,
      todayGenerations: 0,
      last24Hours: 0,
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

