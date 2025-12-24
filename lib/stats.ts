// Stats management for Iceball Trend Generator

let stats = {
  totalGenerations: 0,
  successfulGenerations: 0,
  failedGenerations: 0,
  averageProcessingTime: 0,
  todayGenerations: 0,
  last24Hours: 0,
  processingTimes: [] as number[],
};

export function getStats() {
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
  
  // Update today's count (simple implementation - reset at midnight)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // For simplicity, we'll just increment todayGenerations
  // In production, track by date
  stats.todayGenerations++;
  stats.last24Hours++;
  
  // Reset last24Hours if needed (simple: reset every 24 hours)
  // In production, use proper date tracking
}

