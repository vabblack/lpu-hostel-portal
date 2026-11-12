import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HostelSummary } from '../../types/hostel';
import {
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Building2,
  Box,
  ArrowUpRight,
  Compass,
  Layers,
  Grid,
  BedDouble,
  Sun,
  Moon,
  Wind,
} from 'lucide-react';

interface Hero3DStageProps {
  hostels: HostelSummary[];
  selectedHostelCode: string;
  onSelectHostel: (code: string) => void;
}

type SceneMode = 'campus' | 'suite';
type RenderStyle = 'solid' | 'wireframe';
type SuiteAmbience = 'sun' | 'night' | 'airflow';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Face3D {
  points: Vec3[];
  baseHex: string;
  alpha?: number;
  stroke?: string;
  lineWidth?: number;
  hostelCode?: string;
  bedId?: string;
  unlit?: boolean;
  avgZ: number;
  shade: number;
}

interface TowerBlueprint {
  code: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  floors: number;
  gender: 'MALE' | 'FEMALE' | 'CO_ED';
  vacantBeds: number;
  totalBeds: number;
  occupancyPct: number;
  acRooms: number;
  minFee: number | null;
  id?: number;
}

interface SuiteBedInfo {
  id: string;
  label: string;
  x: number;
  z: number;
  vacant: boolean;
  wing: string;
  spec: string;
}

const SUITE_BEDS: SuiteBedInfo[] = [
  { id: 'A', label: 'Bed A', x: -2.2, z: -1.35, vacant: true, wing: 'North Window Desk', spec: 'Available • 450 kWh/yr quota' },
  { id: 'B', label: 'Bed B', x: -2.2, z: 1.45, vacant: false, wing: 'South Wardrobe Bay', spec: 'Occupied • B.Tech CSE (2025)' },
  { id: 'C', label: 'Bed C', x: 2.2, z: -1.35, vacant: true, wing: 'Balcony Light Side', spec: 'Available • Near Study Table' },
  { id: 'D', label: 'Bed D', x: 2.2, z: 1.45, vacant: false, wing: 'Private Suite Corner', spec: 'Occupied • B.Tech AI (2025)' },
];

const FALLBACK_TOWERS: TowerBlueprint[] = [
  // Boys Wing — Official LPU BH-1 to BH-10 (West/North Quad, incl. Boys Studio 9)
  { code: 'BH-1', name: 'Boys Hostel 1', x: -5.6, z: -2.8, w: 1.5, d: 1.3, h: 3.9, floors: 7, gender: 'MALE', vacantBeds: 42, totalBeds: 132, occupancyPct: 68, acRooms: 18, minFee: 80000 },
  { code: 'BH-2', name: 'Boys Hostel 2', x: -3.4, z: -3.0, w: 1.45, d: 1.25, h: 3.3, floors: 6, gender: 'MALE', vacantBeds: 36, totalBeds: 132, occupancyPct: 73, acRooms: 18, minFee: 80000 },
  { code: 'BH-3', name: 'Boys Hostel 3', x: -1.2, z: -2.8, w: 1.4, d: 1.25, h: 3.6, floors: 6, gender: 'MALE', vacantBeds: 28, totalBeds: 132, occupancyPct: 79, acRooms: 18, minFee: 80000 },
  { code: 'BH-4', name: 'Boys Hostel 4', x: -5.7, z: -0.3, w: 1.45, d: 1.35, h: 3.0, floors: 5, gender: 'MALE', vacantBeds: 31, totalBeds: 132, occupancyPct: 76, acRooms: 18, minFee: 80000 },
  { code: 'BH-5', name: 'Boys Hostel 5', x: -3.4, z: -0.4, w: 1.55, d: 1.35, h: 4.4, floors: 8, gender: 'MALE', vacantBeds: 54, totalBeds: 132, occupancyPct: 59, acRooms: 18, minFee: 80000 },
  { code: 'BH-6', name: 'Boys Hostel 6', x: -1.2, z: -0.2, w: 1.4, d: 1.25, h: 2.8, floors: 5, gender: 'MALE', vacantBeds: 24, totalBeds: 132, occupancyPct: 82, acRooms: 18, minFee: 80000 },
  { code: 'BH-7', name: 'Boys Hostel 7', x: -4.6, z: 2.3, w: 1.55, d: 1.35, h: 3.8, floors: 7, gender: 'MALE', vacantBeds: 44, totalBeds: 132, occupancyPct: 67, acRooms: 18, minFee: 80000 },
  { code: 'BH-8', name: 'Boys Hostel 8', x: -1.9, z: 2.4, w: 1.5, d: 1.25, h: 3.2, floors: 6, gender: 'MALE', vacantBeds: 38, totalBeds: 132, occupancyPct: 71, acRooms: 18, minFee: 80000 },
  { code: 'BH-9', name: 'Boys Studio 9 (BH-9)', x: -6.4, z: 3.4, w: 1.5, d: 1.3, h: 4.2, floors: 8, gender: 'MALE', vacantBeds: 22, totalBeds: 54, occupancyPct: 59, acRooms: 24, minFee: 110000 },
  { code: 'BH-10', name: 'Boys Hostel 10 (BH-10)', x: -3.2, z: 3.9, w: 1.55, d: 1.25, h: 4.1, floors: 8, gender: 'MALE', vacantBeds: 24, totalBeds: 54, occupancyPct: 56, acRooms: 24, minFee: 110000 },
  // Girls Wing — Official LPU GH-1 to GH-8 & Girls Studio 9 (East/South Quad)
  { code: 'GH-1', name: 'Girls Hostel 1', x: 2.0, z: -2.9, w: 1.45, d: 1.25, h: 3.8, floors: 7, gender: 'FEMALE', vacantBeds: 48, totalBeds: 132, occupancyPct: 64, acRooms: 18, minFee: 80000 },
  { code: 'GH-2', name: 'Girls Hostel 2', x: 4.6, z: -2.8, w: 1.4, d: 1.2, h: 3.3, floors: 6, gender: 'FEMALE', vacantBeds: 39, totalBeds: 132, occupancyPct: 70, acRooms: 18, minFee: 80000 },
  { code: 'GH-3', name: 'Girls Hostel 3', x: 2.1, z: -0.6, w: 1.5, d: 1.3, h: 4.3, floors: 8, gender: 'FEMALE', vacantBeds: 52, totalBeds: 132, occupancyPct: 61, acRooms: 18, minFee: 80000 },
  { code: 'GH-4', name: 'Girls Hostel 4', x: 4.7, z: -0.5, w: 1.4, d: 1.25, h: 3.0, floors: 5, gender: 'FEMALE', vacantBeds: 29, totalBeds: 132, occupancyPct: 78, acRooms: 18, minFee: 80000 },
  { code: 'GH-5', name: 'Girls Hostel 5', x: 2.0, z: 1.75, w: 1.4, d: 1.25, h: 3.5, floors: 6, gender: 'FEMALE', vacantBeds: 35, totalBeds: 132, occupancyPct: 73, acRooms: 18, minFee: 80000 },
  { code: 'GH-6', name: 'Girls Hostel 6', x: 4.7, z: 1.7, w: 1.45, d: 1.25, h: 2.9, floors: 5, gender: 'FEMALE', vacantBeds: 32, totalBeds: 132, occupancyPct: 76, acRooms: 18, minFee: 80000 },
  { code: 'GH-7', name: 'Girls Hostel 7', x: 2.2, z: 3.5, w: 1.55, d: 1.3, h: 4.0, floors: 7, gender: 'FEMALE', vacantBeds: 46, totalBeds: 132, occupancyPct: 65, acRooms: 18, minFee: 80000 },
  { code: 'GH-8', name: 'Girls Hostel 8 (GH-8)', x: 4.9, z: 3.6, w: 1.5, d: 1.25, h: 3.7, floors: 7, gender: 'FEMALE', vacantBeds: 40, totalBeds: 132, occupancyPct: 70, acRooms: 18, minFee: 80000 },
  { code: 'GS-9', name: 'Girls Studio 9 (Apartments)', x: 6.7, z: 1.0, w: 1.5, d: 1.3, h: 4.1, floors: 8, gender: 'FEMALE', vacantBeds: 24, totalBeds: 54, occupancyPct: 56, acRooms: 24, minFee: 110000 },
];

