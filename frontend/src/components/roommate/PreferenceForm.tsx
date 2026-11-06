import React, { useState } from 'react';
import { RoommatePreferences, FoodPreference } from '../../types/roommate';
import { Button } from '../common/Button';

interface PreferenceFormProps {
  initialValues?: RoommatePreferences | null;
  onSave: (values: RoommatePreferences) => Promise<void>;
}

export const PreferenceForm: React.FC<PreferenceFormProps> = ({ initialValues, onSave }) => {
  const [sleepingSchedule, setSleepingSchedule] = useState(initialValues?.sleeping_schedule || 3);
  const [cleanliness, setCleanliness] = useState(initialValues?.cleanliness || 3);
  const [studyHabits, setStudyHabits] = useState(initialValues?.study_habits || 3);
  const [noiseTolerance, setNoiseTolerance] = useState(initialValues?.noise_tolerance || 3);
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(
    initialValues?.food_preference || 'FLEXIBLE'
  );
  const [socialPreference, setSocialPreference] = useState(initialValues?.social_preference || 3);
  const [temperaturePref, setTemperaturePref] = useState(initialValues?.temperature_pref || 3);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await onSave({
        sleeping_schedule: sleepingSchedule,
        cleanliness,
        study_habits: studyHabits,
        noise_tolerance: noiseTolerance,
        food_preference: foodPreference,
        social_preference: socialPreference,
        temperature_pref: temperaturePref,
      });
      setSuccessMsg('Preferences saved! Roommate compatibility scores are live.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSlider = (
    label: string,
    weight: string,
    value: number,
    setValue: (val: number) => void,
    lowLabel: string,
    highLabel: string
  ) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {label} <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem' }}>({weight})</span>
        </label>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
          {value} / 5
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
          marginTop: '0.2rem',
        }}
      >
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-success-light)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {renderSlider(
        '1. Sleeping Schedule',
        '22% weight',
        sleepingSchedule,
        setSleepingSchedule,
        '1 = Early Riser (<10 PM)',
        '5 = Night Owl (>1 AM)'
      )}

      {renderSlider(
        '2. Cleanliness & Organization',
        '17% weight',
        cleanliness,
        setCleanliness,
        '1 = Casual / Relaxed',
        '5 = Extremely Neat / Tidy'
      )}

      {renderSlider(
        '3. Room Study Environment',
        '17% weight',
        studyHabits,
        setStudyHabits,
        '1 = Pin-drop Silence',
        '5 = Group Study / Ambient'
      )}

      {renderSlider(
        '4. Noise Tolerance',
        '11% weight',
        noiseTolerance,
        setNoiseTolerance,
        '1 = Highly Sensitive',
        '5 = High Tolerance'
      )}

      {/* Food Preference */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          5. Dietary Preference <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem' }}>(11% weight)</span>
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[
            { val: 'VEGETARIAN', label: '🥗 Pure Vegetarian' },
            { val: 'NON_VEGETARIAN', label: '🍗 Non-Vegetarian' },
            { val: 'FLEXIBLE', label: '🤝 Flexible / Either' },
          ].map((item) => (
            <label
              key={item.val}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${foodPreference === item.val ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: foodPreference === item.val ? 'var(--color-primary-light)' : 'transparent',
                textAlign: 'center',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: foodPreference === item.val ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name="foodPreference"
                value={item.val}
                checked={foodPreference === item.val}
                onChange={() => setFoodPreference(item.val as FoodPreference)}
                style={{ display: 'none' }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {renderSlider(
        '6. Social Preferences',
        '11% weight',
        socialPreference,
        setSocialPreference,
        '1 = Introverted / Quiet Room',
        '5 = Extroverted / Welcomes Guests'
      )}

      {renderSlider(
        '7. AC Temperature Preference',
        '11% weight',
        temperaturePref,
        setTemperaturePref,
        '1 = Warm / Cooler only',
        '5 = Very Cold / Constant AC'
      )}

      <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
        Save 7-Factor Preferences
      </Button>
    </form>
  );
};
