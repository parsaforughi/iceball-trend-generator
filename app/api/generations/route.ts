import { NextResponse } from "next/server";
import { getGenerations } from "@/lib/generations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const generations = getGenerations(limit);
  return NextResponse.json(generations);
}

