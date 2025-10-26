/**
 * Calculate the number of working days between two dates (excluding weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Exclude Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Calculate the number of days between two dates (including weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of calendar days
 */
export function calculateCalendarDays(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
}

/**
 * Format a date for display in French format
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date-time for display in French format
 * @param date - Date to format
 * @returns Formatted date-time string
 */
export function formatDateTimeFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if a date is within a certain number of days from now
 * @param date - Date to check
 * @param days - Number of days
 * @returns True if date is within the specified number of days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const target = new Date();
  target.setDate(target.getDate() + days);
  return d <= target && d >= new Date();
}

/**
 * Get the first day of the current year
 * @returns First day of the year
 */
export function getFirstDayOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

/**
 * Get the last day of the current year
 * @returns Last day of the year
 */
export function getLastDayOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 11, 31);
}

/**
 * Add months to a date
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date with months added
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * Add years to a date
 * @param date - Starting date
 * @param years - Number of years to add
 * @returns New date with years added
 */
export function addYears(date: Date, years: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
}

/**
 * Get the quarter number for a given date
 * @param date - Date to check
 * @returns Quarter number (1-4)
 */
export function getQuarter(date: Date): number {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
}

/**
 * Format duration in a human-readable format (French)
 * @param days - Number of days
 * @returns Formatted duration string
 */
export function formatDuration(days: number): string {
  if (days < 0) {
    return 'Expiré';
  }

  if (days === 0) {
    return "Aujourd'hui";
  }

  if (days === 1) {
    return '1 jour';
  }

  if (days < 30) {
    return `${days} jours`;
  }

  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return months === 1 ? '1 mois' : `${months} mois`;
    }
    return `${months} mois ${remainingDays} jours`;
  }

  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) {
    return years === 1 ? '1 an' : `${years} ans`;
  }
  return `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois`;
}
