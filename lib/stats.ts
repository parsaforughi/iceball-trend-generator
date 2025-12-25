// Stats management for Iceball Trend Generator
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STATS_FILE = join(process.cwd(), ".next", "stats.json");

interface StatsData {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageProcessingTime: number;
  todayGenerations: number;
  last24Hours: number;
  processingTimes: number[];
  lastReset?: string;
}

function loadStats(): StatsData {
  try {
    if (existsSync(STATS_FILE)) {
      const data = readFileSync(STATS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to load stats from file:", e);
  }

  return {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    averageProcessingTime: 0,
    todayGenerations: 0,
    last24Hours: 0,
    processingTimes: [],
  };
}

function saveStats(stats: StatsData) {
  try {
    // Ensure .next directory exists
    const { mkdirSync } = require("fs");
    const { dirname } = require("path");
    mkdirSync(dirname(STATS_FILE), { recursive: true });
    
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save stats to file:", e);
  }
}

function resetDailyIfNeeded(stats: StatsData) {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  
  if (stats.lastReset !== today) {
    stats.todayGenerations = 0;
    stats.lastReset = today;
  }
}

export function getStats(): StatsData {
  const stats = loadStats();
  
  // Reset daily counts if needed
  resetDailyIfNeeded(stats);
  
  // Calculate average processing time
  if (stats.processingTimes.length > 0) {
    stats.averageProcessingTime = 
      stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length;
  }

  return {
    totalGenerations: stats.totalGenerations,
    successfulGenerations: stats.successfulGenerations,
    failedGenerations: stats.failedGenerations,
    averageProcessingTime: stats.averageProcessingTime,
    todayGenerations: stats.todayGenerations,
    last24Hours: stats.last24Hours,
  };
}

export function updateStats(success: boolean, processingTime: number) {
  const stats = loadStats();
  
  // Reset daily if needed
  resetDailyIfNeeded(stats);
  
  stats.totalGenerations++;
  if (success) {
    stats.successfulGenerations++;
  } else {
    stats.failedGenerations++;
  }
  
  stats.processingTimes.push(processingTime);
  // Keep only last 100 processing times
  if (stats.processingTimes.length > 100) {
    stats.processingTimes.shift();
  }
  
  // Update today's count
  stats.todayGenerations++;
  stats.last24Hours++;
  
  // Update last reset date if not set
  if (!stats.lastReset) {
    const today = new Date().toISOString().split("T")[0];
    stats.lastReset = today;
  }
  
  saveStats(stats);
}
