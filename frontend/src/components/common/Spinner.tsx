import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label }) => {
  const sizePx = size === 'sm' ? '1.25rem' : size === 'lg' ? '2.5rem' : '1.75rem';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: sizePx,
          height: sizePx,
          border: '3px solid var(--color-surface-hover)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      {label && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {label}
        </span>
      )}
    </div>
  );
};
