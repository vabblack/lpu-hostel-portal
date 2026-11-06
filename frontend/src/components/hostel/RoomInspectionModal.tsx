import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloorRoomDetail } from '../../types/hostel';
import { X, Bed, Zap, Snowflake, Wind, Check, ShieldCheck, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface RoomInspectionModalProps {
  room: FloorRoomDetail | null;
  hostelName: string;
  blockName: string;
  floorLabel: string;
  onClose: () => void;
}

export const RoomInspectionModal: React.FC<RoomInspectionModalProps> = ({
  room,
  hostelName,
  blockName,
  floorLabel,
  onClose,
}) => {
  const navigate = useNavigate();
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);

  if (!room) return null;

  // Auto-select first vacant bed if none selected
  const vacantBeds = room.beds.filter((b) => b.status === 'VACANT');
  const activeBed = room.beds.find((b) => b.id === (selectedBedId ?? vacantBeds[0]?.id));

  const standardFee = room.standard_fee || 0;
  const edbSavings = 10000;
  const edbFee = Math.max(0, standardFee - edbSavings);

  const handleProceedToApply = () => {
    const bedParam = activeBed?.identifier ? `&bed=${encodeURIComponent(activeBed.identifier)}` : '';
    navigate(`/apply?room=${room.id}${bedParam}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26, 26, 26, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header with Blueprint Architectural Stamp */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#FAF8F5',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Blueprint Unit Inspector
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {hostelName} ({blockName}, {floorLabel})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Room {room.room_number}
              </h2>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <Badge variant={room.vacant_beds_count > 0 ? 'success' : 'danger'}>
                  {room.vacant_beds_count > 0 ? `${room.vacant_beds_count} Vacant` : 'Fully Occupied'}
                </Badge>
                <Badge variant="neutral">
                  {room.is_air_conditioned ? 'Air Conditioned' : 'Air Cooled'}
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Architectural Specifications Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#FAF9F6',
              border: '1px solid var(--border)',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Floor Layout & Washroom
              </div>
              <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>
                {room.category_display} • {room.washroom_type}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Resident Configuration
              </div>
              <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>
                {room.capacity}-Seater Residential Unit
              </div>
            </div>

            {room.quota_kwh && (
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <Zap size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Metered Electricity Allowance:
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.4 }}>
                  Includes <strong style={{ color: 'var(--ink)' }}>{room.quota_kwh} kWh</strong> quota per session.
                  Excess consumption billed transparently at ₹8.50/unit split among room residents.
                </div>
              </div>
            )}
          </div>

          {/* Individual Bed Slot Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Bed Bays in Room {room.room_number}:</span>
              <span style={{ color: 'var(--primary)', fontWeight: 500, textTransform: 'none' }}>
                Select your preferred slot
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(room.capacity, 4)}, 1fr)`,
                gap: '0.75rem',
              }}
            >
              {room.beds.map((bed, idx) => {
                const bedCode = bed.identifier || String.fromCharCode(65 + idx);
                const isOccupied = bed.status !== 'VACANT';
                const isSelected = activeBed?.id === bed.id;

                return (
                  <button
                    key={bed.id}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setSelectedBedId(bed.id)}
                    style={{
                      padding: '0.85rem 0.5rem',
                      border: `2px solid ${
                        isSelected
                          ? 'var(--primary)'
                          : isOccupied
                          ? 'var(--border)'
                          : 'var(--border-strong)'
                      }`,
                      backgroundColor: isSelected
                        ? '#FFF5ED'
                        : isOccupied
                        ? '#F5F5F4'
                        : '#FFFFFF',
                      borderRadius: '4px',
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '14px',
                          height: '14px',
                          backgroundColor: 'var(--primary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                    <Bed
                      size={20}
                      color={isSelected ? 'var(--primary)' : isOccupied ? '#A8A29E' : '#1E6B3A'}
                    />
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: isOccupied ? '#A8A29E' : 'var(--ink)',
                        marginTop: '0.35rem',
                      }}
                    >
                      Bed {bedCode}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: isOccupied ? '#A8A29E' : '#1E6B3A',
                      }}
                    >
                      {isOccupied ? 'Occupied' : 'Vacant'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fee & Early Decision Benefit (EDB) Breakdown */}
          {standardFee > 0 && (
            <div
              style={{
                backgroundColor: '#FAF5EE',
                border: '1px solid #E4D8C7',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    10-Month Academic Fee
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      ₹{edbFee.toLocaleString('en-IN')}
                    </span>
                    <span
                      style={{
                        textDecoration: 'line-through',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                      }}
                    >
                      ₹{standardFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#E7F2EA',
                    border: '1px solid #1E6B3A',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '2px',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontSize: '0.625rem', color: '#1E6B3A', fontWeight: 700, textTransform: 'uppercase' }}>
                    Early Decision Benefit
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1E6B3A' }}>
                    Save ₹{edbSavings.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} color="#1E6B3A" />
                <span>Deterministic pricing verified per official Lovely Professional University hostel schedule.</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={room.vacant_beds_count === 0 || !activeBed}
              onClick={handleProceedToApply}
            >
              {room.vacant_beds_count > 0 && activeBed
                ? `Proceed with Bed ${activeBed.identifier || 'Slot'} & Apply`
                : 'No Beds Available'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
};
