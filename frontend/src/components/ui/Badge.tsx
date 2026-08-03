import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { pulseOnceVariants } from '@/lib/motion';
import './ui.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'purple' | 'green' | 'slate' | 'red' | 'yellow';
  pulse?: boolean;
}

export const Badge = ({ className, variant = 'slate', children, pulse = false }: BadgeProps) => {
  return (
    <motion.span
      className={cn('badge', `badge-${variant}`, className)}
      variants={pulse ? pulseOnceVariants : undefined}
      initial={pulse ? 'initial' : undefined}
      animate={pulse ? 'animate' : undefined}
    >
      {children}
    </motion.span>
  );
};
