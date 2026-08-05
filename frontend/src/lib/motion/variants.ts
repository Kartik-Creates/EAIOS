import { Variants, Transition } from 'framer-motion';

export const EASE_OUT: Transition['ease'] = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.18,
  base: 0.24,
  slow: 0.3,
  modal: 0.28,
  page: 0.35,
  stagger: 0.06,
} as const;

export const TRANSITION = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_OUT },
  modal: { duration: DURATION.modal, ease: EASE_OUT },
  page: { duration: DURATION.page, ease: EASE_OUT },
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  springSoft: { type: 'spring', stiffness: 300, damping: 30 },
} as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: TRANSITION.page },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION.base },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.base },
};

export const fadeInDownVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.base },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: TRANSITION.modal },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: TRANSITION.base },
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: TRANSITION.base },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: DURATION.stagger,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.fast },
};

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: TRANSITION.modal },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18, ease: EASE_OUT } },
};

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: TRANSITION.fast },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15, ease: EASE_OUT } },
};

export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 4, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: EASE_OUT } },
  exit: { opacity: 0, y: 4, scale: 0.95, transition: { duration: 0.1, ease: EASE_OUT } },
};

export const cardHoverVariants: Variants = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: TRANSITION.base },
  hover: {
    y: -4,
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    transition: TRANSITION.base,
  },
};

export const buttonTapVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: TRANSITION.fast },
  tap: { scale: 0.97, transition: { duration: 0.1, ease: EASE_OUT } },
  disabled: { scale: 1, opacity: 0.5, cursor: 'not-allowed' },
};

export const iconHoverVariants: Variants = {
  rest: { scale: 1, rotate: 0, transition: TRANSITION.fast },
  hover: { scale: 1.1, rotate: 5, transition: TRANSITION.fast },
};

export const sidebarItemVariants: Variants = {
  rest: { x: 0, backgroundColor: 'transparent', transition: TRANSITION.fast },
  hover: { x: 4, transition: TRANSITION.fast },
};

export const pulseOnceVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

export const skeletonShimmer = {
  animate: {
    x: ['-100%', '100%'],
    transition: { repeat: Infinity, duration: 1.8, ease: 'linear' },
  },
};

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -20, x: 0, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: TRANSITION.base },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const listItemEnter: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...TRANSITION.fast, delay: i * 0.04 },
  }),
};

export const counterVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.base, delay: i * 0.08 },
  }),
};

export const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.slow },
};
