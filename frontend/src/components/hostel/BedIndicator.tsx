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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: isVacant ? 'var(--color-success-light)' : 'var(--color-surface-hover)',
              color: isVacant ? 'var(--color-success)' : 'var(--color-text-muted)',
              border: `1px solid ${isVacant ? 'rgba(22, 101, 52, 0.3)' : 'var(--color-border)'}`,
            }}
          >
            {b.identifier}
          </span>
        );
      })}
    </div>
  );
};
