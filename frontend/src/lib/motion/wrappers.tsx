import { type ReactNode, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from './hooks';
import {
  pageVariants,
  staggerContainer,
  staggerItem,
  modalOverlayVariants,
  modalContentVariants,
  dropdownVariants,
  tooltipVariants,
  cardHoverVariants,
  sectionRevealVariants,
  listItemEnter,
  iconHoverVariants,
  TRANSITION,
} from './variants';

function useMotionConfig() {
  const prefersReduced = useReducedMotion();
  const reduced = prefersReduced;

  return {
    reduced,
    transition: (base: { duration: number; ease: number[] }) => (reduced ? { duration: 0 } : base),
  };
}

export const PageTransition = ({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) => {
  const { reduced } = useMotionConfig();

  return (
    <motion.div
      className={cn('page-enter', className)}
      style={style}
      variants={reduced ? undefined : pageVariants}
      initial={reduced ? false : 'initial'}
      animate={reduced ? undefined : 'animate'}
      exit={reduced ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
};

export const Section = ({ children, className, style, stagger = true }: { children: ReactNode; className?: string; style?: CSSProperties; stagger?: boolean }) => {
  const { reduced } = useMotionConfig();

  return (
    <motion.div
      className={className}
      style={style}
      variants={reduced || !stagger ? sectionRevealVariants : staggerContainer}
      initial={reduced ? false : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, margin: '-20px' }}
    >
      {stagger ? (
        <motion.div variants={reduced ? undefined : staggerContainer}>
          {Array.isArray(children) ? (
            children.map((child, i) => (
              <motion.div key={i} variants={reduced ? undefined : staggerItem}>
                {child}
              </motion.div>
            ))
          ) : (
            <motion.div variants={reduced ? undefined : staggerItem}>{children}</motion.div>
          )}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
};

export const MotionCard = ({ children, className, style, onClick, hoverable = true }: { children: ReactNode; className?: string; style?: CSSProperties; onClick?: () => void; hoverable?: boolean }) => {
  const { reduced } = useMotionConfig();

  if (onClick) {
    return (
      <motion.div
        className={cn('ui-card', className)}
        style={style}
        variants={reduced ? undefined : cardHoverVariants}
        initial="rest"
        whileHover={reduced || !hoverable ? undefined : 'hover'}
        whileTap={reduced ? undefined : { scale: 0.985 } as any}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn('ui-card', className)}
      style={style}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10px' }}
      transition={reduced ? undefined : { duration: 0.3, ease: [0.22, 1, 0.36, 1] } as any}
    >
      {children}
    </motion.div>
  );
};

export const ModalWrapper = ({ isOpen, onClose, children, className, overlayClassName, closeOnOverlayClick = true }: { isOpen: boolean; onClose: () => void; children: ReactNode; className?: string; overlayClassName?: string; closeOnOverlayClick?: boolean }) => {
  const { reduced } = useMotionConfig();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <motion.div
      className={cn('modal-overlay', overlayClassName)}
      variants={reduced ? undefined : modalOverlayVariants}
      initial={reduced ? undefined : 'hidden'}
      animate={reduced ? undefined : 'visible'}
      exit={reduced ? undefined : 'exit'}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className={cn('modal-content', className)}
        variants={reduced ? undefined : modalContentVariants}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
        exit={reduced ? undefined : 'exit'}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export const DropdownWrapper = ({ children, className, isOpen }: { children: ReactNode; className?: string; isOpen: boolean }) => {
  const { reduced } = useMotionConfig();

  if (!isOpen) return null;

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : dropdownVariants}
      initial={reduced ? undefined : 'hidden'}
      animate={reduced ? undefined : 'visible'}
      exit={reduced ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
};

export const TooltipWrapper = ({ children, className, isVisible }: { children: ReactNode; className?: string; isVisible: boolean }) => {
  const { reduced } = useMotionConfig();

  if (!isVisible) return null;

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : tooltipVariants}
      initial={reduced ? undefined : 'hidden'}
      animate={reduced ? undefined : 'visible'}
      exit={reduced ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
};

export const ListItem = ({ children, className, index = 0, onClick }: { children: ReactNode; className?: string; index?: number; onClick?: () => void }) => {
  const { reduced } = useMotionConfig();

  return (
    <motion.div
      className={className}
      custom={index}
      variants={reduced ? undefined : listItemEnter}
      initial={reduced ? false : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, margin: '-5px' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </motion.div>
  );
};

export const Skeleton = ({ className, width, height, borderRadius }: { className?: string; width?: string | number; height?: string | number; borderRadius?: string | number }) => {
  const style: CSSProperties = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%)',
    backgroundSize: '200% 100%',
  };

  return (
    <motion.div
      className={cn('skeleton-shimmer', className)}
      style={style}
      animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
    />
  );
};

export const EmptyState = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { reduced } = useMotionConfig();

  return (
    <motion.div
      className={cn('empty-state', className)}
      initial={reduced ? false : { opacity: 0, scale: 0.95 }}
      animate={reduced ? undefined : { opacity: 1, scale: 1 }}
      transition={reduced ? undefined : TRANSITION.base}
    >
      {children}
    </motion.div>
  );
};

export const IconHover = ({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => {
  const { reduced } = useMotionConfig();

  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : iconHoverVariants}
      initial="rest"
      whileHover={reduced ? undefined : 'hover'}
      whileTap={reduced ? undefined : { scale: 0.95 } as any}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </motion.div>
  );
};
