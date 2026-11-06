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
      backgroundColor: 'var(--status-pending-bg)',
      color: 'var(--primary)',
      border: '1px solid rgba(194, 65, 12, 0.25)',
    },
    success: {
      backgroundColor: 'var(--status-success-bg)',
      color: 'var(--status-success)',
      border: '1px solid rgba(30, 107, 58, 0.25)',
    },
    warning: {
      backgroundColor: 'var(--status-pending-bg)',
      color: 'var(--status-pending)',
      border: '1px solid rgba(138, 90, 0, 0.25)',
    },
    danger: {
      backgroundColor: 'var(--status-danger-bg)',
      color: 'var(--status-danger)',
      border: '1px solid rgba(164, 22, 26, 0.25)',
    },
    info: {
      backgroundColor: 'var(--status-waitlisted-bg)',
      color: 'var(--ink)',
      border: '1px solid var(--border-strong)',
    },
    neutral: {
      backgroundColor: 'var(--status-waitlisted-bg)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    },
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
    padding: size === 'sm' ? '2px 6px' : '3px 8px',
    lineHeight: '1.25',
    letterSpacing: '0.03em',
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
