import { cn } from '@/utils/cn';
import UnifyLogo from '@/components/common/UnifyLogo';
import './AppLogo.css';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo = ({ className, size = 28 }: AppLogoProps) => {
  return (
    <div className={cn('app-logo', className)}>
      <div className="app-logo-image">
        <UnifyLogo size={size} color="#5B8CFF" />
      </div>
      <span className="app-logo-text">UnifyAI</span>
    </div>
  );
};

export default AppLogo;
