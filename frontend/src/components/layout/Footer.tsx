import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '2.5rem 0 1.5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.125rem', color: 'var(--ink)' }}>
              Lovely Professional University
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Office of Residential Life &amp; Accommodation Services • 10-Month Academic Session
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text)' }}>
            <span>Boys Towers: BH-1 to BH-8</span>
            <span>Girls Towers: GH-1 to GH-6</span>
            <span>Pro Bricks Dining</span>
          </div>
        </div>
        <div
          style={{
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>© {new Date().getFullYear()} Lovely Professional University. All official rights reserved.</div>
          <div>Strict Contraband Policy Enforced • Transparent Metered Electricity Quotas</div>
        </div>
      </div>
    </footer>
  );
};
