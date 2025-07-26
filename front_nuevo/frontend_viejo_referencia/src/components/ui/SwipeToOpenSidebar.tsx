import React from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useSidebar } from '@/components/ui/sidebar';

interface SwipeToOpenSidebarProps {
  children: React.ReactNode;
  swipeThreshold?: number;
  edgeThreshold?: number;
}

const SwipeToOpenSidebar: React.FC<SwipeToOpenSidebarProps> = ({
  children,
  swipeThreshold = 80,
  edgeThreshold = 50
}) => {
  const { isMobileLayout, setOpenMobile, openMobile } = useSidebar();
  const [touchStartFromEdge, setTouchStartFromEdge] = React.useState(false);

  // Solo habilitar el gesto en móviles y cuando el sidebar esté cerrado
  const shouldEnableSwipe = isMobileLayout && !openMobile;

  const handleSwipeRight = React.useCallback(() => {
    if (shouldEnableSwipe && touchStartFromEdge) {
      setOpenMobile(true);
    }
  }, [shouldEnableSwipe, touchStartFromEdge, setOpenMobile]);

  // Detectar si el toque comenzó desde el borde izquierdo
  React.useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!shouldEnableSwipe) return;
      
      const touch = e.touches[0];
      const isFromLeftEdge = touch.clientX <= edgeThreshold;
      setTouchStartFromEdge(isFromLeftEdge);
    };

    const handleTouchEnd = () => {
      setTouchStartFromEdge(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [shouldEnableSwipe, edgeThreshold]);

  useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    threshold: swipeThreshold,
    preventDefaultTouchMove: false
  });

  return <>{children}</>;
};

export default SwipeToOpenSidebar;