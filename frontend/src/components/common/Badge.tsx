import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  style: customStyle,
}) => {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(30, 58, 138, 0.2)',
    },
    success: {
      backgroundColor: 'var(--color-success-light)',
      color: 'var(--color-success)',
      border: '1px solid rgba(22, 101, 52, 0.2)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-light)',
      color: 'var(--color-warning)',
      border: '1px solid rgba(133, 77, 14, 0.2)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-light)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(153, 27, 27, 0.2)',
    },
    info: {
      backgroundColor: 'var(--color-info-light)',
      color: 'var(--color-info)',
      border: '1px solid rgba(7, 89, 133, 0.2)',
    },
    neutral: {
      backgroundColor: 'var(--color-surface-hover)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    },
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: 'var(--font-weight-medium)',
    fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
    padding: size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.625rem',
    lineHeight: '1.2',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...customStyle,
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
};
