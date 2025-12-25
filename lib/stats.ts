// Stats management for Iceball Trend Generator
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Use a persistent directory that exists in production
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const STATS_FILE = join(DATA_DIR, "stats.json");

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
      const stats = JSON.parse(data);
      
      // Only initialize to 5000+ if file exists but is empty/corrupted
      // Don't reset if stats already exist (even if < 5000)
      if (!stats.totalGenerations && stats.totalGenerations !== 0) {
        // File exists but stats are invalid, initialize
        const initialStats = {
          totalGenerations: 5000 + Math.floor(Math.random() * 1000), // 5000-6000
          successfulGenerations: Math.floor((5000 + Math.floor(Math.random() * 1000)) * 0.95),
          failedGenerations: 0,
          averageProcessingTime: 0,
          todayGenerations: Math.floor(Math.random() * 50) + 20, // 20-70
          last24Hours: Math.floor(Math.random() * 100) + 50, // 50-150
          processingTimes: [],
        };
        initialStats.failedGenerations = initialStats.totalGenerations - initialStats.successfulGenerations;
        saveStats(initialStats);
        return initialStats;
      }
      
      // Ensure successfulGenerations doesn't exceed totalGenerations
      if (stats.successfulGenerations > stats.totalGenerations) {
        stats.successfulGenerations = stats.totalGenerations;
        stats.failedGenerations = 0;
        saveStats(stats);
      }
      
      // Ensure failedGenerations is correct
      const expectedFailed = stats.totalGenerations - stats.successfulGenerations;
      if (stats.failedGenerations !== expectedFailed) {
        stats.failedGenerations = expectedFailed;
        saveStats(stats);
      }
      
      return stats;
    }
  } catch (e) {
    console.warn("Failed to load stats from file:", e);
  }

  // Initialize with minimum values only if file doesn't exist
  const initialStats = {
    totalGenerations: 5000 + Math.floor(Math.random() * 1000), // 5000-6000
    successfulGenerations: Math.floor((5000 + Math.floor(Math.random() * 1000)) * 0.95),
    failedGenerations: 0,
    averageProcessingTime: 0,
    todayGenerations: Math.floor(Math.random() * 50) + 20, // 20-70
    last24Hours: Math.floor(Math.random() * 100) + 50, // 50-150
    processingTimes: [],
  };
  
  initialStats.failedGenerations = initialStats.totalGenerations - initialStats.successfulGenerations;
  
  // Save initial stats
  saveStats(initialStats);
  
  return initialStats;
}

function saveStats(stats: StatsData) {
  try {
    // Ensure data directory exists
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
    
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
    console.log("✅ Stats saved:", { total: stats.totalGenerations, success: stats.successfulGenerations });
  } catch (e: any) {
    console.error("❌ Failed to save stats to file:", e.message);
    console.error("Path:", STATS_FILE, "Data dir:", DATA_DIR);
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

export interface StatsResponse {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageProcessingTime: number;
  todayGenerations: number;
  last24Hours: number;
}

export function getStats(): StatsResponse {
  const stats = loadStats();
  
  // Reset daily counts if needed
  resetDailyIfNeeded(stats);
  
  // Calculate average processing time
  if (stats.processingTimes.length > 0) {
    stats.averageProcessingTime = 
      stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length;
  }

  const response = {
    totalGenerations: stats.totalGenerations,
    successfulGenerations: stats.successfulGenerations,
    failedGenerations: stats.failedGenerations,
    averageProcessingTime: stats.averageProcessingTime,
    todayGenerations: stats.todayGenerations,
    last24Hours: stats.last24Hours,
  };
  
  console.log("📤 getStats returning:", response);
  return response;
}

export function updateStats(success: boolean, processingTime: number) {
  console.log("🔄 updateStats called", { success, processingTime });
  const stats = loadStats();
  const oldTotal = stats.totalGenerations;
  const oldSuccess = stats.successfulGenerations;
  
  // Reset daily if needed
  resetDailyIfNeeded(stats);
  
  // Increment total first
  stats.totalGenerations++;
  
  // Then update success/failure
  if (success) {
    stats.successfulGenerations++;
  } else {
    stats.failedGenerations++;
  }
  
  // Ensure consistency
  stats.failedGenerations = stats.totalGenerations - stats.successfulGenerations;
  
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
  
  console.log("📊 Stats update:", { 
    oldTotal, 
    newTotal: stats.totalGenerations, 
    oldSuccess,
    newSuccess: stats.successfulGenerations,
    failed: stats.failedGenerations 
  });
  saveStats(stats);
}
