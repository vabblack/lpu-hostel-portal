import React, { useRef, useState } from 'react';

interface Perspective3DCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  intensity?: number;
  accentTop?: boolean;
}

export const Perspective3DCard: React.FC<Perspective3DCardProps> = ({
  children,
  style,
  className = '',
  intensity = 7,
  accentTop = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * intensity * 2;
    const rx = (0.5 - py) * intensity * 2;
    setTilt({
      rx,
      ry,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
  };

  return (
    <div className={`card-3d-shell ${className}`} style={{ height: '100%' }}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="card-3d-surface"
        style={{
          position: 'relative',
          height: '100%',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          borderStyle: 'solid',
          borderWidth: accentTop ? '3px 1px 1px' : '1px',
          borderColor: accentTop
            ? `var(--brand) ${tilt.active ? 'var(--border-strong)' : 'var(--border)'} ${tilt.active ? 'var(--border-strong)' : 'var(--border)'}`
            : tilt.active ? 'var(--border-strong)' : 'var(--border)',
          padding: '1.5rem',
          boxShadow: tilt.active ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          transform: prefersReducedMotion
            ? undefined
            : `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
          ...style,
        }}
      >
        {/* Subtle Interactive Lighting Sheen */}
        {!prefersReducedMotion && tilt.active && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: `radial-gradient(circle 220px at ${tilt.glareX}% ${tilt.glareY}%, rgba(242, 101, 34, 0.08), transparent 70%)`,
            }}
          />
        )}
        <div style={{ position: 'relative', transform: 'translateZ(12px)', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

