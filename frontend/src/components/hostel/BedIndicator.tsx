import React from 'react';
import { BedDetail } from '../../types/hostel';

export const BedIndicator: React.FC<{ beds: BedDetail[] }> = ({ beds }) => {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
      {beds.map((b) => {
        const isVacant = b.status === 'VACANT';
        return (
          <span
            key={b.id}
            title={`Bed ${b.identifier}: ${b.status_display}`}
            aria-label={`Bed ${b.identifier}: ${b.status_display}`}
            className="tabular-nums"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '1.85rem',
              height: '1.85rem',
              padding: '0 0.35rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              backgroundColor: isVacant ? 'var(--status-success-bg)' : 'var(--status-waitlisted-bg)',
              color: isVacant ? 'var(--status-success)' : 'var(--status-waitlisted)',
              border: `1.5px solid ${isVacant ? 'var(--status-success)' : 'var(--border)'}`,
              letterSpacing: '0.02em',
            }}
          >
            {b.identifier}
          </span>
        );
      })}
    </div>
  );
};
