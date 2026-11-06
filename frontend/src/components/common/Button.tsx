import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  style,
  ...rest
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
    textDecoration: 'none',
    border: '1px solid transparent',
    letterSpacing: '0.01em',
    ...style,
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.8125rem', height: '32px' },
    md: { padding: '10px 18px', fontSize: '0.875rem', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '1rem', height: '48px' },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#FFFFFF',
      borderColor: 'var(--primary)',
    },
    secondary: {
      backgroundColor: 'var(--surface)',
      color: 'var(--text)',
      borderColor: 'var(--border-strong)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text)',
      borderColor: 'var(--border-strong)',
    },
    danger: {
      backgroundColor: 'var(--surface)',
      color: 'var(--status-danger)',
      borderColor: 'rgba(164, 22, 26, 0.4)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      borderColor: 'transparent',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{ ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] }}
      className={`btn ${className}`}
      {...rest}
    >
      {isLoading && (
        <span
          style={{
            width: '0.875rem',
            height: '0.875rem',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
};