// Campus boulevard & quad courtyard architectural trees
const CAMPUS_TREES: Array<{ x: number; z: number; s: number }> = [
  { x: 0.0, z: -3.5, s: 0.9 },
  { x: 0.0, z: -1.4, s: 1.05 },
  { x: 0.0, z: 1.1, s: 0.95 },
  { x: 0.0, z: 3.3, s: 0.85 },
  { x: 1.05, z: -3.5, s: 0.95 },
  { x: 1.05, z: -1.2, s: 1.0 },
  { x: 1.05, z: 1.3, s: 0.9 },
  { x: 1.05, z: 3.3, s: 1.0 },
  { x: -6.5, z: 2.3, s: 1.0 },
  { x: 6.1, z: -1.3, s: 0.95 },
];

const LIGHT_MOTES: Vec3[] = Array.from({ length: 22 }, (_, i) => ({
  x: Math.sin(i * 1.9) * 7.5,
  y: 0.8 + ((i * 0.65) % 4.4),
  z: Math.cos(i * 2.3) * 5.2,
}));

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function shadeColor(hex: string, factor: number, alpha = 1): string {
  const [r, g, b] = hexToRgb(hex);
  const f = Math.max(0.32, Math.min(1.25, factor));
  const rr = Math.min(255, Math.round(r * f));
  const gg = Math.min(255, Math.round(g * f));
  const bb = Math.min(255, Math.round(b * f));
  return alpha < 1 ? `rgba(${rr}, ${gg}, ${bb}, ${alpha})` : `rgb(${rr}, ${gg}, ${bb})`;
}

// Overhead-looking 3D camera transform: positive pitch tilts camera ABOVE looking DOWN!
function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = p.y * cosP + z1 * sinP;
  const z2 = -p.y * sinP + z1 * cosP;

  return { x: x1, y: y2, z: z2 };
}

