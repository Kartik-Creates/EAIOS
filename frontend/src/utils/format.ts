/**
 * Presentation logic for formatting data in the UI (e.g. Dates, Decimals).
 */

/**
 * Formats a backend ISO datetime string or JS Date into a human-readable format.
 * e.g., "Oct 25, 2024, 4:30 PM"
 * 
 * @param dateInput - string ISO date from backend or JS Date object
 * @returns formatted date string
 */
export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formats a float score (typically 0.0 to 1.0) into a percentage representation.
 * e.g., 0.825 -> "83%"
 * 
 * @param score - float number representing confidence score
 * @returns formatted percentage string
 */
export const formatConfidenceScore = (score: number | undefined | null): string => {
  if (score === null || score === undefined || isNaN(score)) {
    return '0%';
  }
  
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
};
