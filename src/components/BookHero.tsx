import React, { Suspense, lazy } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { BookCoverFallback } from './BookCoverFallback';

// Lazy load 3D canvas so Three.js bundle is isolated and only loaded when needed
const BookCover3D = lazy(() => import('./BookCover3D'));

export const BookHero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // On small screens or when reduced motion is preferred, use the CSS book cover
  if (prefersReducedMotion || isMobile) {
    return (
      <div className="flex justify-center items-center py-4">
        <BookCoverFallback />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-4">
          <BookCoverFallback />
        </div>
      }
    >
      <BookCover3D />
    </Suspense>
  );
};
