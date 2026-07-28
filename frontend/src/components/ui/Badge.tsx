import { cn } from '@/utils/cn';
import './ui.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'purple' | 'green' | 'slate' | 'red' | 'yellow';
}

export const Badge = ({ className, variant = 'slate', children, ...props }: BadgeProps) => {
  return (
    <span className={cn('badge', `badge-${variant}`, className)} {...props}>
      {children}
    </span>
  );
};
