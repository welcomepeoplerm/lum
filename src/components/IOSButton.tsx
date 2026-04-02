/**
 * iOS-optimized Button Component
 * 
 * Questo componente risolve i problemi comuni dei click su iOS:
 * - Elimina il delay di 300ms
 * - Gestisce correttamente gli eventi touch
 * - Previene lo zoom sul doppio tap
 * - Fornisce feedback visivo appropriato
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const IOSButton = forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ variant = 'primary', className = '', children, style, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      WebkitTapHighlightColor: 'rgba(47, 95, 221, 0.3)',
      touchAction: 'manipulation',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      ...style
    };

    const variantStyles = {
      primary: {
        backgroundColor: '#2f5fdd',
      },
      secondary: {
        backgroundColor: '#d17f3d',
      },
      ghost: {
        backgroundColor: 'transparent',
      }
    };

    return (
      <button
        ref={ref}
        className={className}
        style={{ ...baseStyles, ...variantStyles[variant] }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IOSButton.displayName = 'IOSButton';

export default IOSButton;
