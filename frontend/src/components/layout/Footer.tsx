import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
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
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
              Lovely Professional University
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Automated Hostel Allocation, Mess Enrollment & Roommate Compatibility System
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <span>Boys Hostels: BH-1 to BH-8</span>
            <span>Girls Hostels: GH-1 to GH-6</span>
            <span>10-Month Cycle Policy</span>
          </div>
        </div>
        <div
          style={{
            paddingTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>© {new Date().getFullYear()} Lovely Professional University. All rights reserved.</div>
          <div>Strict Contraband Policy Enforced • Transparent Metered Electricity Allowances</div>
        </div>
      </div>
    </footer>
  );
};
