import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { hostelsApi } from '../api/hostelsApi';
import { useAuth } from '../context/AuthContext';
import { HostelSummary } from '../types/hostel';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Hero3DStage } from '../components/home/Hero3DStage';
import { Perspective3DCard } from '../components/home/Perspective3DCard';
import { EconomicsCalculatorModal } from '../components/economics/EconomicsCalculatorModal';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Users,
  Zap,
  Utensils,
} from 'lucide-react';

interface HarmonyPreset {
  id: string;
  label: string;
  score: number;
  summary: string;
  values: number[]; // 7 normalized axes [0.4..1.0]
}

const HARMONY_AXES = ['Sleep', 'Clean', 'Study', 'Noise', 'Diet', 'Social', 'Temp'];

const HARMONY_PRESETS: HarmonyPreset[] = [
  {
    id: 'early',
    label: 'Early Bird',
    score: 94,
    summary: 'Aligned 6 AM schedule, quiet desk study & high tidiness',
    values: [0.95, 0.92, 0.94, 0.9, 0.88, 0.82, 0.92],
  },
  {
    id: 'owl',
    label: 'Night Coder',
    score: 88,
    summary: 'Late-night focus hours, low morning noise & 22°C AC',
    values: [0.85, 0.82, 0.96, 0.88, 0.8, 0.78, 0.94],
  },
  {
    id: 'balanced',
    label: 'Balanced',
    score: 91,
    summary: 'Flexible evening hours, shared meal sync & study breaks',
    values: [0.88, 0.9, 0.86, 0.85, 0.94, 0.92, 0.88],
  },
];

interface TariffTier {
  id: string;
  label: string;
  fee: number;
  includedUnits: number;
  note: string;
}

const TARIFF_TIERS: TariffTier[] = [
  { id: '1ac', label: '1-Seater AC', fee: 146700, includedUnits: 1000, note: 'Standard room · air conditioned · 2026–27 LPU schedule' },
  { id: '2ac', label: '2-Seater AC', fee: 128700, includedUnits: 750, note: 'Standard room · air conditioned · 2026–27 LPU schedule' },
  { id: '3ac', label: '3-Seater AC', fee: 101700, includedUnits: 550, note: 'Standard room · air conditioned · 2026–27 LPU schedule' },
  { id: '4ac', label: '4-Seater AC', fee: 92700, includedUnits: 500, note: 'Standard room · air conditioned · 2026–27 LPU schedule' },
  { id: '4cooler', label: '4-Seater Cooled', fee: 83700, includedUnits: 300, note: 'Standard room · air cooled · 2026–27 LPU schedule' },
  { id: '4studio', label: '4-Seater Studio', fee: 99000, includedUnits: 500, note: 'Studio Apartment AC · box beds & pantry · 2026–27 LPU schedule' },
  { id: 'dorm', label: '5–8 Seater / 4x2', fee: 72000, includedUnits: 250, note: 'Standard multi-seater / BH-1 above porch · air cooled' },
];

const CUISINE_PREVIEWS: Record<string, { title: string; highlight: string; plan: string }> = {
  'North Indian': { title: 'North Indian Standard Mess', highlight: 'Managed by Pro Bricks with automatic chapatti kitchens, 4 vegetarian meals/day & unlimited staples.', plan: 'Standard & Ala Carte · ₹40k–₹56k/yr' },
  'South Indian': { title: 'South Indian Regional', highlight: 'Regional South Indian menu (idli, dosa, sambar, curd rice) served in designated hostel & central dining halls.', plan: 'Standard Regional & Ala Carte' },
  'Rajasthani': { title: 'Rajasthani Regional', highlight: 'Listed LPU regional vegetarian cuisine available across select residential dining zones.', plan: 'Regional Kitchen Counter' },
  'Haryanvi': { title: 'Haryanvi Regional', highlight: 'Listed LPU regional dairy-rich vegetarian option available through Pro Bricks mess plans.', plan: 'Regional Kitchen Counter' },
  'North-Eastern': { title: 'North-Eastern Regional', highlight: 'Listed regional cuisine at specific campus dining locations plus early-class packed breakfast.', plan: 'Designated Regional Location' },
  'North & South Combo': { title: 'North & South Combo (Ala Carte)', highlight: 'Combine Breakfast, Lunch, Evening Snacks & Dinner items flexibly or opt for academic block lunch.', plan: 'Pro Bricks Ala Carte Plan' },
};

