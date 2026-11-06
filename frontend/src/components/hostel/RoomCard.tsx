import React from 'react';
import { RoomSummary } from '../../types/room';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { BedIndicator } from './BedIndicator';

interface RoomCardProps {
  room: RoomSummary;
  onSelect?: (room: RoomSummary) => void;
  isSelected?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect, isSelected = false }) => {
  const isAc = room.is_air_conditioned;
  const hasVacant = room.vacant_beds_count > 0;

  return (
    <Card
      hoverable
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
        backgroundColor: isSelected ? '#FAF8F3' : 'var(--surface)',
      }}
    >
      {/* Top Tag Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <Badge variant="info" size="sm">
            {room.capacity}-Seater
          </Badge>
          <Badge variant={isAc ? 'warning' : 'neutral'} size="sm">
            {isAc ? 'Air-Conditioned' : 'Air-Cooled'}
          </Badge>
          <Badge variant="neutral" size="sm">
            {room.category_display}
          </Badge>
        </div>
        <Badge variant={hasVacant ? 'success' : 'danger'} size="sm">
          {hasVacant ? `${room.vacant_beds_count} Vacant` : 'Full'}
        </Badge>
      </div>

      {/* Room Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h4 style={{ margin: 0, fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)' }}>
            Room <span className="tabular-nums">{room.room_number}</span>
          </h4>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {room.hostel_name}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {room.block_name} • Floor {room.floor_number} • {room.washroom_type_display}
        </div>
      </div>

      {/* Electricity Quota Pill */}
      {room.quota_kwh && (
        <div
          style={{
            fontSize: '0.75rem',
            padding: '0.35rem 0.6rem',
            backgroundColor: '#FAF8F3',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Electricity Quota:</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }} className="tabular-nums">
            {room.quota_kwh} kWh / session
          </span>
        </div>
      )}

      {/* Bed Roster Status */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Bed Roster:
        </div>
        <BedIndicator beds={room.beds} />
      </div>

      {/* Pricing and Action */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          {room.standard_fee ? (
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--ink)' }} className="tabular-nums">
                ₹{Number(room.standard_fee).toLocaleString('en-IN')}
              </div>
              {room.edb_fee && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--status-success)', fontWeight: 600 }} className="tabular-nums">
                  EDB: ₹{Number(room.edb_fee).toLocaleString('en-IN')} (Save ₹{Number(room.standard_fee - room.edb_fee).toLocaleString('en-IN')})
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fee on request</span>
          )}
        </div>

        {onSelect && (
          <Button
            variant={isSelected ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onSelect(room)}
            disabled={!hasVacant}
          >
            {isSelected ? '✓ Selected' : hasVacant ? 'Select Bed' : 'Occupied'}
          </Button>
        )}
      </div>
    </Card>
  );
};
