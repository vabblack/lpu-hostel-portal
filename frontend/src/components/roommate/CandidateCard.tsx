import React from 'react';
import { CandidateMatch } from '../../types/roommate';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface CandidateCardProps {
  candidate: CandidateMatch;
  onSendRequest: (studentId: string) => void;
  isSending?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSendRequest,
  isSending = false,
}) => {
  const score = candidate.score ? Math.round(candidate.score) : null;
  const matchVariant =
    score !== null && score >= 80 ? 'success' : score !== null && score >= 60 ? 'info' : 'warning';

  return (
    <Card hoverable style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Match Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        {score !== null ? (
          <Badge variant={matchVariant} size="md">
            🎯 {score}% Compatibility
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            Compatibility Pending
          </Badge>
        )}

        {candidate.is_room_aligned && (
          <Badge variant="primary" size="sm">
            ✓ Same Room Choice
          </Badge>
        )}
      </div>

      {/* Candidate Name & ID */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 600 }}>
          {candidate.full_name}
        </h4>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          ID: <strong style={{ color: 'var(--color-text-primary)' }}>{candidate.student_id}</strong>
        </div>
      </div>

      {/* Academic Info */}
      <div
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-hover)',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{candidate.branch || 'Undergraduate'}</span>
        {candidate.cgpa && <span>CGPA: <strong>{candidate.cgpa.toFixed(2)}</strong></span>}
      </div>

      {/* Target Room Choice */}
      {candidate.target_room && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Preference: <strong>{candidate.target_room}</strong>
        </div>
      )}

      {/* Action */}
      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        {candidate.has_pending_request ? (
          <Button variant="outline" size="sm" disabled style={{ width: '100%' }}>
            ⏳ Request Pending
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSendRequest(candidate.student_id)}
            isLoading={isSending}
            style={{ width: '100%' }}
          >
            Connect / Request Roommate
          </Button>
        )}
      </div>
    </Card>
  );
};
