/**
 * Countdown / timestamp utilities for auction timers.
 */

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

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
 * Returns a TimeLeft object with days/hours/minutes/seconds broken down.
 */
export function getTimeLeft(endIso: string): TimeLeft {
  const now = Date.now();
  const end = new Date(endIso).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false };
}

/**
 * Returns an urgency level based on how much time is left.
 *   critical  < 1 hour
 *   high      < 6 hours
 *   medium    < 24 hours
 *   low       >= 24 hours
 */
export function getUrgencyLevel(timeLeft: TimeLeft): UrgencyLevel {
  if (timeLeft.isExpired) return "critical";
  const { totalSeconds } = timeLeft;
  if (totalSeconds < 3600) return "critical";
  if (totalSeconds < 6 * 3600) return "high";
  if (totalSeconds < 24 * 3600) return "medium";
  return "low";
}
