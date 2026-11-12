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
              Lovely Professional University (NAAC Grade A++)
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Jalandhar–Delhi G.T. Road, Phagwara, Punjab (144411) • Helpline: +91-1824-517000 • admissions@lpu.co.in
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text)', flexWrap: 'wrap' }}>
            <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer">LPU residential facilities</a>
            <a href="https://www.lpu.in/SUSTAINABLE/sdg11/residential-facility.php" target="_blank" rel="noreferrer">LPU published figures</a>
            <a href="https://www.lpu.in/lpu-assets/download/hostel-brochure.pdf" target="_blank" rel="noreferrer">Official hostel brochure</a>
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
          <div>© {new Date().getFullYear()} LPU Residential Accommodation &amp; Roommate Portal</div>
          <div>Residential fees, Pro Bricks mess, laundry &amp; gym data referenced from lpu.in. Official booking runs through LPU UMS.</div>
        </div>
      </div>
    </footer>
  );
};