function computeRadarPoints(values: number[], cx = 90, cy = 88, radius = 64): string {
  return values
    .map((val, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const r = radius * val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [selectedHostelCode, setSelectedHostelCode] = useState<string>('BH-1');
  const [genderTab, setGenderTab] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Interactive landing widget states
  const [activeHarmonyId, setActiveHarmonyId] = useState<string>('early');
  const [activeTariffId, setActiveTariffId] = useState<string>('4ac');
  const [activeCuisine, setActiveCuisine] = useState<string>('North Indian');

  // Instant Smart Hostel Recommender states
  const [finderWing, setFinderWing] = useState<'MALE' | 'FEMALE'>('MALE');
  const [finderCooling, setFinderCooling] = useState<'AC' | 'COOLER'>('AC');

  const parallaxWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hostelsApi
      .getHostels()
      .then((res) => {
        if (res.hostels && res.hostels.length > 0) {
          setHostels(res.hostels);
        }
      })
      .catch(() => {});
  }, []);

  // Scroll-Driven Parallax Fallback
  useEffect(() => {
    const wrapper = parallaxWrapperRef.current;
    if (!wrapper || typeof window === 'undefined' || typeof CSS === 'undefined') return;

    const supportsScrollTimeline = CSS.supports(
      '(animation-timeline: view()) and (animation-range: entry)'
    );
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (supportsScrollTimeline || prefersReducedMotion) return;

    const layers = wrapper.querySelectorAll<HTMLElement>('.parallax-depth-card');
    let ticking = false;

    const updatePositions = () => {
      ticking = false;
      const rect = wrapper.getBoundingClientRect();
      const winH = window.innerHeight;
      if (rect.bottom < 0 || rect.top > winH) return;
      const progress = Math.max(0, Math.min(1, (winH - rect.top) / (winH + rect.height)));
      layers.forEach((layer, idx) => {
        const offset = (idx + 1) * 28 * (1 - Math.min(1, progress * 1.65));
        layer.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updatePositions);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.addEventListener('scroll', onScroll, { passive: true });
            updatePositions();
          } else {
            window.removeEventListener('scroll', onScroll);
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(wrapper);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const filteredHostels = hostels.filter((h) =>
    genderTab === 'ALL' ? true : h.gender_policy === genderTab
  );

  const activeHarmony = HARMONY_PRESETS.find((p) => p.id === activeHarmonyId) || HARMONY_PRESETS[0];
  const activeTariff = TARIFF_TIERS.find((t) => t.id === activeTariffId) || TARIFF_TIERS[2];
  const activeCuisineInfo = CUISINE_PREVIEWS[activeCuisine] || CUISINE_PREVIEWS['North Indian'];

  // Demo sorting uses only fields present in the sample inventory.
  const recommendedTowers = [...hostels]
    .filter((h) => h.gender_policy === finderWing)
    .sort((a, b) => {
      const scoreA =
        (finderCooling === 'AC' ? a.ac_rooms_count : a.cooler_rooms_count) * 2 +
        a.vacant_beds;
      const scoreB =
        (finderCooling === 'AC' ? b.ac_rooms_count : b.cooler_rooms_count) * 2 +
        b.vacant_beds;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  return (
    <MotionConfig reducedMotion="user">
      <div>
        {/* Homepage: the campus model is the visual anchor. */}
        <section className="hero-3d-fullstage">
          <div className="hero-architectural-grid" aria-hidden="true" />

          <div className="hero-grid-container">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="hero-copy-card"
            >
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-line" aria-hidden="true" />
                <span>LPU residential life</span>
              </div>

              <h1 className="hero-title">
                Hostel Allocation <span className="hero-title-amp">&amp;</span>{' '}
                <span className="hero-title-accent">Roommate Matching</span> System
              </h1>

              <p className="hero-description">
                Explore a 3D hostel preview, compare room options, and find a roommate whose daily routine fits yours.
                Review your choices before you apply.
              </p>

              <div className="hero-actions">
                <Link to="/hostels" className="hero-primary-link">
                  Explore hostels <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to={isAuthenticated ? '/roommates' : '/register'} className="hero-secondary-link">
                  Find a roommate <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <div className="hero-paths" aria-label="LPU residence facts">
                <span><strong>15</strong> LPU hostels (8 Boys · 7 Girls)</span>
                <span><strong>23,000+</strong> hostelers (30,000+ residents)</span>
              </div>
              <p className="hero-data-note">Hostel counts, Pro Bricks tariffs &amp; amenities reflect official <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer">LPU 2026–27 data</a>. Demo room vacancies are interactive test inventory; official booking runs via <a href="https://www.lpu.in/SUSTAINABLE/sdg11/residential-facility.php" target="_blank" rel="noreferrer">LPU UMS</a>.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="hero-canvas-col"
            >
              <div className="hero-scene-label" aria-hidden="true">
                <span className="hero-scene-live" /> Illustrative 3D explorer
              </div>
              <Hero3DStage
                hostels={hostels}
                selectedHostelCode={selectedHostelCode}
                onSelectHostel={setSelectedHostelCode}
              />
            </motion.div>
          </div>
        </section>

        {/* INNOVATIVE SMART HOSTEL & ROOMMATE MATCH FINDER STRIP */}
        <section style={{ padding: '2.5rem 0 0' }}>
          <div className="container">
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderTop: '3px solid var(--brand)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem 2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Explore sample hostel listings
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
                    Browse sample hostels by wing and cooling
                  </h2>
                </div>

                {/* 3 Quick Interactive Preference Selectors */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} role="group" aria-label="Preferred Wing">
                    {(['MALE', 'FEMALE'] as const).map((wing) => (
                      <button
                        key={wing}
                        type="button"
                        onClick={() => setFinderWing(wing)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: finderWing === wing ? 'var(--primary)' : 'transparent',
                          color: finderWing === wing ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {wing === 'MALE' ? 'Boys Wing' : 'Girls Wing'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} role="group" aria-label="Preferred Cooling">
                    {(['AC', 'COOLER'] as const).map((cool) => (
                      <button
                        key={cool}
                        type="button"
                        onClick={() => setFinderCooling(cool)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: finderCooling === cool ? 'var(--primary)' : 'transparent',
                          color: finderCooling === cool ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {cool === 'AC' ? 'AC Suites' : 'Air-Cooled'}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* Instant Top 3 Ranked Results */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {recommendedTowers.length > 0 ? (
                  recommendedTowers.map((tower, idx) => (
                    <div
                      key={tower.id}
                      style={{
                        backgroundColor: 'var(--surface-alt)',
                        border: tower.code === selectedHostelCode ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.15rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }} className="tabular-nums">
                          #{idx + 1} SAMPLE LISTING • {tower.code}
                        </div>
                        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--ink)' }}>
                          {tower.name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }} className="tabular-nums">
                          {tower.vacant_beds} open beds • {finderCooling === 'AC' ? `${tower.ac_rooms_count} AC` : `${tower.cooler_rooms_count} Cooler`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHostelCode(tower.code);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--brand)',
                            backgroundColor: 'rgba(242, 101, 34, 0.1)',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View in 3D ↑
                        </button>
                        <Link to={`/hostels/${tower.id}`} style={{ fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                          Details →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Sample listings are unavailable right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Verified LPU accommodation facts, separate from the demo inventory. */}
        <section className="lpu-facts-section" aria-labelledby="lpu-facts-title">
          <div className="container lpu-facts-grid">
            <figure className="lpu-facts-image-wrap">
              <img src="/lpu-residence.webp" alt="LPU hostel buildings and landscaped courtyard" loading="lazy" />
              <figcaption>Residence buildings at LPU · Photo: <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer">LPU Residential Facilities</a></figcaption>
            </figure>
            <div className="lpu-facts-content">
              <span className="lpu-facts-kicker">Official LPU campus data · 2025–27</span>
              <h2 id="lpu-facts-title">A self-contained city within a campus.</h2>
              <p>Lovely Professional University operates 19 dedicated residential complexes (BH-1 to BH-10 including Boys Studio 9; GH-1 to GH-8 plus Girls Studio 9) across Phagwara campus, accommodating 23,000+ hostel residents (17,000+ boys, 6,500+ girls) and 30,000+ total campus residents—saving students ~35% compared to external PGs.</p>
              <div className="lpu-facts-numbers">
                <div><strong>15</strong><span>8 Boys (BH-1–8) + 7 Girls (GH-1–7)</span></div>
                <div><strong>23,000+</strong><span>hostelers · ~35% cheaper than PG</span></div>
                <div><strong>7,700+</strong><span>CCTV &amp; PTZ cameras · 400+ guards</span></div>
              </div>
              <a className="lpu-facts-source" href="https://www.lpu.in/SUSTAINABLE/sdg11/residential-facility.php" target="_blank" rel="noreferrer">View LPU’s published residential figures <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        {/* 3. PLAYABLE INTERACTIVE CAPABILITY SHOWCASE */}
        <section style={{ padding: '2.5rem 0 4.5rem' }}>
          <div className="container">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Explore the prototype
              </div>
              <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
                Try roommate matching, room rates and dining
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {/* Playable Card 1: Live Interactive SVG Harmony Radar */}
              <Perspective3DCard intensity={6} accentTop style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={16} color="var(--brand)" aria-hidden="true" />
                        Sample compatibility profile
                      </span>
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--status-success)' }} className="tabular-nums">
                        {activeHarmony.score}% sample match
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: '0.45rem' }}>
                      Compare daily routines
                    </h3>

                    {/* Persona Toggle Pills */}
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }} role="group" aria-label="Select sample student lifestyle archetype">
                      {HARMONY_PRESETS.map((preset) => {
                        const active = preset.id === activeHarmony.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setActiveHarmonyId(preset.id)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              minHeight: '30px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-md)',
                              border: active ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
                              backgroundColor: active ? 'var(--primary)' : 'var(--surface-alt)',
                              color: active ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                              cursor: 'pointer',
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Animated SVG Heptagon Radar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                      <svg
                        width="180"
                        height="176"
                        viewBox="0 0 180 176"
                        role="img"
                        aria-label={`Sample 7-factor roommate chart showing ${activeHarmony.score}% compatibility for ${activeHarmony.label}`}
                        style={{ flexShrink: 0 }}
                      >
                        {[0.35, 0.65, 1.0].map((ring) => (
                          <polygon
                            key={ring}
                            points={computeRadarPoints(Array(7).fill(ring))}
                            fill="none"
                            stroke="#CFC8BB"
                            strokeWidth="1"
                            strokeDasharray={ring < 1 ? '3 3' : undefined}
                          />
                        ))}
                        {HARMONY_AXES.map((label, i) => {
                          const angle = (Math.PI * 2 * i) / 7 - Math.PI / 2;
                          const lx = 90 + Math.cos(angle) * 76;
                          const ly = 88 + Math.sin(angle) * 76;
                          return (
                            <text
                              key={label}
                              x={lx}
                              y={ly + 3}
                              fontSize="8.5"
                              fontWeight="600"
                              fill="#5C5750"
                              textAnchor="middle"
                            >
                              {label}
                            </text>
                          );
                        })}
                        <motion.polygon
                          animate={{ points: computeRadarPoints(activeHarmony.values) }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          fill="rgba(242, 101, 34, 0.24)"
                          stroke="#C2410C"
                          strokeWidth="2"
                        />
                      </svg>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.5 }}>
                        <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: '0.25rem' }}>{activeHarmony.label} Profile</strong>
                        {activeHarmony.summary}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={isAuthenticated ? '/roommates' : '/login'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {isAuthenticated ? 'Discover Compatible Roommates' : 'Sign In to Match Roommates'}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </Perspective3DCard>

              {/* Playable Card 2: Interactive Session Tariff & Power Quota Switcher */}
              <Perspective3DCard intensity={6} accentTop style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={16} color="var(--brand)" aria-hidden="true" />
                        LPU published charges · 2026–27
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: '0.45rem' }}>
                      Compare standard room charges
                    </h3>

                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }} role="group" aria-label="Select sample room seater tier">
                      {TARIFF_TIERS.map((tier) => {
                        const active = tier.id === activeTariff.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setActiveTariffId(tier.id)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              minHeight: '30px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-md)',
                              border: active ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
                              backgroundColor: active ? 'var(--primary)' : 'var(--surface-alt)',
                              color: active ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                              cursor: 'pointer',
                            }}
                          >
                            {tier.label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Published residential charge</div>
                          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--ink)' }} className="tabular-nums">
                            ₹{activeTariff.fee.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }} className="tabular-nums">
                            {activeTariff.includedUnits} electricity units included
                          </div>
                        </div>
                      </div>

                      <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <motion.div
                          animate={{ width: `${(activeTariff.includedUnits / 1000) * 100}%` }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          style={{ height: '100%', backgroundColor: 'var(--brand)', borderRadius: 'var(--radius-full)' }}
                        />
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{activeTariff.note}</div>
                      <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Check LPU’s full fee schedule</a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCalcOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Open demo fee estimator
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </Perspective3DCard>

              {/* Playable Card 3: Pro Bricks Regional Dining & Daily Hub */}
              <Perspective3DCard intensity={6} accentTop style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Utensils size={16} color="var(--brand)" aria-hidden="true" />
                        LPU mess options
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: '0.45rem' }}>
                      Regional vegetarian dining
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }} role="group" aria-label="Select regional dining kitchen">
                      {Object.keys(CUISINE_PREVIEWS).map((cuisine) => {
                        const active = cuisine === activeCuisine;
                        return (
                          <button
                            key={cuisine}
                            type="button"
                            onClick={() => setActiveCuisine(cuisine)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              minHeight: '30px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-md)',
                              border: active ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
                              backgroundColor: active ? 'var(--primary)' : 'var(--surface-alt)',
                              color: active ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                              cursor: 'pointer',
                            }}
                          >
                            {cuisine}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>
                        {activeCuisineInfo.title}
                      </div>
                      <p style={{ fontSize: '0.84375rem', color: 'var(--text)', marginBottom: '0.625rem' }}>
                        {activeCuisineInfo.highlight}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                        <span>{activeCuisineInfo.plan}</span>
                        <a href="https://www.lpu.in/lpu-assets/download/prospectus/part-a.pdf" target="_blank" rel="noreferrer">LPU prospectus</a>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/hostels"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Browse demo hostel listings
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </Perspective3DCard>
            </div>
          </div>
        </section>

        {/* 4. SCROLL-DRIVEN PARALLAX INTEGRITY BAND */}
        <section
          ref={parallaxWrapperRef}
          className="parallax-wrapper"
          style={{
            backgroundColor: 'var(--obsidian)',
            color: '#FFFFFF',
            padding: '5rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: '720px', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Residential facilities
              </div>
              <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                Life beyond the room
              </h2>
              <p style={{ color: '#CFC8BB', fontSize: '1.0625rem', margin: 0 }}>
                LPU lists the everyday essentials alongside its hostel rooms, including dining, laundry, study spaces and campus support.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <div
                className="parallax-depth-card"
                style={{
                  backgroundColor: 'var(--obsidian-elevated)',
                  border: '1px solid var(--obsidian-border)',
                  borderTop: '3px solid var(--brand)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                }}
              >
                <Lock size={24} color="var(--brand)" aria-hidden="true" style={{ marginBottom: '0.85rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  24×7 Security, Turnstiles &amp; Uni-Hospital
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#CFC8BB', lineHeight: 1.6, margin: 0 }}>
                  Protected by 400+ full-time security staff, 7,700+ CCTV cameras, metro-style biometric turnstiles, RFID boom barriers, an on-campus fire station, and a 30-bed Uni-Hospital with 24×7 ambulance service.
                </p>
              </div>

              <div
                className="parallax-depth-card"
                style={{
                  backgroundColor: 'var(--obsidian-elevated)',
                  border: '1px solid var(--obsidian-border)',
                  borderTop: '3px solid var(--brand)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                }}
              >
                <ShieldCheck size={24} color="var(--brand)" aria-hidden="true" style={{ marginBottom: '0.85rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Standard Rooms &amp; Studio Apartments
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#CFC8BB', lineHeight: 1.6, margin: 0 }}>
                  Standard 1 to 8-seater rooms and AC Studio Apartments include bed, mattress, desk, chair, almirah, attached washroom with winter geyser (2 hrs/day), and 250–1,000 free electricity units. Studio apartments add Hot &amp; Cold Split AC, box-storage beds &amp; 5A pantry sockets.
                </p>
              </div>

              <div
                className="parallax-depth-card"
                style={{
                  backgroundColor: 'var(--obsidian-elevated)',
                  border: '1px solid var(--obsidian-border)',
                  borderTop: '3px solid var(--brand)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                }}
              >
                <CheckCircle2 size={24} color="var(--brand)" aria-hidden="true" style={{ marginBottom: '0.85rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Uni Mall, 650 Mbps Wi-Fi &amp; Sports Complex
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#CFC8BB', lineHeight: 1.6, margin: 0 }}>
                  Includes Pro Bricks mess plans, optional laundry (₹5,400/yr, 70 clothes/mo), 650 Mbps leased-line Wi-Fi, 20L+ book Central Library (until midnight), 8-storey Uni Mall, 55+ ATMs, and 50%-subsidized Indoor Stadium (3 pools, 25-lane shooting, squash &amp; gym).
                </p>
              </div>
            </div>
            <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#FDBA74', marginTop: '1.5rem', fontWeight: 600 }}>See facilities on LPU’s site <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
        </section>

        {/* 5. COMPLETE 15-HOSTEL LIVE DIRECTORY GRID */}
        <section style={{ padding: '4.5rem 0 3rem' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Prototype inventory
                </div>
                <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
                  Explore sample hostel listings
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="group" aria-label="Filter hostels by wing">
                {(
                  [
                    { key: 'ALL', label: `All (${hostels.length})` },
                    { key: 'MALE', label: 'Boys Wing (BH)' },
                    { key: 'FEMALE', label: 'Girls Wing (GH)' },
                  ] as const
                ).map((tab) => {
                  const active = genderTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setGenderTab(tab.key)}
                      style={{
                        padding: '0.45rem 1rem',
                        minHeight: '38px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        border: active ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
                        backgroundColor: active ? 'var(--primary)' : 'var(--surface)',
                        color: active ? 'var(--primary-foreground, #FFFFFF)' : 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredHostels.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {filteredHostels.map((h) => {
                  const isSelected = h.code === selectedHostelCode;
                  return (
                    <div
                      key={h.id}
                      className="card-hoverable"
                      style={{
                        backgroundColor: 'var(--surface)',
                        border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em' }} className="tabular-nums">
                            {h.code}
                          </span>
                          <Badge variant={h.gender_policy === 'MALE' ? 'info' : 'warning'} size="sm">
                            {h.gender_policy === 'MALE' ? 'Boys' : 'Girls'}
                          </Badge>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                          {h.name}
                        </h3>
                        <div style={{ fontSize: '0.84375rem', color: 'var(--text-muted)' }} className="tabular-nums">
                          {h.vacant_beds} of {h.total_beds} beds open • {h.ac_rooms_count} AC suites
                        </div>
                      </div>

                      <div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.85rem' }}>
                          <div
                            style={{
                              width: `${Math.min(100, h.occupancy_pct)}%`,
                              height: '100%',
                              backgroundColor: 'var(--brand)',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHostelCode(h.code);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                            }}
                          >
                            Fly to Tower in 3D ↑
                          </button>
                          <Link to={`/hostels/${h.id}`} style={{ fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            Inspect <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                Sample listings are unavailable right now.
              </div>
            )}
          </div>
        </section>

        {/* 6. THREE-STEP STUDENT ONBOARDING & COMPLIANCE BANNER */}
        <section style={{ padding: '1.5rem 0 4.5rem' }}>
          <div className="container">
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)', marginBottom: '1.5rem' }}>
                Explore the prototype in three steps
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '0.3rem' }} className="tabular-nums">STEP 01</div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>Create a demo account</h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', margin: 0 }}>
                    Sign in to save your room preferences and explore the app’s sample listings.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '0.3rem' }} className="tabular-nums">STEP 02</div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>Compare roommate routines</h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', margin: 0 }}>
                    Add your lifestyle preferences and review sample compatibility results.
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '0.3rem' }} className="tabular-nums">STEP 03</div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>Choose your room</h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', margin: 0 }}>
                    Compare room types and try the application flow with demo inventory. Official LPU booking is through UMS.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                {isAuthenticated ? (
                  <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="lg">
                      Go to My Dashboard <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="lg">
                        Claim Student Account <ArrowRight size={16} aria-hidden="true" />
                      </Button>
                    </Link>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="lg">
                        Sign In to Portal
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                padding: '1.35rem 1.75rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '4px solid var(--brand)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink)' }}>Official LPU Residential Appliance &amp; Facility Rules:</strong> Permitted in rooms: electric kettle, electric iron, steamer, laptop, mobile charger, trimmer, hair straightener &amp; hair dryer. Induction plates are permitted <strong>only in Studio Apartments</strong> (up to 5A load); heaters, convectors &amp; immersion rods are prohibited. See the <a href="https://www.lpu.in/lpu-assets/download/Students-Residential-Mess-Laundry-Transport-Parking-Loan-Facility.pdf" target="_blank" rel="noreferrer">official LPU residential guidelines PDF</a> or <a href="https://www.lpu.in/student-services/residence.php/" target="_blank" rel="noreferrer">residence portal</a>.
              </div>
            </div>
          </div>
        </section>

        <EconomicsCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
      </div>
    </MotionConfig>
  );
};
