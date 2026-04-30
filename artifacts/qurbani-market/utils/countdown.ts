/**
 * Countdown / timestamp utilities for auction timers.
 */

/**
 * Format a UTC ISO timestamp into a human-readable local string.
 */
export function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString();
  } catch {
    return isoString;
  }
}

/**
 * Returns a human-readable string for the time remaining until `endIso`.
 * Returns "Ended" if the auction is over.
 */
export function getTimeLeft(endIso: string): string {
  const now = Date.now();
  const end = new Date(endIso).getTime();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
