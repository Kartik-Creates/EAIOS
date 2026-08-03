import { cn } from '@/utils/cn';

export interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const ToggleSwitch = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleSwitchProps) => {
  return (
    <div className={cn('toggle-row', className)}>
      {(label || description) && (
        <div className="toggle-text">
          {label && <span className="toggle-label">{label}</span>}
          {description && <span className="toggle-description">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn('toggle-switch', checked && 'toggle-switch-checked')}
      >
        <span className="toggle-thumb" aria-hidden="true" />
      </button>
    </div>
  );
};
