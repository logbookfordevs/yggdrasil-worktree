import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className = '', id }: SectionProps) {
  return (
    <section
      id={id}
      className={`w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}
