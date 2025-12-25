// Generations tracking for Iceball Trend Generator
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Use a persistent directory that exists in production
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const GENERATIONS_FILE = join(DATA_DIR, "generations.json");

export interface Generation {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  processingTime?: number;
  error?: string;
}

function loadGenerations(): Generation[] {
  try {
    if (existsSync(GENERATIONS_FILE)) {
      const data = readFileSync(GENERATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to load generations from file:", e);
  }

  return [];
}

function saveGenerations(generations: Generation[]) {
  try {
    // Ensure data directory exists
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
    
    writeFileSync(GENERATIONS_FILE, JSON.stringify(generations, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save generations to file:", e);
  }
}

export function getGenerations(limit: number = 50): Generation[] {
  const generations = loadGenerations();
  
  // Return recent generations, sorted by createdAt descending
  return generations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function addGeneration(id: string, status: "pending" | "processing" | "completed" | "failed", processingTime?: number, error?: string) {
  const generations = loadGenerations();
  
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
  
  saveGenerations(generations);
}

export function updateGeneration(id: string, status: "pending" | "processing" | "completed" | "failed", processingTime?: number, error?: string) {
  const generations = loadGenerations();
  
  const gen = generations.find(g => g.id === id);
  if (gen) {
    gen.status = status;
    if (processingTime !== undefined) gen.processingTime = processingTime;
    if (error !== undefined) gen.error = error;
    
    saveGenerations(generations);
  }
}
