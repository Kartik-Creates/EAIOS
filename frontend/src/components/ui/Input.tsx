import { forwardRef, type InputHTMLAttributes } from 'react';
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
          <label className="input-label" htmlFor={id}>
            {label}
          </label>
        )}
        <div className="input-field-container">
          {icon && <div className="input-icon-left">{icon}</div>}
          <input
            ref={ref}
            id={id}
            className={cn('input-field', icon && 'input-with-icon', error && 'input-error')}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error && <span className="input-error-text" role="alert">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
