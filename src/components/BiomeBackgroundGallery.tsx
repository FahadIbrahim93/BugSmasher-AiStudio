import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameEngineStatusBus } from '../game/GameEngineStatusBus';

interface BiomeBackgroundGalleryProps {
  biome: string;
}

/* ==========================================
   PARALLAX DEPTH SYSTEM
   Uses CSS custom properties set directly on the container
   via element.style.setProperty() — zero React re-renders at 60fps.
   ========================================== */

const DEPTH_FACTORS = [0.04, 0.12, 0.25]; // far (grids), mid (orbits), near (floating particles)

const PARALLAX_X_VAR = '--pllx-x';
const PARALLAX_Y_VAR = '--pllx-y';

function ParallaxLayer({
  children,
  depth = 0,
  className = '',
  style = {},
}: {
  children?: ReactNode;
  depth?: 0 | 1 | 2;
  className?: string;
  style?: React.CSSProperties;
}) {
  const factor = DEPTH_FACTORS[depth];
  return (
    <div
      className={className}
      style={{
        ...style,
        transform: `translate(calc(var(${PARALLAX_X_VAR}) * ${factor}), calc(var(${PARALLAX_Y_VAR}) * ${factor}))`,
        transition: 'transform 0.08s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

/* ==========================================
   MAIN GALLERY COMPONENT
   ========================================== */

export function BiomeBackgroundGallery({ biome }: BiomeBackgroundGalleryProps) {
  const [activeTheme, setActiveTheme] = useState<string>('neon_core');
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const shakeRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (biome) {
      setActiveTheme(biome);
    }
  }, [biome]);

  // Helper: normalize pointer position (-1..1 from center to edge)
  const normalizePointer = (clientX: number, clientY: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return {
      x: Math.max(-1, Math.min(1, (clientX - cx) / (cx * 0.85))),
      y: Math.max(-1, Math.min(1, (clientY - cy) / (cy * 0.85))),
    };
  };

  // Track mouse position — normalized near-edge parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = normalizePointer(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => { window.removeEventListener('mousemove', handleMouse); };
  }, []);

  // Track touch position for mobile parallax — finger lifts reset to center
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      mouseRef.current = normalizePointer(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => {
      mouseRef.current = { x: 0, y: 0 };
    };
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Subscribe to game engine shake intensity
  useEffect(() => {
    const unsub = GameEngineStatusBus.subscribe((status) => {
      if (status) {
        shakeRef.current = status.shakeIntensity;
      }
    });
    return unsub;
  }, []);

  // RAF loop: write parallax offsets directly to CSS custom properties — no React state, no re-renders
  useEffect(() => {
    const tick = () => {
      const el = containerRef.current;
      if (!el) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const mouse = mouseRef.current;
      // Mouse edge parallax: up to 30px shift at edges
      const mouseX = mouse.x * 30;
      const mouseY = mouse.y * 30;

      // Shake parallax: subtle tremor during shake events
      const shake = shakeRef.current;
      const now = Date.now();
      const shakeX = shake * (Math.sin(now * 0.013) * 0.5 + 0.5) * 3;
      const shakeY = shake * (Math.cos(now * 0.017) * 0.5 + 0.5) * 3;

      el.style.setProperty(PARALLAX_X_VAR, `${mouseX + shakeX}px`);
      el.style.setProperty(PARALLAX_Y_VAR, `${mouseY + shakeY}px`);

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full bg-zinc-950"
        >
          {activeTheme === 'toxic_reactor' && <ToxicReactorBackdrop />}
          {activeTheme === 'chrono_singularity' && <ChronoSingularityBackdrop />}
          {activeTheme === 'hellfire_forge' && <HellfireForgeBackdrop />}
          {activeTheme === 'digital_matrix' && <DigitalMatrixBackdrop />}
          {activeTheme === 'cryo_aurora' && <CryoAuroraBackdrop />}
          {activeTheme === 'imperial_cache' && <ImperialCacheBackdrop />}
          {activeTheme === 'golden_spire' && <ImperialCacheBackdrop />}
          {activeTheme === 'golden_cache' && <ImperialCacheBackdrop />}
          {activeTheme === 'neon_core' && <NeonCoreBackdrop />}
          {activeTheme === 'quantum_void' && <QuantumVoidBackdrop />}
          {activeTheme === 'void_abyss' && <VoidAbyssBackdrop />}
          {activeTheme === 'ember_depths' && <HellfireForgeBackdrop />}
          {activeTheme === 'frostbyte' && <CryoAuroraBackdrop />}
        </motion.div>
      </AnimatePresence>

      {/* Fixed overlays (no parallax — these are screen-space effects) */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] mix-blend-overlay pointer-events-none z-10" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10" />
    </div>
  );
}

/* ==========================================
   1. TOXIC REACTOR BACKDROP
   ========================================== */
function ToxicReactorBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#021405] via-[#010803] to-[#041a08] overflow-hidden">
      {/* Far: Radioactive Acid Grid Overlay */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'linear-gradient(to right, #39ff14 1px, transparent 1px), linear-gradient(to bottom, #39ff14 1px, transparent 1px)',
          backgroundSize: '140px 140px'
        }}
      />

      {/* Mid: Reactor Tube Core Layout */}
      <ParallaxLayer depth={1} className="absolute left-1/2 top-11/12 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[400px] border border-[#39ff14]/20 rounded-full blur-xs opacity-25 bg-[#00ff44]/5 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-11/12 h-5/6 border-2 border-[#39ff14]/30 rounded-full"
        />
      </ParallaxLayer>

      {/* Near: Floating Toxic Acid Bubbles */}
      <ParallaxLayer depth={2} className="absolute inset-0 flex justify-around">
        {Array.from({ length: 12 }).map((_, i) => {
          const delay = i * 0.7;
          const size = 15 + (i * 7) % 25;
          const left = `${5 + (i * 11) % 90}%`;
          return (
            <motion.div
              key={i}
              initial={{ y: '110vh', opacity: 0, scale: 0.8 }}
              animate={{
                y: '-10vh',
                opacity: [0, 0.6, 0.6, 0],
                scale: [0.8, 1.2, 1.2, 0.9],
                x: [0, Math.sin(i) * 35, 0]
              }}
              transition={{
                duration: 9 + (i % 4) * 3,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut'
              }}
              className="absolute pointer-events-none rounded-full border border-[#39ff14]/40 bg-[#39ff14]/10 shadow-[0_0_12px_rgba(57,255,20,0.3)]"
              style={{ width: size, height: size, left, bottom: 0 }}
            />
          );
        })}
      </ParallaxLayer>

      {/* Near: Chemical Wave Overlay */}
      <ParallaxLayer depth={2}
        className="absolute bottom-0 left-0 right-0 h-40"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full bg-gradient-to-t from-[#39ff14]/10 via-[#39ff14]/3 to-transparent blur-md mix-blend-screen"
        />
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   2. CHRONO SINGULARITY BACKDROP
   ========================================== */
function ChronoSingularityBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#060010] via-[#090018] to-[#14002c] overflow-hidden">
      {/* Far: Nebulous Deep Galactic Grid */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(to right, #da70d6 1px, transparent 1px), linear-gradient(to bottom, #da70d6 1px, transparent 1px)',
          backgroundSize: '160px 160px'
        }}
      />

      {/* Mid: Multi-layered Gravitational Event Horizon Circles */}
      <ParallaxLayer depth={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[650px] aspect-square flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-56 h-56 rounded-full border border-[#da70d6]/30 bg-radial-dark flex items-center justify-center shadow-[0_0_40px_rgba(218,112,214,0.15)]"
        >
          <div className="w-48 h-48 rounded-full border border-dashed border-[#da70d6]/20 bg-black/40" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute w-96 h-96 rounded-full border border-dashed border-[#da70d6]/10"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          className="absolute w-128 h-128 rounded-full border border-dotted border-[#da70d6]/5"
        />
      </ParallaxLayer>

      {/* Near: Gravitational Star dust particles */}
      <ParallaxLayer depth={2} className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => {
          const rotation = i * (360 / 15);
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-center"
              style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
            >
              <motion.div
                animate={{
                  x: [350, 40, 350],
                  scale: [0.3, 1.2, 0.3],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 10 + (i % 3) * 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeInOut'
                }}
                className="w-1.5 h-1.5 bg-[#da70d6] rounded-full shadow-[0_0_8px_#da70d6]"
              />
            </div>
          );
        })}
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   3. HELLFIRE FORGE BACKDROP
   ========================================== */
function HellfireForgeBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#120100] via-[#090100] to-[#1f0500] overflow-hidden">
      {/* Far: Crag Grid lines */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ff3300 1px, transparent 1px), linear-gradient(to bottom, #ff3300 1px, transparent 1px)',
          backgroundSize: '120px 120px'
        }}
      />

      {/* Mid: Glowing Tectonic Fissure Cracks */}
      <ParallaxLayer depth={1} className="absolute inset-0 w-full h-full">
        <svg className="w-full h-full opacity-35 mix-blend-screen" xmlns="http://www.w3.org/2000/svg">
          <filter id="lava-glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <motion.path
            animate={{ strokeWidth: [1.5, 3.2, 1.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            d="M -10 300 Q 150 220 400 480 T 800 210 T 1100 440 T 1500 50"
            fill="none"
            stroke="#ff3300"
            filter="url(#lava-glow)"
          />
          <motion.path
            animate={{ strokeWidth: [1, 2.5, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            d="M 200 -20 Q 550 400 800 700"
            fill="none"
            stroke="#ff6600"
            filter="url(#lava-glow)"
          />
        </svg>
      </ParallaxLayer>

      {/* Near: Floating Magma Cinders/Ashes */}
      <ParallaxLayer depth={2} className="absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => {
          const size = 3 + (i * 5) % 8;
          const left = `${10 + (i * 13) % 80}%`;
          return (
            <motion.div
              key={i}
              initial={{ y: '110vh', opacity: 0 }}
              animate={{
                y: '-20vh',
                opacity: [0, 0.7, 0.7, 0],
                x: [0, Math.sin(i) * 40, -Math.sin(i) * 20],
                rotate: [0, 360]
              }}
              transition={{
                duration: 8 + (i % 3) * 4,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'linear'
              }}
              className="absolute rounded-xs bg-gradient-to-t from-[#ff3300] to-[#ffd700] shadow-[0_0_10px_#ff5500]"
              style={{ width: size, height: size, left, bottom: 0 }}
            />
          );
        })}
      </ParallaxLayer>

      {/* Mid: Volcanic Thermal Heat Flash */}
      <ParallaxLayer depth={1}
        className="absolute inset-x-0 bottom-0 h-40"
      >
        <motion.div
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full bg-radial-orange blur-xl"
        />
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   4. DIGITAL MATRIX BACKDROP
   ========================================== */
function DigitalMatrixBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#00080f] via-[#000407] to-[#000e16] overflow-hidden">
      {/* Far: High precision cybernetic grid */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'linear-gradient(to right, #00f3ff 1px, transparent 1px), linear-gradient(to bottom, #00f3ff 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }}
      />

      {/* Mid: Binary and Tactical Hex overlays */}
      <ParallaxLayer depth={1}
        className="absolute top-1/4 left-10 opacity-20 font-mono text-[9px] text-[#00f3ff] leading-none space-y-1"
      >
        <p>MATRIX_STATUS: ACTIVE</p>
        <p>PORT_ADDRESS: 0x3000</p>
        <p>LOAD_AVERAGE: 0.12</p>
      </ParallaxLayer>
      <ParallaxLayer depth={1}
        className="absolute bottom-1/4 right-10 opacity-20 font-mono text-[9px] text-[#00f3ff] leading-none space-y-1 text-right"
      >
        <p>BUFFER_SECTOR: OVERFLOW</p>
        <p>NET_LATENCY: 1.04ms</p>
        <p>CYBER_CORE_SECURE: OK</p>
      </ParallaxLayer>

      {/* Mid: Cyber circuit line traces */}
      <ParallaxLayer depth={1} className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 120 0 L 120 300 L 250 430 L 250 800" fill="none" stroke="#00f3ff" strokeWidth="1.5" />
          <path d="M 1100 0 L 1100 500 L 980 620 L 980 800" fill="none" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="250" cy="430" r="4.5" fill="#00f3ff" />
          <circle cx="980" cy="620" r="4.5" fill="#00f3ff" />
        </svg>
      </ParallaxLayer>

      {/* Near: Futuristic cyber byte packets falling down */}
      <ParallaxLayer depth={2} className="absolute inset-0 flex justify-around">
        {Array.from({ length: 10 }).map((_, i) => {
          const left = `${10 + i * 10}%`;
          return (
            <motion.div
              key={i}
              initial={{ y: '-10vh', opacity: 0 }}
              animate={{
                y: '110vh',
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                duration: 6 + (i % 3) * 3,
                repeat: Infinity,
                delay: i * 0.9,
                ease: 'linear'
              }}
              className="absolute w-[2px] h-12 bg-gradient-to-b from-[#00f3ff] to-transparent"
              style={{ left }}
            />
          );
        })}
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   5. CRYO AURORA BACKDROP
   ========================================== */
function CryoAuroraBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#000b14] via-[#00050a] to-[#001322] overflow-hidden">
      {/* Far: Glacial blueprint matrix */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'linear-gradient(to right, #00ccff 1px, transparent 1px), linear-gradient(to bottom, #00ccff 1px, transparent 1px)',
          backgroundSize: '130px 130px'
        }}
      />

      {/* Mid: Giant Neon Aurora wave */}
      <ParallaxLayer depth={1} className="absolute inset-x-0 top-10 flex flex-col items-center justify-center pointer-events-none opacity-[0.12] scale-120">
        <svg viewBox="0 0 1000 300" className="w-[120vw] h-[300px]" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            animate={{
              d: [
                "M 0 100 Q 250 50, 500 150 T 1000 100",
                "M 0 100 Q 250 150, 500 50 T 1000 100",
                "M 0 100 Q 250 50, 500 150 T 1000 100"
              ]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            fill="none"
            stroke="#00ccff"
            strokeWidth="15"
          />
          <motion.path
            animate={{
              d: [
                "M 0 150 Q 250 120, 500 180 T 1000 150",
                "M 0 150 Q 250 180, 500 120 T 1000 150",
                "M 0 150 Q 250 120, 500 180 T 1000 150"
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            fill="none"
            stroke="#00ffff"
            strokeWidth="8"
          />
        </svg>
      </ParallaxLayer>

      {/* Near: Floating Frozen snowflake crystal nodes */}
      <ParallaxLayer depth={2} className="absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => {
          const left = `${15 + (i * 12) % 75}%`;
          const top = `${10 + (i * 15) % 80}%`;
          return (
            <motion.div
              key={i}
              animate={{
                rotate: [0, 360],
                opacity: [0.15, 0.45, 0.15],
                scale: [1, 1.15, 1]
              }}
              transition={{
                duration: 10 + (i % 3) * 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute text-[#00ccff]/30 w-8 h-8 flex items-center justify-center border border-[#00ccff]/15 rounded-full"
              style={{ left, top }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#00ccff]/40 shadow-[0_0_8px_#00ccff]" />
            </motion.div>
          );
        })}
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   6. IMPERIAL CACHE / SACRED GOLDEN SPIRE BACKDROP
   ========================================== */
function ImperialCacheBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1c1400] via-[#0b0800] to-[#251a02] overflow-hidden">
      {/* Far: Royal Amber circuitry grid spacer */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffd700 1px, transparent 1px), linear-gradient(to bottom, #ffd700 1px, transparent 1px)',
          backgroundSize: '110px 110px'
        }}
      />

      {/* Mid: Rotating Sacred Circles */}
      <ParallaxLayer depth={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] aspect-square flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute w-96 h-96 border-4 border-dotted border-[#ffd700]/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-64 h-64 border border-[#ffd700]/15 rounded-full flex items-center justify-center"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#ffd700]/25 to-transparent border border-[#ffd700]/40 rounded-lg shadow-[0_0_15px_#ffd700]" />
        </motion.div>
      </ParallaxLayer>

      {/* Near: Floating Amber Spire Dusts */}
      <ParallaxLayer depth={2} className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => {
          const left = `${5 + (i * 13) % 90}%`;
          const delay = i * 0.5;
          return (
            <motion.div
              key={i}
              initial={{ y: '110vh', opacity: 0 }}
              animate={{
                y: '-10vh',
                opacity: [0, 0.7, 0.7, 0],
                x: [0, Math.sin(i) * 25, 0]
              }}
              transition={{
                duration: 9 + (i % 4) * 3,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut'
              }}
              className="absolute w-2 h-2 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]"
              style={{ left, bottom: 0 }}
            />
          );
        })}
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   7. NEON CORE BACKDROP
   ========================================== */
function NeonCoreBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#021004] via-[#010501] to-[#041a08] overflow-hidden">
      {/* Far: Grid */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'linear-gradient(to right, #39ff14 1px, transparent 1px), linear-gradient(to bottom, #39ff14 1px, transparent 1px)',
          backgroundSize: '160px 160px'
        }}
      />

      {/* Mid: Concentric rings */}
      <ParallaxLayer depth={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#39ff14]/15 rounded-full opacity-40">
        <div className="absolute inset-10 border border-dashed border-[#39ff14]/10 rounded-full" />
        <div className="absolute inset-20 border border-dotted border-[#39ff14]/10 rounded-full" />
      </ParallaxLayer>

      {/* Mid: Technical text */}
      <ParallaxLayer depth={1}
        className="absolute left-10 top-10 opacity-30 font-mono text-[8px] text-[#39ff14]"
      >
        <p>SYSTEM_CORE_ENGAGED</p>
        <p>THREAD_RUNNING_OK</p>
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   8. QUANTUM VOID BACKDROP
   ========================================== */
function QuantumVoidBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#08001a] via-[#100022] to-[#1a0033] overflow-hidden">
      {/* Far: Quantum Lattice */}
      <ParallaxLayer depth={0} className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'linear-gradient(to right, #8a2be2 1px, transparent 1px), linear-gradient(to bottom, #8a2be2 1px, transparent 1px)',
          backgroundSize: '150px 150px'
        }}
      />

      {/* Mid: Glowing Pulsing Nebula Core */}
      <ParallaxLayer depth={1} className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-full blur-[80px]"
        />
      </ParallaxLayer>
    </div>
  );
}

/* ==========================================
   9. VOID ABYSS BACKDROP
   ========================================== */
function VoidAbyssBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      {/* Far: Extreme low-opacity starfield */}
      <ParallaxLayer depth={0} className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute bg-white rounded-full opacity-[0.4]"
            style={{
              width: '1.5px',
              height: '1.5px',
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
            }}
          />
        ))}
      </ParallaxLayer>

      {/* Mid: Concentric Tactical Sweeping Radar */}
      <ParallaxLayer depth={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] aspect-square flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border border-[#ff003c]/10 rounded-full bg-gradient-to-r from-[#ff003c]/2 to-transparent"
        />
        <div className="w-[300px] h-[300px] border border-dashed border-[#ff003c]/8 rounded-full" />
        <div className="w-[150px] h-[150px] border border-dotted border-[#ff003c]/5 rounded-full" />
      </ParallaxLayer>

      {/* Mid: Red alarming warning telemetry */}
      <ParallaxLayer depth={1}
        className="absolute top-6 left-6 opacity-30 font-mono text-[8.5px] text-[#ff003c]"
      >
        <p className="font-extrabold animate-pulse">!! SECTOR_ALERT !!</p>
        <p>GRAVITATIONAL_FIELD_STABILITY_0%</p>
      </ParallaxLayer>
    </div>
  );
}
