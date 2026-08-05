import { cn } from '@/utils/cn';
import brandLogo from '@/components/images/Brand_logo.png';
import brand2Logo from '@/components/images/Brand2_logo.png';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import './AppLogo.css';

interface AppLogoProps {
  className?: string;
  size?: number;
}

const logoVariants = {
  enter: { opacity: 0, y: 4 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const AppLogo = ({ className }: AppLogoProps) => {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? brand2Logo : brandLogo;

  return (
    <div className={cn('app-logo', className)}>
      <div className="app-logo-image">
        <AnimatePresence mode="wait">
          <motion.img
            key={theme}
            src={logoSrc}
            alt="UnifyAI"
            variants={logoVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppLogo;
