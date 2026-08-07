import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import './ui.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className={cn('input-wrapper', className)}>
        {label && (
          <motion.label
            className="input-label"
            htmlFor={id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {label}
          </motion.label>
        )}
        <motion.div
          className="input-field-container"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {icon && <div className="input-icon-left">{icon}</div>}
          <input
            ref={ref}
            id={id}
            className={cn('input-field', icon && 'input-with-icon', error && 'input-error')}
            aria-invalid={!!error}
            {...props}
          />
        </motion.div>
        {error && <motion.span className="input-error-text" role="alert" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>{error}</motion.span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
