'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type ComponentType, type RefAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HomepageIconProps {
  icon: ComponentType<{ size?: number } & RefAttributes<IconHandle>>;
  size?: number;
  active?: boolean;
  className?: string;
}

export function HomepageIcon({ icon: Icon, size = 24, active, className }: HomepageIconProps) {
  const handle = useRef<IconHandle>(null);
  const container = useRef<HTMLSpanElement>(null);
  const hasPlayedEntrance = useRef(false);
  const isInView = useInView(container, { once: true, amount: 'all' });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (active === undefined || reducedMotion !== false) return;

    if (active) {
      handle.current?.startAnimation();
    } else {
      handle.current?.stopAnimation();
    }
  }, [active, reducedMotion]);

  useEffect(() => {
    if (!isInView || reducedMotion !== false || hasPlayedEntrance.current) return;

    hasPlayedEntrance.current = true;
    handle.current?.startAnimation();
  }, [isInView, reducedMotion]);

  return (
    <span
      ref={container}
      aria-hidden="true"
      className={cn('inline-flex shrink-0 align-[-0.15em]', className)}
      onMouseEnter={() => {
        if (active === undefined && reducedMotion === false) handle.current?.startAnimation();
      }}
      onMouseLeave={() => {
        if (active === undefined && reducedMotion === false) handle.current?.stopAnimation();
      }}
    >
      <Icon ref={handle} size={size} />
    </span>
  );
}
