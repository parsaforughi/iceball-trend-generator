// Generations tracking for Iceball Trend Generator

export interface Generation {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  processingTime?: number;
  error?: string;
}

let generations: Generation[] = [];

export function getGenerations(limit: number = 50): Generation[] {
  // Return recent generations, sorted by createdAt descending
  return generations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

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

export function updateGeneration(id: string, status: "pending" | "processing" | "completed" | "failed", processingTime?: number, error?: string) {
  const gen = generations.find(g => g.id === id);
  if (gen) {
    gen.status = status;
    if (processingTime !== undefined) gen.processingTime = processingTime;
    if (error !== undefined) gen.error = error;
  }
}

