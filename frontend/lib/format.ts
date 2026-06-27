// Date formatting and relative time utilities

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Format an ISO date string to a human-readable format.
 * Example: "Jun 27, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format an ISO date string to a short human-readable format.
 * Example: "Jun 27"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Return a relative time string for an ISO date.
 * Future dates: "in 7 days", "in 2 hours"
 * Past dates:   "3 hours ago", "5 minutes ago"
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffMs = target - now;
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let label: string;
  if (days > 0) {
    label = `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (hours > 0) {
    label = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (minutes > 0) {
    label = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else {
    label = 'just now';
    return label;
  }

  return isFuture ? `in ${label}` : `${label} ago`;
}
