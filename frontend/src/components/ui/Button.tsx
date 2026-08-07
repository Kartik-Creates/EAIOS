import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';
import { buttonTapVariants } from '@/lib/motion';
import './ui.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, type, onClick }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          isDisabled && 'btn-disabled',
          className
        )}
        variants={buttonTapVariants}
        initial="rest"
        whileHover={isDisabled ? 'disabled' : 'hover'}
        whileTap={isDisabled ? 'disabled' : 'tap'}
        type={type}
        onClick={onClick}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
