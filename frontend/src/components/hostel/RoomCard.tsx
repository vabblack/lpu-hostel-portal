import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  GitCompareArrows,
  Snowflake,
  Sparkles,
  Wind,
  XCircle,
  Zap,
} from 'lucide-react';
import { RoomSummary } from '../../types/room';
import { Badge } from '../common/Badge';
import { BedIndicator } from './BedIndicator';

interface RoomCardProps {
  room: RoomSummary;
  onSelect?: (room: RoomSummary) => void;
  onInspect?: (room: RoomSummary) => void;
  onToggleCompare?: (room: RoomSummary) => void;
  isSelected?: boolean;
  isCompared?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onSelect,
  onInspect,
  onToggleCompare,
  isSelected = false,
  isCompared = false,
}) => {
  const isAc = room.is_air_conditioned;
  const hasVacant = room.vacant_beds_count > 0;
  const isStudio = room.category === 'STUDIO_APARTMENT';

  return (
    <div className="card-container">
      <article
        className={`neo-card-article ${isSelected || isCompared ? 'is-selected' : ''}`}
        aria-label={`${room.hostel_name} Room ${room.room_number}`}
      >
        {/* Top Tag Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.875rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <Badge variant="info" size="sm">
              {room.capacity}-Seater
            </Badge>
            <Badge variant={isAc ? 'warning' : 'neutral'} size="sm">
              {isAc ? <Snowflake size={11} aria-hidden="true" /> : <Wind size={11} aria-hidden="true" />}
              {isAc ? 'AC' : 'Air-Cooled'}
            </Badge>
            <Badge
              variant={isStudio ? 'primary' : 'neutral'}
              size="sm"
              style={
                isStudio
                  ? {
                      borderColor: 'var(--brand)',
                      color: '#ffd7b8',
                      backgroundColor: 'rgba(242, 101, 34, 0.16)',
                    }
                  : undefined
              }
            >
              {isStudio && <Sparkles size={11} aria-hidden="true" />}
              {room.category_display}
            </Badge>
          </div>
          <Badge variant={hasVacant ? 'success' : 'danger'} size="sm">
            {hasVacant ? (
              <CheckCircle2 size={11} aria-hidden="true" />
            ) : (
              <XCircle size={11} aria-hidden="true" />
            )}
            {hasVacant ? `${room.vacant_beds_count} Open` : 'Full'}
          </Badge>
        </header>

        {/* Room Title & Wing Location */}
        <div style={{ marginBottom: '0.875rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '0.5rem',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Room <span className="tabular-nums">{room.room_number}</span>
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {room.hostel_code}
            </span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {room.hostel_name} &middot; {room.block_name} &middot; Floor {room.floor_number} &middot;{' '}
            {room.washroom_type_display}
          </div>
        </div>

        {/* Electricity Quota & Amenity Strip */}
        <div style={{ marginBottom: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {room.quota_kwh && (
            <div
              style={{
                fontSize: '0.75rem',
                padding: '0.45rem 0.65rem',
                backgroundColor: '#1a1917',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Zap size={12} color="var(--brand)" aria-hidden="true" />
                Free Electricity Quota
              </span>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }} className="tabular-nums">
                {room.quota_kwh} kWh / 10-mo
              </span>
            </div>
          )}

          {room.facilities.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {room.facilities.slice(0, 3).map((facility) => (
                <span
                  key={facility}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 7px',
                    backgroundColor: '#1a1917',
                    border: '1px solid var(--border)',
                    color: '#ccc4b8',
                  }}
                >
                  {facility}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bed Roster */}
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.35rem',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              Bed Roster
            </span>
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(room)}
                aria-pressed={isCompared}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: isCompared ? 'var(--brand)' : 'transparent',
                  color: isCompared ? '#17130d' : 'var(--text-muted)',
                  border: `1px solid ${isCompared ? 'var(--brand)' : 'var(--border)'}`,
                  padding: '2px 6px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <GitCompareArrows size={11} aria-hidden="true" />
                {isCompared ? 'Pinned' : 'Compare'}
              </button>
            )}
          </div>
          <BedIndicator beds={room.beds} />
        </div>

        {/* Footer Tariff & Actions */}
        <footer
          style={{
            marginTop: 'auto',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            {room.standard_fee ? (
              <div>
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--ink)',
                  }}
                >
                  ₹{Number(room.standard_fee).toLocaleString('en-IN')}
                </div>
                {room.edb_fee && (
                  <div
                    className="tabular-nums"
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--status-success)',
                      fontWeight: 700,
                    }}
                  >
                    EDB ₹{Number(room.edb_fee).toLocaleString('en-IN')} &middot; Save ₹
                    {Number(room.standard_fee - room.edb_fee).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fee on request</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {onInspect && (
              <button
                type="button"
                className="neo-ghost-btn"
                style={{ padding: '0.4rem 0.65rem' }}
                onClick={() => onInspect(room)}
                aria-label={`Inspect room ${room.room_number} blueprint`}
              >
                <Compass size={13} aria-hidden="true" />
                Inspect
              </button>
            )}
            {onSelect && (
              <button
                type="button"
                className="neo-cta-btn"
                onClick={() => onSelect(room)}
                disabled={!hasVacant}
              >
                {isSelected ? 'Selected' : hasVacant ? 'Select Bed' : 'Occupied'}
                {hasVacant && <ArrowRight size={14} aria-hidden="true" />}
              </button>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
};
