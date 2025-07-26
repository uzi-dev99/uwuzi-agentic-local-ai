import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  preventDefaultTouchMove?: boolean;
}

export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  threshold = 50,
  preventDefaultTouchMove = false
}: SwipeGestureOptions) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX.current);
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // Solo considerar como swipe si el movimiento horizontal es mayor que el vertical
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping.current = true;
        if (preventDefaultTouchMove) {
          e.preventDefault();
        }
      }
    } else if (preventDefaultTouchMove) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.current) return;
    
    const touch = e.changedTouches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);
    
    // Solo ejecutar swipe si el movimiento horizontal es mayor que el vertical
    if (Math.abs(deltaX) > deltaY) {
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    isSwiping.current = false;
  };

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeRight, onSwipeLeft, threshold, preventDefaultTouchMove]);

  return {
    isSwiping: isSwiping.current
  };
};