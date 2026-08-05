import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { cardHoverVariants } from '@/lib/motion';
import './ui.css';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('ui-card', className)}
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        whileTap={{ scale: 0.985 } as any}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
