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
            className="tabular-nums"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              backgroundColor: isVacant ? 'var(--status-success-bg)' : 'var(--status-waitlisted-bg)',
              color: isVacant ? 'var(--status-success)' : 'var(--status-waitlisted)',
              border: `1px solid ${isVacant ? 'rgba(30, 107, 58, 0.25)' : 'var(--border)'}`,
            }}
          >
            {b.identifier}
          </span>
        );
      })}
    </div>
  );
};
