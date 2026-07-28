import { cn } from '@/utils/cn';
import './ui.css';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = ({ className, size = 'md' }: SpinnerProps) => {
  return (
    <div 
      className={cn('spinner', `spinner-${size}`, className)} 
      role="status" 
      aria-busy="true" 
    />
  );
};
