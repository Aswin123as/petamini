export type Season = 'christmas' | 'newyear' | 'halloween' | 'diwali' | 'none';

// Determine approximate season using date ranges. You can extend with more accurate rules (e.g., lunar calendars).
export function getSeason(override?: string, now = new Date()): Season {
  if (override) {
    const o = override.toLowerCase();
    if (
      o === 'christmas' ||
      o === 'newyear' ||
      o === 'halloween' ||
      o === 'diwali'
    ) {
      return o as Season;
    }
  }

  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Christmas: Dec 15 - Jan 5
  if ((month === 12 && day >= 15) || (month === 1 && day <= 5)) {
    return 'christmas';
  }

  // New Year: Dec 31 - Jan 2
  if ((month === 12 && day === 31) || (month === 1 && day <= 2)) {
    return 'newyear';
  }

  // Halloween: Oct 29 - Oct 31
  if (month === 10 && day >= 29 && day <= 31) {
    return 'halloween';
  }

  // Diwali (approximate): Oct 15 - Nov 15 (simplified)
  if ((month === 10 && day >= 15) || (month === 11 && day <= 15)) {
    return 'diwali';
  }

  return 'none';
}
