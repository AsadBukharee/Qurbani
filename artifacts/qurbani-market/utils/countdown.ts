export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

export function getTimeLeft(endTime: string): TimeLeft {
  const now = Date.now();
  const end = new Date(endTime).getTime();
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

export function formatTimeLeft(t: TimeLeft): string {
  if (t.isExpired) return "Ended";
  if (t.days > 0) return `${t.days}d ${t.hours}h ${t.minutes}m`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m ${t.seconds}s`;
  return `${t.minutes}m ${t.seconds}s`;
}

export function getUrgencyLevel(t: TimeLeft): "low" | "medium" | "high" | "critical" {
  if (t.isExpired) return "critical";
  if (t.totalSeconds < 60 * 60) return "critical";
  if (t.totalSeconds < 3 * 60 * 60) return "high";
  if (t.totalSeconds < 24 * 60 * 60) return "medium";
  return "low";
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
