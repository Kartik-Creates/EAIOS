import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = ({ className, size = 'md' }: SpinnerProps) => {
  return (
    <motion.div 
      className={cn('spinner', `spinner-${size}`, className)} 
      role="status" 
      aria-busy="true"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    />
  );
};
