/**
 * Utility functions for iOS touch event handling
 * 
 * iOS Safari has specific requirements for touch events:
 * - Click events can have a 300ms delay
 * - Touch events need proper preventDefault handling
 * - Buttons need explicit touch-action CSS
 */

/**
 * Creates a touch-friendly click handler that works on iOS
 * Eliminates the 300ms delay and improves responsiveness
 */
export const createTouchHandler = (callback: () => void) => {
  let touchStartTime = 0;
  let touchMoved = false;

  return {
    onTouchStart: (e: React.TouchEvent) => {
      touchStartTime = Date.now();
      touchMoved = false;
    },
    onTouchMove: () => {
      touchMoved = true;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const touchDuration = Date.now() - touchStartTime;
      // Only trigger if it was a tap (not a drag) and quick enough
      if (!touchMoved && touchDuration < 200) {
        e.preventDefault();
        callback();
      }
    },
    onClick: (e: React.MouseEvent) => {
      // For desktop browsers
      callback();
    }
  };
};

/**
 * Adds iOS-specific attributes to button elements
 */
export const iOSButtonProps = {
  style: {
    WebkitTapHighlightColor: 'rgba(141, 156, 113, 0.3)',
    touchAction: 'manipulation' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
  }
};

/**
 * Hook for detecting iOS devices
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Fixes the 300ms click delay on iOS by using touch events
 */
export const fastClick = (element: HTMLElement, handler: () => void) => {
  let touchStartTime = 0;
  let touchMoved = false;

  element.addEventListener('touchstart', () => {
    touchStartTime = Date.now();
    touchMoved = false;
  }, { passive: true });

  element.addEventListener('touchmove', () => {
    touchMoved = true;
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;
    if (!touchMoved && touchDuration < 200) {
      e.preventDefault();
      handler();
    }
  });

  element.addEventListener('click', handler);
};
