import { useEffect, useState } from 'react';

export const useReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
};

export const useScrollReveal = (options?: { once?: boolean; margin?: string }) => {
  const { once = true, margin = '-20px' } = options || {};

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.setAttribute('data-visible', 'true');
          if (once) observer.unobserve(el);
        } else if (!once) {
          const el = entry.target as HTMLElement;
          el.setAttribute('data-visible', 'false');
        }
      },
      { rootMargin: margin }
    );

    const elements = document.querySelectorAll('[data-scroll-reveal]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [once, margin]);

  return;
};

export const useInView = (options?: { threshold?: number; rootMargin?: string }) => {
  const [isInView, setIsInView] = useState(false);
  const ref = (node: HTMLElement | null) => {
    if (!node || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      if (node) setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      options
    );

    observer.observe(node);
    return () => observer.disconnect();
  };

  return { ref, isInView };
};
