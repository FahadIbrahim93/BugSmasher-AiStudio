# BUGSMASHER // Tactical QA System 🛡️👾

An ultra-minimalist, high-intensity AI-shaped base defense game showcasing the visual contrast between a pristine, deadpan modern "Brutalist OS" terminal and viscous, glowing neon bio-luminescent bugs. Built inside the browser with a high-performance **React 18+**, **Vite**, and high-tier **Canvas 2D** rendering engine.

---

## 🚀 Key Achievements (This Session)

### 1. ⚙️ Real-Time Performance Scaler Utility
To ensure a buttery smooth, high-intensity 60 FPS experience on any system, we implemented a real-time framerate scaling utility in `Renderer.ts`:
- **Smooth FPS Sampling**: Tracks delta render loops using high-accuracy timestamps (`performance.now()`), calculating a sliding window average (last 6 samples) to eliminate scale-jitter.
- **Dynamic VFX Quality Downscaling**: If the framerate falls below **40 FPS**, the scaler dynamically reduces particle counts (`vfxScalar`) proportionally down to `0.15` and optimizes rendering calculations.
- **Geometric Complexity Reduction**: Seamlessly increases the dynamic background mesh grid spacing step (from `10px` all the way up to `80px` during severe lag), cutting rendering vertices in real-time.
- **Auto-Recovery**: Smoothly restores full visual fidelity once high-framerates stabilize above the critical 40 FPS benchmark.

### 2. 🎛️ High-Fidelity VFX Switcher & Mobile Protection
Integrated adaptive configuration policies:
- **Intelligent Defaults**: Automatically detects touch capabilities, inner screen widths, and user-agent details. High Fidelity settings are deactivated on mobile screens to safeguard battery life and eliminate overheating.
- **Manual Toggle Controls**: Added a stylized toggler inside the settings menu with custom ambient green halo glows to toggle glows, heavy shadow blurs, vector cloud simulations, and complex particle lifespans.
- **Device Pixel Ratio (DPR) Clamping**: When high-fidelity features are disabled, the engine clamps down retina and high-DPI scaling factors to a strict `1.0`, rescuing fill-rate bound systems instantly.

### 3. 🫧 Particle Spawn Multiplexing
Re-engineered particle generation in `ParticleSystem.ts` to follow the dynamic scaler's outputs:
- All core effects (`spawnGibs`, `spawnSmoke`, `spawnSparkExplosion`, `spawnExplosion`, `spawnMissParticles`) multiply their spawn iteration indices with the scaler's current real-time performance factor (`vfxCountMultiplier`).

### 4. 🪱 React Hook-Mismatch Architectural Fix
Resolved a critical rendering crash within `<CustomCursor>`:
- Refactored the conditional early-return checks for mobile/touch screens to sit strictly **at the bottom** of the component.
- Guaranteed that all state hooks, reference hooks, tracking logic, and ambient particle animation callbacks execute in a perfect, deterministic order, complying with React's strict hook safety laws.

---

## 🛠️ Architecture Standards

- **Systemic Orchestration**: Core engine mechanics are organized into modular single-purpose controllers (`InputSystem.ts`, `WaveManager.ts`, `ParticleSystem.ts`, `Renderer.ts`).
- **Standard Delta Timing (`dt`)**: Game math and physics calculations are strictly tied to high-precision update delta ticks. No `setTimeout` or `setInterval` structures are used.
- **Deterministic Type Safety**: Game-specific interface definitions and strict schemas reside in `src/game/GameTypes.ts`.

---

## 🏃 Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```
