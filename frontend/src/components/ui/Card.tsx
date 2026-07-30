import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import './ui.css';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('ui-card', className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