function computeNormal(pts: Vec3[]): Vec3 {
  const a = pts[0];
  const b = pts[1];
  const c = pts[2];
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const nx = u.y * v.z - u.z * v.y;
  const ny = u.z * v.x - u.x * v.z;
  const nz = u.x * v.y - u.y * v.x;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

function projectPoint(
  p: Vec3,
  cx: number,
  cy: number,
  focal: number,
  camDist: number
): { sx: number; sy: number; depth: number } {
  const z = p.z + camDist;
  const safeZ = Math.max(2.5, z);
  const scale = focal / safeZ;
  return {
    sx: cx + p.x * scale,
    sy: cy - p.y * scale,
    depth: z,
  };
}

function createBoxFaces(
  cx: number,
  cyBase: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  baseHex: string,
  options?: {
    topHex?: string;
    stroke?: string;
    lineWidth?: number;
    hostelCode?: string;
    bedId?: string;
    alpha?: number;
    unlit?: boolean;
    includeBottom?: boolean;
  }
): Omit<Face3D, 'avgZ' | 'shade'>[] {
  const hw = w / 2;
  const hd = d / 2;
  const y0 = cyBase;
  const y1 = cyBase + h;

  const v = [
    { x: cx - hw, y: y0, z: cz - hd }, // 0 back-left-bottom
    { x: cx + hw, y: y0, z: cz - hd }, // 1 back-right-bottom
    { x: cx + hw, y: y0, z: cz + hd }, // 2 front-right-bottom
    { x: cx - hw, y: y0, z: cz + hd }, // 3 front-left-bottom
    { x: cx - hw, y: y1, z: cz - hd }, // 4 back-left-top
    { x: cx + hw, y: y1, z: cz - hd }, // 5 back-right-top
    { x: cx + hw, y: y1, z: cz + hd }, // 6 front-right-top
    { x: cx - hw, y: y1, z: cz + hd }, // 7 front-left-top
  ];

  const opts = options || {};
  const faces: Omit<Face3D, 'avgZ' | 'shade'>[] = [
    { points: [v[4], v[7], v[6], v[5]], baseHex: opts.topHex || baseHex, ...opts }, // top
    { points: [v[3], v[2], v[6], v[7]], baseHex, ...opts }, // front
    { points: [v[1], v[0], v[4], v[5]], baseHex, ...opts }, // back
    { points: [v[0], v[3], v[7], v[4]], baseHex, ...opts }, // left
    { points: [v[2], v[1], v[5], v[6]], baseHex, ...opts }, // right
  ];

  if (opts.includeBottom) {
    faces.push({ points: [v[0], v[1], v[2], v[3]], baseHex, ...opts });
  }

  return faces;
}

export const Hero3DStage: React.FC<Hero3DStageProps> = ({
  hostels,
  selectedHostelCode,
  onSelectHostel,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<SceneMode>('campus');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('solid');
  const [suiteAmbience, setSuiteAmbience] = useState<SuiteAmbience>('sun');
  const [explodePct, setExplodePct] = useState<number>(25);
  const [selectedBedId, setSelectedBedId] = useState<string>('A');
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [hoveredBed, setHoveredBed] = useState<string | null>(null);
  const [pinPosition, setPinPosition] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const cameraRef = useRef({
    yaw: -0.58,
    pitch: 0.52,
    targetYaw: -0.58,
    targetPitch: 0.52,
    zoom: 1.0,
    targetZoom: 1.0,
    pointerTiltX: 0,
    pointerTiltY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartYaw: -0.58,
    dragStartPitch: 0.52,
    didDrag: false,
  });

  const isVisibleRef = useRef(true);
  const canvasSizeRef = useRef({ w: 800, h: 560 });
  const hitTowersRef = useRef<Array<{ code: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number }>>([]);
  const hitBedsRef = useRef<Array<{ id: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number }>>([]);
  const timeRef = useRef(0);

  // Sync range slider CSS custom properties
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.style.setProperty('--attr-min', slider.min || '0');
    slider.style.setProperty('--attr-max', slider.max || '100');
    slider.style.setProperty('--control-value', String(explodePct));
  }, [explodePct, mode]);

  const towers: TowerBlueprint[] = FALLBACK_TOWERS.map((bp) => {
    const live = hostels.find((h) => h.code === bp.code);
    if (!live) return bp;
    const heightScale = Math.max(2.6, Math.min(4.7, 2.1 + (live.total_beds || 120) / 68));
    return {
      ...bp,
      id: live.id,
      name: live.name,
      gender: live.gender_policy,
      vacantBeds: live.vacant_beds,
      totalBeds: live.total_beds,
      occupancyPct: live.occupancy_pct,
      acRooms: live.ac_rooms_count,
      minFee: live.min_standard_fee,
      h: heightScale,
    };
  });

  const selectedHostel = hostels.find((h) => h.code === selectedHostelCode) || null;
  const selectedTower = towers.find((t) => t.code === selectedHostelCode) || towers[0];
  const selectedBed = SUITE_BEDS.find((b) => b.id === selectedBedId) || SUITE_BEDS[0];

  const setCameraPreset = useCallback((preset: 'iso' | 'aerial' | 'low') => {
    const cam = cameraRef.current;
    if (preset === 'iso') {
      cam.targetYaw = -0.58;
      cam.targetPitch = 0.52;
      cam.targetZoom = 1.0;
    } else if (preset === 'aerial') {
      cam.targetYaw = -0.18;
      cam.targetPitch = 0.94;
      cam.targetZoom = 0.96;
    } else if (preset === 'low') {
      cam.targetYaw = -0.82;
      cam.targetPitch = 0.34;
      cam.targetZoom = 1.08;
    }
  }, []);

  const handleZoom = (delta: number) => {
    const cam = cameraRef.current;
    cam.targetZoom = Math.max(0.75, Math.min(1.45, cam.targetZoom + delta));
  };

  // Efficient Background Processing (contentvisibilityautostatechange + IntersectionObserver fallback)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const handleVisibilityState = (event: Event) => {
      const cvEvent = event as Event & { skipped?: boolean };
      isVisibleRef.current = !cvEvent.skipped;
    };

    const supportsCV = 'contentVisibility' in document.documentElement.style;
    if (supportsCV) {
      el.addEventListener('contentvisibilityautostatechange', handleVisibilityState);
      return () => el.removeEventListener('contentvisibilityautostatechange', handleVisibilityState);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Main Real-Time 3D Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTimestamp = performance.now();

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvasSizeRef.current = { w: Math.max(280, rect.width), h: Math.max(300, rect.height) };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(280, Math.floor(rect.width * dpr));
      const height = Math.max(300, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Directional key light vector (warm upper-front-left)
    const rawLight = { x: -0.45, y: 0.85, z: -0.35 };
    const lightLen = Math.hypot(rawLight.x, rawLight.y, rawLight.z);
    const lightDir = { x: rawLight.x / lightLen, y: rawLight.y / lightLen, z: rawLight.z / lightLen };

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);
      if (!isVisibleRef.current) return;

      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      timeRef.current += dt;

      const cam = cameraRef.current;
      if (!isPaused && !cam.isDragging) {
        cam.targetYaw += dt * 0.14;
      }

      cam.yaw += (cam.targetYaw + cam.pointerTiltX * 0.14 - cam.yaw) * 0.09;
      cam.pitch += (cam.targetPitch + cam.pointerTiltY * 0.08 - cam.pitch) * 0.09;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.1;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      // Balanced projection framing inside the dedicated 3D viewport so nothing overflows!
      const cx = cssW * 0.49;
      const cy = cssH * (mode === 'campus' ? 0.56 : 0.56);
      const focal = Math.min(cssW * 0.92, cssH * 1.18) * cam.zoom;
      const camDist = mode === 'campus' ? 23.5 : 14.5;

      // Ambient warm radial studio glow
      const spotlight = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(cssW, cssH) * 0.54);
      spotlight.addColorStop(0, mode === 'suite' && suiteAmbience === 'airflow' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(242, 101, 34, 0.2)');
      spotlight.addColorStop(0.5, 'rgba(194, 65, 12, 0.05)');
      spotlight.addColorStop(1, 'rgba(13, 12, 11, 0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, cssW, cssH);

      // Extended 3D ground coordinate grid
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = renderStyle === 'wireframe' ? 'rgba(242, 101, 34, 0.16)' : 'rgba(255, 255, 255, 0.04)';
      const gridRange = 10;
      for (let g = -gridRange; g <= gridRange; g += 2) {
        const p1 = projectPoint(rotatePoint({ x: g, y: -0.45, z: -gridRange }, cam.yaw, cam.pitch), cx, cy, focal, camDist);
        const p2 = projectPoint(rotatePoint({ x: g, y: -0.45, z: gridRange }, cam.yaw, cam.pitch), cx, cy, focal, camDist);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();

        const p3 = projectPoint(rotatePoint({ x: -gridRange, y: -0.45, z: g }, cam.yaw, cam.pitch), cx, cy, focal, camDist);
        const p4 = projectPoint(rotatePoint({ x: gridRange, y: -0.45, z: g }, cam.yaw, cam.pitch), cx, cy, focal, camDist);
        ctx.beginPath();
        ctx.moveTo(p3.sx, p3.sy);
        ctx.lineTo(p4.sx, p4.sy);
        ctx.stroke();
      }

      const faces: Face3D[] = [];

      const pushFaces = (rawFaces: Omit<Face3D, 'avgZ' | 'shade'>[]) => {
        for (const f of rawFaces) {
          const rotated = f.points.map((pt) => rotatePoint(pt, cam.yaw, cam.pitch));
          const avgZ = rotated.reduce((acc, p) => acc + p.z, 0) / rotated.length;
          let shade = 1.0;
          if (!f.unlit) {
            const normal = computeNormal(rotated);
            const dot = normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z;
            shade = 0.65 + Math.max(-0.22, dot) * 0.44;
          }
          faces.push({
            ...f,
            points: rotated,
            avgZ,
            shade,
          });
        }
      };

      const explodeFactor = explodePct / 100;

      if (mode === 'campus') {
        // Campus Architectural Plinth
        pushFaces(
          createBoxFaces(-0.2, -0.42, -0.2, 14.2, 0.42, 8.4, '#1B1815', {
            topHex: '#24201C',
            stroke: renderStyle === 'wireframe' ? 'rgba(242,101,34,0.45)' : 'rgba(255,255,255,0.1)',
            lineWidth: 1,
          })
        );

        // Central Illuminated Campus Boulevard
        pushFaces(
          createBoxFaces(0.52, -0.01, -0.2, 0.68, 0.04, 7.6, '#C2410C', {
            topHex: '#F26522',
            alpha: 0.9,
            stroke: '#FDBA74',
            lineWidth: 0.9,
            unlit: true,
          })
        );

        // Animated light pulses travelling along the boulevard
        if (!isPaused) {
          for (let pulse = 0; pulse < 3; pulse++) {
            const zPulse = ((timeRef.current * 1.9 + pulse * 2.5) % 7.0) - 3.6;
            pushFaces(
              createBoxFaces(0.52, 0.04, zPulse, 0.22, 0.04, 0.42, '#FFF7ED', {
                topHex: '#FFFFFF',
                unlit: true,
              })
            );
          }
        }

        // Stylized Architectural Campus Trees
        CAMPUS_TREES.forEach((tr) => {
          pushFaces(
            createBoxFaces(tr.x, 0.0, tr.z, 0.12 * tr.s, 0.25 * tr.s, 0.12 * tr.s, '#57534E', {
              topHex: '#78716C',
            })
          );
          pushFaces(
            createBoxFaces(tr.x, 0.24 * tr.s, tr.z, 0.42 * tr.s, 0.36 * tr.s, 0.42 * tr.s, '#1E6B3A', {
              topHex: '#22C55E',
              stroke: 'rgba(134, 239, 172, 0.35)',
              lineWidth: 0.6,
            })
          );
        });

        // 19 Architectural LPU Hostel Towers (BH-1..BH-10 incl. Boys Studio 9 & GH-1..GS-9)
        towers.forEach((tower) => {
          const isSelected = tower.code === selectedHostelCode;
          const isHovered = tower.code === hoveredCode;
          const isBoys = tower.gender === 'MALE';

          const liftY =
            explodeFactor * (isSelected ? 0.72 : 0.18) +
            (isSelected ? 0.22 + (isPaused ? 0 : Math.sin(timeRef.current * 2.8) * 0.05) : isHovered ? 0.1 : 0);

          // Cast Ground Shadow Polygon on Plinth
          pushFaces([
            {
              points: [
                { x: tower.x - tower.w * 0.48, y: 0.005, z: tower.z - tower.d * 0.48 },
                { x: tower.x + tower.w * 0.72, y: 0.005, z: tower.z - tower.d * 0.32 },
                { x: tower.x + tower.w * 0.78, y: 0.005, z: tower.z + tower.d * 0.72 },
                { x: tower.x - tower.w * 0.32, y: 0.005, z: tower.z + tower.d * 0.62 },
              ],
              baseHex: '#060605',
              alpha: 0.48,
              unlit: true,
            },
          ]);

          // Base Architectural Podium
          pushFaces(
            createBoxFaces(tower.x, liftY, tower.z, tower.w + 0.22, 0.22, tower.d + 0.22, isSelected ? '#EA580C' : '#2D2925', {
              topHex: isSelected ? '#F97316' : '#3C3630',
              stroke: isSelected ? '#FDBA74' : 'rgba(255,255,255,0.16)',
              lineWidth: 0.9,
              hostelCode: tower.code,
            })
          );

          // Main Tower Shaft
          const shaftColor = isSelected ? '#C2410C' : isBoys ? '#2B2622' : '#343029';
          const roofColor = isSelected ? '#F97316' : isBoys ? '#3E3731' : '#474137';
          const edgeStroke = isSelected
            ? '#FED7AA'
            : isHovered
            ? '#F26522'
            : isBoys
            ? 'rgba(242, 101, 34, 0.42)'
            : 'rgba(234, 179, 8, 0.4)';

          pushFaces(
            createBoxFaces(tower.x, liftY + 0.22, tower.z, tower.w, tower.h, tower.d, shaftColor, {
              topHex: roofColor,
              stroke: edgeStroke,
              lineWidth: isSelected ? 1.75 : 0.95,
              hostelCode: tower.code,
              alpha: renderStyle === 'wireframe' ? 0.16 : 1,
            })
          );

          // Glowing Multi-Floor Window Ribbons on All 4 Facades
          if (renderStyle !== 'wireframe') {
            const bandCount = Math.min(5, tower.floors);
            const litCutoff = Math.round((tower.occupancyPct / 100) * bandCount);
            for (let fl = 0; fl < bandCount; fl++) {
              const fy = liftY + 0.45 + (fl / bandCount) * (tower.h - 0.5);
              const isLit = fl < litCutoff || isSelected;
              const winColor = isLit ? (isBoys ? '#FDBA74' : '#FEF08A') : '#57534E';
              const winAlpha = isLit ? (isSelected ? 0.92 : 0.7) : 0.32;

              // Front window band
              pushFaces([
                {
                  points: [
                    { x: tower.x - tower.w * 0.36, y: fy, z: tower.z + tower.d * 0.506 },
                    { x: tower.x + tower.w * 0.36, y: fy, z: tower.z + tower.d * 0.506 },
                    { x: tower.x + tower.w * 0.36, y: fy + 0.11, z: tower.z + tower.d * 0.506 },
                    { x: tower.x - tower.w * 0.36, y: fy + 0.11, z: tower.z + tower.d * 0.506 },
                  ],
                  baseHex: winColor,
                  alpha: winAlpha,
                  unlit: true,
                  hostelCode: tower.code,
                },
              ]);

              // Back window band
              pushFaces([
                {
                  points: [
                    { x: tower.x + tower.w * 0.36, y: fy, z: tower.z - tower.d * 0.506 },
                    { x: tower.x - tower.w * 0.36, y: fy, z: tower.z - tower.d * 0.506 },
                    { x: tower.x - tower.w * 0.36, y: fy + 0.11, z: tower.z - tower.d * 0.506 },
                    { x: tower.x + tower.w * 0.36, y: fy + 0.11, z: tower.z - tower.d * 0.506 },
                  ],
                  baseHex: winColor,
                  alpha: winAlpha * 0.85,
                  unlit: true,
                  hostelCode: tower.code,
                },
              ]);

              // Right window band
              pushFaces([
                {
                  points: [
                    { x: tower.x + tower.w * 0.506, y: fy, z: tower.z + tower.d * 0.36 },
                    { x: tower.x + tower.w * 0.506, y: fy, z: tower.z - tower.d * 0.36 },
                    { x: tower.x + tower.w * 0.506, y: fy + 0.11, z: tower.z - tower.d * 0.36 },
                    { x: tower.x + tower.w * 0.506, y: fy + 0.11, z: tower.z + tower.d * 0.36 },
                  ],
                  baseHex: winColor,
                  alpha: winAlpha * 0.9,
                  unlit: true,
                  hostelCode: tower.code,
                },
              ]);

              // Left window band
              pushFaces([
                {
                  points: [
                    { x: tower.x - tower.w * 0.506, y: fy, z: tower.z - tower.d * 0.36 },
                    { x: tower.x - tower.w * 0.506, y: fy, z: tower.z + tower.d * 0.36 },
                    { x: tower.x - tower.w * 0.506, y: fy + 0.11, z: tower.z + tower.d * 0.36 },
                    { x: tower.x - tower.w * 0.506, y: fy + 0.11, z: tower.z - tower.d * 0.36 },
                  ],
                  baseHex: winColor,
                  alpha: winAlpha * 0.8,
                  unlit: true,
                  hostelCode: tower.code,
                },
              ]);
            }
          }

          // Architectural Rooftop Penthouse / Crown Light
          pushFaces(
            createBoxFaces(
              tower.x,
              liftY + 0.22 + tower.h,
              tower.z,
              tower.w * 0.72,
              0.2,
              tower.d * 0.72,
              isBoys ? '#F26522' : '#EAB308',
              {
                topHex: isBoys ? '#FB923C' : '#FACC15',
                stroke: '#FFFFFF',
                lineWidth: 0.7,
                hostelCode: tower.code,
                unlit: isSelected,
              }
            )
          );

          if (tower.h >= 3.9 || isSelected) {
            pushFaces(
              createBoxFaces(tower.x, liftY + 0.42 + tower.h, tower.z, 0.08, 0.42, 0.08, '#FFFFFF', {
                topHex: '#FFFFFF',
                unlit: true,
                hostelCode: tower.code,
              })
            );
          }
        });
      } else {
        // MODE 2: EXPLODED 3D SUITE CUTAWAY WITH ROOM AMBIENCE SIMULATOR
        const layerFloorY = -0.25;
        const layerLivingY = explodeFactor * 0.55;
        const layerCanopyY = 2.6 + explodeFactor * 1.45;
        const isNight = suiteAmbience === 'night';

        // Floor Slab
        pushFaces(
          createBoxFaces(0, layerFloorY, 0, 7.2, 0.25, 5.9, '#1A1815', {
            topHex: isNight ? '#1E1B18' : '#28231E',
            stroke: 'rgba(242, 101, 34, 0.5)',
            lineWidth: 1.2,
          })
        );

        // Hardwood Center Carpet / Inlay
        pushFaces(
          createBoxFaces(0, layerFloorY + 0.25, 0.1, 3.6, 0.03, 2.5, '#C2410C', {
            topHex: '#EA580C',
            alpha: isNight ? 0.25 : 0.4,
            stroke: 'rgba(253, 186, 116, 0.45)',
            lineWidth: 0.8,
            unlit: true,
          })
        );

        // Ambience Effect 1: Golden Sunlight Projection on Floor
        if (suiteAmbience === 'sun') {
          pushFaces([
            {
              points: [
                { x: -1.1, y: layerFloorY + 0.29, z: -2.5 },
                { x: 1.5, y: layerFloorY + 0.29, z: -2.5 },
                { x: 2.1, y: layerFloorY + 0.29, z: 0.4 },
                { x: -0.5, y: layerFloorY + 0.29, z: 0.4 },
              ],
              baseHex: '#FDE047',
              alpha: 0.2,
              unlit: true,
            },
          ]);
        }

        // Cutaway North & West Walls
        pushFaces(
          createBoxFaces(0, layerLivingY, -2.82, 7.2, 2.45, 0.24, isNight ? '#201D1A' : '#2C2722', {
            topHex: '#3D3831',
            stroke: 'rgba(255,255,255,0.2)',
            lineWidth: 1,
            alpha: renderStyle === 'wireframe' ? 0.2 : 1,
          })
        );
        pushFaces(
          createBoxFaces(-3.48, layerLivingY, 0.1, 0.24, 2.45, 5.6, isNight ? '#1C1916' : '#27231E', {
            topHex: '#3D3831',
            stroke: 'rgba(255,255,255,0.2)',
            lineWidth: 1,
            alpha: renderStyle === 'wireframe' ? 0.2 : 1,
          })
        );

        // Panoramic Window Glass
        pushFaces(
          createBoxFaces(0.25, layerLivingY + 0.9, -2.68, 2.5, 1.2, 0.08, isNight ? '#1E293B' : '#38BDF8', {
            topHex: '#7DD3FC',
            alpha: isNight ? 0.55 : 0.48,
            stroke: isNight ? '#64748B' : '#BAE6FD',
            lineWidth: 1.2,
            unlit: true,
          })
        );

        // Wall-Mounted Split AC Unit
        pushFaces(
          createBoxFaces(-2.0, layerLivingY + 1.88, -2.6, 1.4, 0.34, 0.3, '#E7E5E4', {
            topHex: '#FFFFFF',
            stroke: suiteAmbience === 'airflow' ? '#38BDF8' : 'rgba(255,255,255,0.75)',
            lineWidth: 1,
          })
        );

        // Ambience Effect 3: Animated 3D AC Cool Airflow Ribbons
        if (suiteAmbience === 'airflow') {
          const waveCount = 3;
          for (let wv = 0; wv < waveCount; wv++) {
            const phase = ((timeRef.current * 1.4 + wv * 0.33) % 1);
            const zFlow = -2.2 + phase * 3.8;
            const yFlow = layerLivingY + 1.78 - phase * 0.75;
            pushFaces(
              createBoxFaces(-2.0, yFlow, zFlow, 1.1, 0.04, 0.22, '#38BDF8', {
                topHex: '#BAE6FD',
                alpha: 0.6 * (1 - phase),
                unlit: true,
              })
            );
          }
        }

        // 4 Interactive Clickable Beds (A, B, C, D)
        SUITE_BEDS.forEach((bed) => {
          const isSel = bed.id === selectedBedId;
          const isHov = bed.id === hoveredBed;
          const bedLift = layerLivingY + (isSel ? 0.16 : isHov ? 0.08 : 0);

          pushFaces(
            createBoxFaces(bed.x, bedLift, bed.z, 1.9, 0.32, 1.1, isSel ? '#7C2D12' : '#292524', {
              topHex: isSel ? '#C2410C' : '#44403C',
              stroke: isSel ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
              lineWidth: isSel ? 1.5 : 0.8,
              bedId: bed.id,
            })
          );
          pushFaces(
            createBoxFaces(bed.x, bedLift + 0.32, bed.z, 1.8, 0.18, 1.0, bed.vacant ? '#16A34A' : '#C2410C', {
              topHex: bed.vacant ? '#22C55E' : '#F26522',
              stroke: isSel ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              lineWidth: isSel ? 1.6 : 0.8,
              bedId: bed.id,
            })
          );
          pushFaces(
            createBoxFaces(bed.x < 0 ? bed.x - 0.64 : bed.x + 0.64, bedLift + 0.5, bed.z, 0.4, 0.12, 0.68, '#E8E4DC', {
              topHex: '#FFFFFF',
              bedId: bed.id,
            })
          );
        });

        // Twin Study Desk & Warm Glowing Night-Study Laptop Screens
        pushFaces(
          createBoxFaces(0, layerLivingY + 0.6, 0.15, 1.65, 0.1, 1.0, '#A8A29E', {
            topHex: '#E7E5E4',
            stroke: 'rgba(255,255,255,0.35)',
          })
        );
        pushFaces(
          createBoxFaces(0, layerLivingY, 0.15, 0.4, 0.6, 0.4, '#292524', {
            topHex: '#44403C',
          })
        );
        // Glowing Study Lamp / Monitor
        pushFaces(
          createBoxFaces(-0.3, layerLivingY + 0.7, 0.15, 0.42, 0.32, 0.05, isNight ? '#FDBA74' : '#F26522', {
            topHex: '#FFF7ED',
            unlit: true,
          })
        );
        if (isNight) {
          // Warm study pool glow on desk
          pushFaces(
            createBoxFaces(-0.3, layerLivingY + 0.705, 0.25, 0.85, 0.01, 0.65, '#FDBA74', {
              topHex: '#FED7AA',
              alpha: 0.35,
              unlit: true,
            })
          );
        }

        // Attached Washroom Partition
        pushFaces(
          createBoxFaces(2.6, layerLivingY, 0.05, 1.5, 1.48, 0.14, '#3A3530', {
            topHex: '#57534E',
            stroke: 'rgba(255,255,255,0.22)',
          })
        );

        // Overhead MEP Canopy & Recessed LED Lights
        pushFaces(
          createBoxFaces(0, layerCanopyY, -2.82, 7.2, 0.14, 0.26, '#292524', {
            topHex: '#F26522',
            alpha: 0.75,
            stroke: '#FDBA74',
          })
        );
        pushFaces(
          createBoxFaces(-3.48, layerCanopyY, 0.1, 0.26, 0.14, 5.6, '#292524', {
            topHex: '#F26522',
            alpha: 0.75,
            stroke: '#FDBA74',
          })
        );
        pushFaces(
          createBoxFaces(0, layerCanopyY + 0.04, 0.15, 2.2, 0.07, 0.42, isNight ? '#FDE68A' : '#FFF7ED', {
            topHex: '#FFFFFF',
            alpha: isNight ? 0.96 : 0.82,
            stroke: '#FDBA74',
            unlit: true,
          })
        );
      }

      // Painter's Sort back-to-front
      faces.sort((a, b) => b.avgZ - a.avgZ);

      const towerBounds: Record<string, { minX: number; maxX: number; minY: number; maxY: number; minZ: number }> = {};
      const bedBounds: Record<string, { minX: number; maxX: number; minY: number; maxY: number; minZ: number }> = {};

      for (const face of faces) {
        const projected = face.points.map((pt) => projectPoint(pt, cx, cy, focal, camDist));

        ctx.beginPath();
        ctx.moveTo(projected[0].sx, projected[0].sy);
        for (let i = 1; i < projected.length; i++) {
          ctx.lineTo(projected[i].sx, projected[i].sy);
        }
        ctx.closePath();

        if (renderStyle !== 'wireframe' || face.unlit) {
          ctx.fillStyle = shadeColor(face.baseHex, face.shade, face.alpha ?? 1);
          ctx.fill();
        } else {
          ctx.fillStyle = shadeColor(face.baseHex, 0.85, 0.14);
          ctx.fill();
        }

        if (face.stroke || renderStyle === 'wireframe') {
          ctx.strokeStyle = renderStyle === 'wireframe' ? '#F26522' : face.stroke || 'rgba(255,255,255,0.12)';
          ctx.lineWidth = face.lineWidth || 1;
          ctx.stroke();
        }

        if (face.hostelCode) {
          let b = towerBounds[face.hostelCode];
          if (!b) {
            b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity };
            towerBounds[face.hostelCode] = b;
          }
          if (face.avgZ < b.minZ) b.minZ = face.avgZ;
          for (const p of projected) {
            if (p.sx < b.minX) b.minX = p.sx;
            if (p.sx > b.maxX) b.maxX = p.sx;
            if (p.sy < b.minY) b.minY = p.sy;
            if (p.sy > b.maxY) b.maxY = p.sy;
          }
        }

        if (face.bedId) {
          let b = bedBounds[face.bedId];
          if (!b) {
            b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity };
            bedBounds[face.bedId] = b;
          }
          if (face.avgZ < b.minZ) b.minZ = face.avgZ;
          for (const p of projected) {
            if (p.sx < b.minX) b.minX = p.sx;
            if (p.sx > b.maxX) b.maxX = p.sx;
            if (p.sy < b.minY) b.minY = p.sy;
            if (p.sy > b.maxY) b.maxY = p.sy;
          }
        }
      }

      // Draw 3D Orbital Selection Ring around Selected Tower
      if (mode === 'campus' && selectedTower) {
        const ringY = 0.05 + explodeFactor * 0.72;
        const radius = Math.max(selectedTower.w, selectedTower.d) * 0.85;
        const segments = 28;
        const rotOffset = isPaused ? 0 : timeRef.current * 1.4;

        ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
          const ang = (s / segments) * Math.PI * 2 + rotOffset;
          const pt = rotatePoint(
            {
              x: selectedTower.x + Math.cos(ang) * radius,
              y: ringY,
              z: selectedTower.z + Math.sin(ang) * radius,
            },
            cam.yaw,
            cam.pitch
          );
          const pr = projectPoint(pt, cx, cy, focal, camDist);
          if (s === 0) ctx.moveTo(pr.sx, pr.sy);
          else ctx.lineTo(pr.sx, pr.sy);
        }
        ctx.strokeStyle = '#FDBA74';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ambient 3D Floating Light Motes
      if (!isPaused) {
        for (let i = 0; i < LIGHT_MOTES.length; i++) {
          const m = LIGHT_MOTES[i];
          const drifted = { x: m.x, y: m.y + Math.sin(timeRef.current * 0.9 + i) * 0.3, z: m.z };
          const pr = projectPoint(rotatePoint(drifted, cam.yaw, cam.pitch), cx, cy, focal, camDist);
          ctx.beginPath();
          ctx.arc(pr.sx, pr.sy, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(242, 101, 34, 0.45)' : 'rgba(253, 224, 71, 0.32)';
          ctx.fill();
        }
      }

      hitTowersRef.current = Object.entries(towerBounds)
        .map(([code, r]) => ({ code, ...r }))
        .sort((a, b) => a.minZ - b.minZ);

      hitBedsRef.current = Object.entries(bedBounds)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => a.minZ - b.minZ);

      // Project Floating Tower Pin neatly inside safe canvas bounds
      if (mode === 'campus' && selectedTower) {
        const liftTop =
          selectedTower.h +
          0.48 +
          explodeFactor * 0.72 +
          (isPaused ? 0 : Math.sin(timeRef.current * 2.8) * 0.05);
        const projTop = projectPoint(
          rotatePoint({ x: selectedTower.x, y: liftTop + 0.55, z: selectedTower.z }, cam.yaw, cam.pitch),
          cx,
          cy,
          focal,
          camDist
        );
        const projBase = projectPoint(
          rotatePoint({ x: selectedTower.x, y: liftTop, z: selectedTower.z }, cam.yaw, cam.pitch),
          cx,
          cy,
          focal,
          camDist
        );

        ctx.beginPath();
        ctx.moveTo(projBase.sx, projBase.sy);
        ctx.lineTo(projTop.sx, projTop.sy);
        ctx.strokeStyle = '#F26522';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(projTop.sx, projTop.sy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#F26522';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        setPinPosition((prev) => {
          const nx = Math.round(projTop.sx);
          const ny = Math.round(projTop.sy);
          if (Math.abs(prev.x - nx) > 1 || Math.abs(prev.y - ny) > 1 || !prev.visible) {
            return { x: nx, y: ny, visible: true };
          }
          return prev;
        });
      } else {
        setPinPosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }

      ctx.restore();
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [mode, renderStyle, suiteAmbience, explodePct, isPaused, selectedHostelCode, hoveredCode, selectedBedId, hoveredBed, towers, selectedTower]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    cam.isDragging = true;
    cam.didDrag = false;
    cam.dragStartX = e.clientX;
    cam.dragStartY = e.clientY;
    cam.dragStartYaw = cam.targetYaw;
    cam.dragStartPitch = cam.targetPitch;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cam = cameraRef.current;

    if (cam.isDragging) {
      const dx = e.clientX - cam.dragStartX;
      const dy = e.clientY - cam.dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) cam.didDrag = true;
      cam.targetYaw = cam.dragStartYaw + dx * 0.008;
      // Positive pitch looks from above downward; keep safely in [0.22..1.15] so never underside!
      cam.targetPitch = Math.max(0.22, Math.min(1.15, cam.dragStartPitch + dy * 0.006));
      return;
    }

    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    cam.pointerTiltX = nx;
    cam.pointerTiltY = ny;

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (mode === 'campus') {
      const hit = hitTowersRef.current.find(
        (r) => localX >= r.minX && localX <= r.maxX && localY >= r.minY && localY <= r.maxY
      );
      setHoveredCode(hit ? hit.code : null);
      setHoveredBed(null);
    } else {
      const hitB = hitBedsRef.current.find(
        (r) => localX >= r.minX && localX <= r.maxX && localY >= r.minY && localY <= r.maxY
      );
      setHoveredBed(hitB ? hitB.id : null);
      setHoveredCode(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cam = cameraRef.current;
    const wasClick = !cam.didDrag;
    cam.isDragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (wasClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      if (mode === 'campus') {
        const hit = hitTowersRef.current.find(
          (r) => localX >= r.minX && localX <= r.maxX && localY >= r.minY && localY <= r.maxY
        );
        if (hit) onSelectHostel(hit.code);
      } else {
        const hitB = hitBedsRef.current.find(
          (r) => localX >= r.minX && localX <= r.maxX && localY >= r.minY && localY <= r.maxY
        );
        if (hitB) setSelectedBedId(hitB.id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cam = cameraRef.current;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cam.targetYaw -= 0.18;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      cam.targetYaw += 0.18;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cam.targetPitch = Math.min(1.15, cam.targetPitch + 0.08);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      cam.targetPitch = Math.max(0.22, cam.targetPitch - 0.08);
    }
  };

  return (
    <div
      ref={stageRef}
      className="heavy-3d-stage"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Illustrative 3D hostel explorer with sample inventory. Drag to orbit or use arrow keys to rotate camera."
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Integrated CAD Toolbar (Never overlaps canvas content!) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'rgba(18, 16, 14, 0.94)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}
      >
        <div role="group" aria-label="3D Scene Mode" style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode('campus')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.7rem',
              minHeight: '30px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: mode === 'campus' ? '1px solid var(--brand)' : '1px solid rgba(255,255,255,0.14)',
              backgroundColor: mode === 'campus' ? 'var(--brand)' : 'rgba(255,255,255,0.04)',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <Building2 size={13} aria-hidden="true" />
            Sample hostels
          </button>
          <button
            type="button"
            onClick={() => setMode('suite')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.7rem',
              minHeight: '30px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: mode === 'suite' ? '1px solid var(--brand)' : '1px solid rgba(255,255,255,0.14)',
              backgroundColor: mode === 'suite' ? 'var(--brand)' : 'rgba(255,255,255,0.04)',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <Box size={13} aria-hidden="true" />
            Exploded 3D Suite
          </button>

          {/* Suite Ambience Controls (Visible in Suite Cutaway Mode) */}
          {mode === 'suite' && (
            <div style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.25rem' }} role="group" aria-label="Suite Ambience Simulation">
              {(
                [
                  { id: 'sun', label: 'Sun', icon: Sun },
                  { id: 'night', label: 'Night Study', icon: Moon },
                  { id: 'airflow', label: 'AC Flow', icon: Wind },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSuiteAmbience(id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.3rem 0.5rem',
                    minHeight: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: suiteAmbience === id ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: suiteAmbience === id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: suiteAmbience === id ? '#BAE6FD' : '#CFC8BB',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={12} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Camera & Wireframe Controls */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setRenderStyle((s) => (s === 'solid' ? 'wireframe' : 'solid'))}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.3rem 0.55rem',
              minHeight: '30px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: renderStyle === 'wireframe' ? '1px solid var(--brand)' : '1px solid rgba(255,255,255,0.14)',
              backgroundColor: renderStyle === 'wireframe' ? 'rgba(242,101,34,0.25)' : 'rgba(255,255,255,0.04)',
              color: renderStyle === 'wireframe' ? '#FDBA74' : '#DDD8CF',
              cursor: 'pointer',
            }}
          >
            <Grid size={12} aria-hidden="true" />
            {renderStyle === 'wireframe' ? 'Wireframe' : 'Solid 3D'}
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('iso')}
            aria-label="Isometric camera view"
            style={{ padding: '0.3rem 0.45rem', minHeight: '30px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#DDD8CF', cursor: 'pointer' }}
          >
            Iso
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('aerial')}
            aria-label="Aerial camera view"
            style={{ padding: '0.3rem 0.45rem', minHeight: '30px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#DDD8CF', cursor: 'pointer' }}
          >
            Aerial
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.14)}
            aria-label="Zoom in 3D view"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', minHeight: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#DDD8CF', cursor: 'pointer' }}
          >
            <ZoomIn size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.14)}
            aria-label="Zoom out 3D view"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', minHeight: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#DDD8CF', cursor: 'pointer' }}
          >
            <ZoomOut size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCameraPreset('low')}
            aria-label="Reset camera angle"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', minHeight: '30px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#DDD8CF', cursor: 'pointer' }}
          >
            <RotateCcw size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3rem 0.55rem',
              minHeight: '30px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(242, 101, 34, 0.55)',
              backgroundColor: isPaused ? 'rgba(242, 101, 34, 0.25)' : 'rgba(255,255,255,0.06)',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            {isPaused ? <Play size={11} aria-hidden="true" /> : <Pause size={11} aria-hidden="true" />}
            {isPaused ? 'Play' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Main Unobstructed 3D Canvas Viewport */}
      <div style={{ position: 'relative', flex: 1, minHeight: '380px', width: '100%' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => {
            cameraRef.current.pointerTiltX = 0;
            cameraRef.current.pointerTiltY = 0;
            setHoveredCode(null);
            setHoveredBed(null);
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: hoveredCode || hoveredBed ? 'pointer' : 'grab',
            touchAction: 'pan-y',
          }}
        />

        {/* Projected 3D Tower HUD Pin (Clamped Safely Inside Viewport!) */}
        {mode === 'campus' && pinPosition.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(115, Math.min(pinPosition.x, canvasSizeRef.current.w - 115))}px`,
              top: `${Math.max(14, Math.min(pinPosition.y - 48, canvasSizeRef.current.h - 150))}px`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(13, 12, 11, 0.94)',
              border: '1px solid rgba(242, 101, 34, 0.78)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.65rem',
              color: '#FFFFFF',
              pointerEvents: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
              zIndex: 8,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)' }} className="tabular-nums">
                {selectedTower.code}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#E8E4DC', fontWeight: 600 }} className="tabular-nums">
                {selectedTower.vacantBeds} Vacant
              </span>
              {selectedHostel && (
                <Link
                  to={`/hostels/${selectedHostel.id}`}
                  aria-label={`Inspect ${selectedTower.code} hostel details`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    color: '#FDBA74',
                    textDecoration: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  Open <ArrowUpRight size={12} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Bottom-Right Compact Floating Inspector */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.875rem',
            right: '0.875rem',
            zIndex: 9,
            width: 'min(300px, calc(100% - 1.75rem))',
            backgroundColor: 'rgba(16, 15, 13, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderTop: '2px solid var(--brand)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.875rem',
            color: '#FFFFFF',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.48)',
            pointerEvents: 'auto',
          }}
        >
          {mode === 'campus' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.04em' }} className="tabular-nums">
                  {['BH-9', 'BH-10', 'GS-9'].includes(selectedTower.code) ? 'STUDIO · ' : 'SAMPLE · '}
                  {selectedTower.code} • {selectedTower.gender === 'MALE' ? 'BOYS WING' : 'GIRLS WING'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 700 }} className="tabular-nums">
                  {selectedTower.vacantBeds} Open Beds
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
                {selectedTower.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#CFC8BB', marginBottom: '0.5rem' }} className="tabular-nums">
                <span>{selectedTower.acRooms} AC Suites</span>
                <span>From ₹{(selectedTower.minFee ?? 75000).toLocaleString()}/yr</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <BedDouble size={13} aria-hidden="true" />
                  {selectedBed.label}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: selectedBed.vacant ? '#4ADE80' : '#FDBA74' }}>
                  {selectedBed.vacant ? 'Vacant' : 'Occupied'}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', marginBottom: '0.2rem' }}>
                {selectedBed.wing}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CFC8BB', marginBottom: '0.5rem' }}>
                {selectedBed.spec}
              </div>
            </>
          )}

          {/* Native Exploded View / Elevation Range Slider */}
          <div style={{ marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', color: '#A8A29E' }}>
              <label htmlFor="hero-3d-explode-slider" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Layers size={11} color="var(--brand)" aria-hidden="true" />
                {mode === 'suite' ? 'Explode Suite Layers' : 'Focus Elevation'}
              </label>
              <span className="tabular-nums" style={{ color: '#FFFFFF', fontWeight: 600 }}>{explodePct}%</span>
            </div>
            <input
              ref={sliderRef}
              id="hero-3d-explode-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={explodePct}
              aria-valuetext={`${explodePct} percent exploded view`}
              onChange={(e) => setExplodePct(Number(e.target.value))}
              className="lpu-slider"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#A8A29E', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Compass size={11} color="var(--brand)" aria-hidden="true" /> Drag 360°
            </span>
            {selectedHostel ? (
              <Link
                to={`/hostels/${selectedHostel.id}`}
                style={{ color: '#FDBA74', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
              >
                Floor Plan <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/rooms"
                style={{ color: '#FDBA74', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
              >
                Suites <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Integrated Tower & Bed Selector Bar */}
      <div
        style={{
          padding: '0.5rem 0.875rem',
          backgroundColor: 'rgba(13, 12, 11, 0.96)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.45rem',
          zIndex: 10,
        }}
      >
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}
          role="group"
          aria-label="Select Hostel Tower in 3D Stage"
        >
          {towers.map((t) => {
            const active = mode === 'campus' && t.code === selectedHostelCode;
            const isStudioTower = t.code === 'BH-9' || t.code === 'BH-10' || t.code === 'GS-9';
            return (
              <button
                key={t.code}
                type="button"
                title={isStudioTower ? `${t.name} (Studio Complex)` : t.name}
                onClick={() => {
                  if (mode !== 'campus') setMode('campus');
                  onSelectHostel(t.code);
                }}
                style={{
                  padding: '0.2rem 0.45rem',
                  minHeight: '25px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: active
                    ? '1px solid var(--brand)'
                    : isStudioTower
                    ? '1px solid rgba(242, 101, 34, 0.55)'
                    : '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: active
                    ? 'var(--brand)'
                    : isStudioTower
                    ? 'rgba(242, 101, 34, 0.22)'
                    : t.gender === 'MALE'
                    ? 'rgba(242, 101, 34, 0.09)'
                    : 'rgba(234, 179, 8, 0.09)',
                  color: active ? '#17130d' : '#DDD8CF',
                  cursor: 'pointer',
                }}
                className="tabular-nums"
              >
                {t.code}{isStudioTower ? '★' : ''}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} role="group" aria-label="Select Bed in 3D Suite">
          <span style={{ fontSize: '0.6875rem', color: '#A8A29E', fontWeight: 600, marginRight: '0.15rem' }}>
            Suite Beds:
          </span>
          {SUITE_BEDS.map((b) => {
            const active = mode === 'suite' && selectedBedId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  if (mode !== 'suite') setMode('suite');
                  setSelectedBedId(b.id);
                }}
                style={{
                  padding: '0.2rem 0.45rem',
                  minHeight: '25px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.14)',
                  backgroundColor: active ? (b.vacant ? '#16A34A' : '#C2410C') : 'rgba(255,255,255,0.05)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {b.id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
