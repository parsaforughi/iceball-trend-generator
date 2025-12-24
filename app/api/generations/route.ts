import { NextResponse } from "next/server";

// In-memory generations store (in production, use a database)
let generations: Array<{
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  processingTime?: number;
  error?: string;
}> = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  // Return recent generations, sorted by createdAt descending
  const sorted = generations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json(sorted);
}

// Export function to add generation (called from generate route)
export function addGeneration(id: string, status: "pending" | "processing" | "completed" | "failed", processingTime?: number, error?: string) {
  generations.push({
    id,
    status,
    createdAt: new Date().toISOString(),
    processingTime,
    error,
  });

  // Keep only last 1000 generations
  if (generations.length > 1000) {
    generations.shift();
  }
}

// Export function to update generation status
export function updateGeneration(id: string, status: "pending" | "processing" | "completed" | "failed", processingTime?: number, error?: string) {
  const gen = generations.find(g => g.id === id);
  if (gen) {
    gen.status = status;
    if (processingTime !== undefined) gen.processingTime = processingTime;
    if (error !== undefined) gen.error = error;
  }
}

