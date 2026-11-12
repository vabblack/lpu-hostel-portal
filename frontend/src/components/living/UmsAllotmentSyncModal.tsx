import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

interface UmsAllotmentSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UmsAllotmentSyncModal: React.FC<UmsAllotmentSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<'text' | 'form'>('text');
  const [allotmentText, setAllotmentText] = useState('');
  const [hostelCode, setHostelCode] = useState('BH-4');
  const [roomNumber, setRoomNumber] = useState('302');
  const [bedLetter, setBedLetter] = useState('A');
  const [seater, setSeater] = useState('2');
  const [isAc, setIsAc] = useState(true);
  const [slipRef, setSlipRef] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const samplePresets = [
    {
      title: 'BH-4 Room 302 (Bed A)',
      text: `LOVELY PROFESSIONAL UNIVERSITY\nRESIDENTIAL ALLOTMENT SLIP\nHostel: Boys Hostel 4 (BH-4)\nRoom: 302\nBed: Bed A\nType: 2-Seater AC\nRef: LPU-UMS-2026-BH4-302A`,
      code: 'BH-4',
      room: '302',
      bed: 'A',
      seater: '2',
      ac: true,
    },
    {
      title: 'BH-9 Studio Room 405 (Bed B)',
      text: `LOVELY PROFESSIONAL UNIVERSITY\nRESIDENTIAL ALLOTMENT SLIP\nHostel: Boys Studio 9 (BH-9)\nRoom: 405\nBed: Bed B\nType: 2-Seater AC Studio\nRef: LPU-UMS-2026-BH9-405B`,
      code: 'BH-9',
      room: '405',
      bed: 'B',
      seater: '2',
      ac: true,
    },
    {
      title: 'GH-2 Room 201 (Bed A)',
      text: `LOVELY PROFESSIONAL UNIVERSITY\nRESIDENTIAL ALLOTMENT SLIP\nHostel: Girls Hostel 2 (GH-2)\nRoom: 201\nBed: Bed A\nType: 3-Seater Cooler\nRef: LPU-UMS-2026-GH2-201A`,
      code: 'GH-2',
      room: '201',
      bed: 'A',
      seater: '3',
      ac: false,
    },
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setAllotmentText(preset.text);
    setHostelCode(preset.code);
    setRoomNumber(preset.room);
    setBedLetter(preset.bed);
    setSeater(preset.seater);
    setIsAc(preset.ac);
    setSlipRef(`LPU-UMS-2026-${preset.code.replace('-', '')}-${preset.room}${preset.bed}`);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload =
        mode === 'text'
          ? { allotment_text: allotmentText }
          : {
              hostel_code: hostelCode,
              room_number: roomNumber,
              bed_letter: bedLetter,
              seater: parseInt(seater, 10),
              is_ac: isAc,
              slip_id: slipRef.trim() || undefined,
            };

      const res = await authApi.importUmsAllotment(payload);
      setSuccessMsg(res.message);
      await refreshUser();
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import UMS allotment record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect LPU UMS Allotment" maxWidth="560px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <img
          src="/lpu-crest.png"
          alt="LPU Crest"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: '1.5px solid var(--brand)',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
            Authoritative UMS Sync Service
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sync your officially allotted hostel, room, and bed slot from LPU UMS (<code>ums.lpu.in</code>).
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: 'var(--radius-sm)',
            color: '#10B981',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--status-danger)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Preset Quick Fill */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          Sample UMS Allotment Presets:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {samplePresets.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => handleApplyPreset(p)}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.65rem',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              + {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.25rem',
          gap: '1rem',
        }}
      >
        <button
          type="button"
          onClick={() => setMode('text')}
          style={{
            padding: '0.5rem 0',
            background: 'none',
            border: 'none',
            borderBottom: mode === 'text' ? '2px solid var(--brand)' : '2px solid transparent',
            color: mode === 'text' ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Paste UMS Slip Text
        </button>
        <button
          type="button"
          onClick={() => setMode('form')}
          style={{
            padding: '0.5rem 0',
            background: 'none',
            border: 'none',
            borderBottom: mode === 'form' ? '2px solid var(--brand)' : '2px solid transparent',
            color: mode === 'form' ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Manual Slip Entry
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'text' ? (
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
              }}
            >
              Paste Allotment Slip / Receipt Text from UMS *
            </label>
            <textarea
              required
              rows={6}
              placeholder="e.g. Hostel: Boys Hostel 4 (BH-4)&#10;Room: 302&#10;Bed: Bed A&#10;Type: 2-Seater AC&#10;Reference: LPU-UMS-2026-BH4-302A"
              value={allotmentText}
              onChange={(e) => setAllotmentText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8125rem',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                Hostel *
              </label>
              <select
                value={hostelCode}
                onChange={(e) => setHostelCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: '0.875rem',
                }}
              >
                <optgroup label="Boys Hostels & Studios">
                  <option value="BH-1">BH-1 (Shivalik)</option>
                  <option value="BH-2">BH-2 (Kaveri)</option>
                  <option value="BH-3">BH-3 (Himalaya)</option>
                  <option value="BH-4">BH-4 (Nilgiri)</option>
                  <option value="BH-5">BH-5 (Vindhya)</option>
                  <option value="BH-6">BH-6 (Aravalli)</option>
                  <option value="BH-7">BH-7 (Satpura)</option>
                  <option value="BH-8">BH-8 (Sahyadri)</option>
                  <option value="BH-9">BH-9 (Boys Studio 9)</option>
                  <option value="BH-10">BH-10 (Boys Hostel 10)</option>
                </optgroup>
                <optgroup label="Girls Hostels & Studios">
                  <option value="GH-1">GH-1 (Ganga)</option>
                  <option value="GH-2">GH-2 (Yamuna)</option>
                  <option value="GH-3">GH-3 (Saraswati)</option>
                  <option value="GH-4">GH-4 (Godavari)</option>
                  <option value="GH-5">GH-5 (Narmada)</option>
                  <option value="GH-6">GH-6 (Krishna)</option>
                  <option value="GH-8">GH-8 (Girls Hostel 8)</option>
                  <option value="GS-9">GS-9 (Girls Studio 9)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                Room Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 302"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                Bed Identifier *
              </label>
              <select
                value={bedLetter}
                onChange={(e) => setBedLetter(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--ink)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="A">Bed A (Window side)</option>
                <option value="B">Bed B (Aisle side)</option>
                <option value="C">Bed C</option>
                <option value="D">Bed D</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                }}
              >
                Cooling & Capacity
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '38px' }}>
                <select
                  value={seater}
                  onChange={(e) => setSeater(e.target.value)}
                  style={{
                    flex: 1,
                    height: '38px',
                    padding: '0 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="1">1 Seater</option>
                  <option value="2">2 Seater</option>
                  <option value="3">3 Seater</option>
                  <option value="4">4 Seater</option>
                </select>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAc}
                    onChange={(e) => setIsAc(e.target.checked)}
                  />
                  AC
                </label>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Verify & Sync UMS Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

