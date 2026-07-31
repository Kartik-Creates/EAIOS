import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to conditionally merge class names.
 * Since we are using Vanilla CSS, we purely rely on `clsx`
 * to conditionally apply classes based on component state.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
