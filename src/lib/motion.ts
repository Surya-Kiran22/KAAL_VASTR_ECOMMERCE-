import type { Variants } from 'framer-motion';

/** Consistent easing used across the storefront (expo-out ≈ easeOutExpo). */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: EASE },
  },
};

/** Staggered container — pair with item props on children. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/** Item-level variant for use inside a staggerContainer. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Right↔left slide for drawers / side panels. */
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.4, ease: EASE } },
  exit: { x: '100%', transition: { duration: 0.3, ease: EASE } },
};
