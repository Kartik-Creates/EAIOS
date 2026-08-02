import { cn } from '@/utils/cn';
import brandLogo from '@/components/images/Brand_logo.png';
import './AppLogo.css';

interface AppLogoProps {
  className?: string;
}

export const AppLogo = ({ className }: AppLogoProps) => {
  return (
    <div className={cn('app-logo', className)}>
      <div className="app-logo-image">
        <img src={brandLogo} alt="UNIFY-AI" />
      </div>
      <span className="app-logo-text">UNIFY-AI</span>
    </div>
  );
};
