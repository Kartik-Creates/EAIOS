import { cn } from '@/utils/cn';
import brandLogo from '@/components/images/Brand_logo.png';
import brand2Logo from '@/components/images/Brand2_logo.png';
import { useTheme } from '@/hooks/useTheme';
import './AppLogo.css';

interface AppLogoProps {
  className?: string;
}

export const AppLogo = ({ className }: AppLogoProps) => {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? brand2Logo : brandLogo;

  return (
    <div className={cn('app-logo', className)}>
      <div className="app-logo-image">
        <img src={logoSrc} alt="UNIFY-AI" />
      </div>
      <span className="app-logo-text">UNIFY-AI</span>
    </div>
  );
};
