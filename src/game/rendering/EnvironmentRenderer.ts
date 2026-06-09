import { GameEngine } from '../GameEngine';
import { Bug, Powerup, Hazard, ResourcePickup } from '../GameTypes';
import { Splatter, Particle, Shockwave, Laser, MuzzleFlash } from '../ParticleSystem';
import { assetManager } from '../AssetManager';
import { GameConfig } from '../GameConfig';
import { getActiveCoreThemeConfig } from '../CosmeticsManager';
import type { Renderer } from '../Renderer';
import type { PerformanceScaler } from './PerformanceScaler';
import { OffscreenEnvironmentCache } from './OffscreenEnvironmentCache';
import { CustomMapManager } from '../CustomMapManager';

export class EnvironmentRenderer {
  private staticLayerCache = new OffscreenEnvironmentCache();
  
  // Cached background gradient — recreated only on dimension/biome change
  private cachedBgGradient: CanvasGradient | null = null;
  private lastBgWidth: number = 0;
  private lastBgHeight: number = 0;
  private lastBiomeId: string = '';
  private lastHealthRatio: number = -1;
  private lastCustomMapId: string = '';

  constructor(
    protected engine: GameEngine,
    protected parent: Renderer,
    protected scaler: PerformanceScaler
  ) {}

  protected get isLowEnd() { return this.parent.isLowEnd; }
  protected get currentFps() { return this.scaler.currentFps; }
  protected get vfxScalar() { return this.scaler.vfxScalar; }
  protected get meshComplexityStep() { return this.scaler.meshComplexityStep; }

  drawBiomeBackground() {
    const ctx = this.engine.ctx;
    const biomeId = this.engine.currentBiome;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;

    ctx.save();
    
    // Base colors per biome
    let colorA = '#050505';
    let colorB = '#0a0a0a';
    
    // Custom map override integration
    const customMap = (this.engine.pcgSystem && this.engine.pcgSystem.activeMap) || CustomMapManager.getCustomMap(this.engine.wave);
    if (biomeId === 'custom_map' && customMap) {
      colorA = customMap.colorA || '#051515';
      colorB = customMap.colorB || '#020a0a';
    } else {
      switch(biomeId) {
        case 'quantum_void': colorA = '#08001a'; colorB = '#1a0033'; break;
        case 'ember_depths': colorA = '#1a0500'; colorB = '#330a00'; break;
        case 'frostbyte': colorA = '#001a1a'; colorB = '#003344'; break;
        case 'void_abyss': colorA = '#000000'; colorB = '#111111'; break;
        case 'golden_cache': colorA = '#1a1a00'; colorB = '#333300'; break;
        case 'golden_spire': colorA = '#0a0a05'; colorB = '#1a1a10'; break;
      }
    }

    const healthRatio = this.engine.health / this.engine.maxHealth;
    const customMapId = (biomeId === 'custom_map' && customMap) ? (('id' in customMap) ? customMap.id : (customMap as any).seed || 'pcg') : '';
    
    // Cache background gradient — recreate only on dimension/biome/health change
    if (this.cachedBgGradient === null ||
        this.lastBgWidth !== width ||
        this.lastBgHeight !== height ||
        this.lastBiomeId !== biomeId ||
        this.lastCustomMapId !== customMapId ||
        Math.abs(this.lastHealthRatio - healthRatio) > 0.15) {
      
      this.cachedBgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      // Append CC (~80% opaccity) for seamless blending with the high-res gallery
      const alphaVal = 'cc';
      this.cachedBgGradient.addColorStop(0, colorB + alphaVal);
      
      if (healthRatio < 0.3) {
        const pulse = Math.sin(t * 8) * 0.2 + 0.2;
        this.cachedBgGradient.addColorStop(1, `rgba(180, 0, 0, ${pulse * 0.7 + 0.3})`);
      } else {
        this.cachedBgGradient.addColorStop(1, colorA + alphaVal);
      }
      
      this.lastBgWidth = width;
      this.lastBgHeight = height;
      this.lastBiomeId = biomeId;
      this.lastCustomMapId = customMapId;
      this.lastHealthRatio = healthRatio;
    }
    
    ctx.fillStyle = this.cachedBgGradient;
    ctx.fillRect(0, 0, width, height);
    
    const intensity = Math.min(1, this.engine.performanceFactor * 0.1);
    
    // Global flash during high intensity — skip gradient, just tint
    if (healthRatio >= 0.3 && intensity > 0.4) {
      const pulse = Math.sin(t * 4) * 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + pulse})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Biome specific background particles/grid (cached offscreen when static)
    if (biomeId === 'neon_core') {
      const coreTheme = getActiveCoreThemeConfig();
      const cacheKey = `neon_core_${coreTheme?.id || 'default'}`;
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, cacheKey, (c) => {
        const gridColor = coreTheme ? `${coreTheme.colors.primary}0a` : 'rgba(57, 255, 20, 0.012)';
        this.paintGrid(c as CanvasRenderingContext2D, 160, gridColor);
        this.paintNeonCoreDetails(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        const gridColor = coreTheme ? `${coreTheme.colors.primary}0a` : 'rgba(57, 255, 20, 0.012)';
        this.paintGrid(ctx, 160, gridColor);
        this.paintNeonCoreDetails(ctx);
      }
    } else if (biomeId === 'quantum_void') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, biomeId, (c) => {
        this.paintStarfield(c as CanvasRenderingContext2D, 60);
        this.paintQuantumVoidNebula(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        this.paintStarfield(ctx, 60);
        this.paintQuantumVoidNebula(ctx);
      }
    } else if (biomeId === 'void_abyss') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, biomeId, (c) => {
        this.paintStarfield(c as CanvasRenderingContext2D, 120);
        this.paintVoidAbyssAnomalies(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        this.paintStarfield(ctx, 120);
        this.paintVoidAbyssAnomalies(ctx);
      }
    } else if (biomeId === 'ember_depths') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, 'ember_depths_bg', (c) => {
        this.paintEmberMagmaCracks(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        this.paintEmberMagmaCracks(ctx);
      }
      if (this.currentFps >= 30) {
        this.staticLayerCache.blitPeriodicLayer(
          this.engine, `lava_${biomeId}`, 100,
          (c) => this.paintLavaBubbles(c as CanvasRenderingContext2D)
        );
      }
    } else if (biomeId === 'frostbyte') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, 'frostbyte_bg', (c) => {
        this.paintFrostbyteCrystals(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        this.paintFrostbyteCrystals(ctx);
      }
      if (this.currentFps >= 30) {
        this.staticLayerCache.blitPeriodicLayer(
          this.engine, `snow_${biomeId}`, 100,
          (c) => this.paintSnowflakes(c as CanvasRenderingContext2D)
        );
      }
    } else if (biomeId === 'golden_cache' || biomeId === 'golden_spire') {
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, biomeId, (c) => {
        this.paintGrid(c as CanvasRenderingContext2D, 120, 'rgba(255, 204, 0, 0.015)');
        this.paintGoldenCircuitry(c as CanvasRenderingContext2D);
      });
      if (!cached) {
        this.paintGrid(ctx, 120, 'rgba(255, 204, 0, 0.015)');
        this.paintGoldenCircuitry(ctx);
      }
    } else if (biomeId === 'custom_map' && customMap) {
      const mapIdPart = 'id' in customMap ? customMap.id : (customMap as any).seed || 'pcg';
      const cached = this.staticLayerCache.blitStaticLayer(this.engine, `custom_map_static_${mapIdPart}_${customMap.visualStyle}`, (c) => {
        this.paintCustomMapDetails(c as CanvasRenderingContext2D, customMap);
      });
      if (!cached) {
        this.paintCustomMapDetails(ctx, customMap);
      }
    }

    ctx.restore();
    
    if (this.isLowEnd) return;
    this.drawDynamicMesh();
  }

  private paintCustomMapDetails(ctx: CanvasRenderingContext2D, map: any) {
    const w = this.engine.width;
    const h = this.engine.height;
    const mainColor = map.color || '#00ffcc';
    const gridColorStr = map.gridColor || 'rgba(0, 255, 204, 0.015)';
    const size = map.gridSize || 120;
    const labelText = map.label || 'SYSTEM_RUN_OK';

    // 1. Always paint some grid if requested or standard
    if (map.visualStyle === 'grid' || map.visualStyle === 'circuits') {
      this.paintGrid(ctx, size, gridColorStr);
    }

    // 2. Specific styles
    if (map.visualStyle === 'grid') {
      ctx.strokeStyle = `${mainColor}20`; // low opacity
      ctx.lineWidth = 1;
      const offset = 30;
      const bracketSize = 40;
      
      ctx.beginPath();
      ctx.moveTo(offset, offset + bracketSize);
      ctx.lineTo(offset, offset);
      ctx.lineTo(offset + bracketSize, offset);
      
      ctx.moveTo(w - offset, offset + bracketSize);
      ctx.lineTo(w - offset, offset);
      ctx.lineTo(w - offset - bracketSize, offset);
      
      ctx.moveTo(offset, h - offset - bracketSize);
      ctx.lineTo(offset, h - offset);
      ctx.lineTo(offset + bracketSize, h - offset);
      
      ctx.moveTo(w - offset, h - offset - bracketSize);
      ctx.lineTo(w - offset, h - offset);
      ctx.lineTo(w - offset - bracketSize, h - offset);
      ctx.stroke();

      ctx.fillStyle = `${mainColor}40`; // slightly higher opacity for labels
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(labelText, offset, offset - 10);
      ctx.fillText('NEXUS_TACTICAL_SECTOR', w - offset - 140, offset - 10);
      ctx.fillText('GEOMETRIC_ALIGN_OK', offset, h - offset + 15);
    } 
    else if (map.visualStyle === 'circuits') {
      ctx.strokeStyle = `${mainColor}20`; // low opacity stroke
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, 0);
      ctx.lineTo(w * 0.15, h * 0.3);
      ctx.lineTo(w * 0.15 + 40, h * 0.3 + 40);
      ctx.lineTo(w * 0.15 + 40, h);
      
      ctx.moveTo(w * 0.85, 0);
      ctx.lineTo(w * 0.85, h * 0.5);
      ctx.lineTo(w * 0.85 - 50, h * 0.5 + 50);
      ctx.lineTo(w * 0.85 - 50, h);
      ctx.stroke();

      ctx.fillStyle = `${mainColor}40`;
      ctx.fillRect(w * 0.15 - 2.5, h * 0.3 - 2.5, 5, 5);
      ctx.fillRect(w * 0.85 - 2.5, h * 0.5 - 2.5, 5, 5);

      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(labelText, w - 170, h - 30);
    } 
    else if (map.visualStyle === 'nebula') {
      this.paintStarfield(ctx, map.particleCount || 60);
      
      // Draw beautiful gaseous dust colored by mainColor
      const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w * 0.6);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `${mainColor}12`); // extreme low opacity
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w/2, h/2, w * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `${mainColor}30`;
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(`ANOMALY: ${labelText}`, 40, 50);
    } 
    else if (map.visualStyle === 'tecton_cracks') {
      // Paint cracks colored by primary neon brand color
      ctx.strokeStyle = `${mainColor}24`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w * 0.2, h * 0.35);
      ctx.lineTo(w * 0.35, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.15);
      ctx.lineTo(w * 0.8, h * 0.45);
      ctx.lineTo(w, h * 0.3);

      ctx.moveTo(w * 0.4, 0);
      ctx.lineTo(w * 0.35, h * 0.6);
      ctx.lineTo(w * 0.45, h);
      ctx.stroke();

      ctx.fillStyle = `${mainColor}40`;
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(labelText, 40, 50);
    } 
    else if (map.visualStyle === 'snowflake_nodes') {
      // Hexagonal frozen network nodes
      ctx.strokeStyle = `${mainColor}20`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) * 0.25;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);

        // draw small rings at nodes
        ctx.arc(x, y, 6, 0, Math.PI * 2);
      }
      ctx.stroke();

      ctx.fillStyle = `${mainColor}40`;
      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillText(labelText, 40, 50);
    }
  }

  private paintNeonCoreDetails(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;
    
    const coreTheme = getActiveCoreThemeConfig();
    const primaryColor = coreTheme ? coreTheme.colors.primary : '#39ff14';
    
    ctx.strokeStyle = coreTheme ? `${primaryColor}22` : 'rgba(57, 255, 20, 0.05)';
    ctx.lineWidth = 1;

    // Corner high-tech bracket wireframes
    const offset = 30;
    const size = 40;
    
    // Top-Left corner bracket
    ctx.beginPath();
    ctx.moveTo(offset, offset + size);
    ctx.lineTo(offset, offset);
    ctx.lineTo(offset + size, offset);
    
    // Top-Right corner bracket
    ctx.moveTo(w - offset, offset + size);
    ctx.lineTo(w - offset, offset);
    ctx.lineTo(w - offset - size, offset);
    
    // Bottom-Left corner bracket
    ctx.moveTo(offset, h - offset - size);
    ctx.lineTo(offset, h - offset);
    ctx.lineTo(offset + size, h - offset);
    
    // Bottom-Right corner bracket
    ctx.moveTo(w - offset, h - offset - size);
    ctx.lineTo(w - offset, h - offset);
    ctx.lineTo(w - offset - size, h - offset);
    ctx.stroke();

    // Technical labeling texts
    ctx.fillStyle = coreTheme ? `${primaryColor}44` : 'rgba(57, 255, 20, 0.15)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('TACTICAL_GRID_LN-01', offset, offset - 10);
    ctx.fillText('NEXUS_SHIELDS_ONLINE', w - offset - 100, offset - 10);
    ctx.fillText('SECTOR_SEVEN_CORE', offset, h - offset + 15);
  }

  private paintQuantumVoidNebula(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;

    // Layer 1: Indigo anomaly center left
    let grad = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5);
    grad.addColorStop(0, 'rgba(75, 0, 130, 0.08)');
    grad.addColorStop(0.5, 'rgba(48, 25, 52, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Layer 2: Deep magenta center right
    grad = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.4);
    grad.addColorStop(0, 'rgba(186, 85, 211, 0.06)');
    grad.addColorStop(0.5, 'rgba(128, 0, 128, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Delicate matrix anomalies (constellation threads)
    ctx.strokeStyle = 'rgba(187, 0, 255, 0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const stars = [
      { x: w * 0.2, y: h * 0.2 }, { x: w * 0.35, y: h * 0.3 }, 
      { x: w * 0.25, y: h * 0.5 }, { x: w * 0.5, y: h * 0.45 },
      { x: w * 0.65, y: h * 0.3 }, { x: w * 0.8, y: h * 0.25 },
      { x: w * 0.7, y: h * 0.6 }, { x: w * 0.85, y: h * 0.75 },
    ];
    for (let i = 0; i < stars.length - 1; i++) {
      ctx.moveTo(stars[i].x, stars[i].y);
      ctx.lineTo(stars[i+1].x, stars[i+1].y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(187, 0, 255, 0.12)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('QUANTUM_STATES: ENTANGLED_TRUE', 40, 40);
  }

  private paintEmberMagmaCracks(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;

    // Draw solid volcanic plate structures/crack outlines
    ctx.strokeStyle = 'rgba(255, 68, 0, 0.06)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Horizontal cracking lines representing tectonic plate fissures
    let y = h - 60;
    ctx.moveTo(0, y);
    ctx.lineTo(w * 0.2, y - 20);
    ctx.lineTo(w * 0.45, y + 10);
    ctx.lineTo(w * 0.7, y - 30);
    ctx.lineTo(w, y + 5);
    
    // Secondary fracture
    y = h * 0.3;
    ctx.moveTo(0, y);
    ctx.lineTo(w * 0.3, y + 40);
    ctx.lineTo(w * 0.6, y - 20);
    ctx.lineTo(w * 0.8, y + 15);
    ctx.lineTo(w, y - 10);
    ctx.stroke();

    // Warm heat source zones at the far edges
    const grad = ctx.createLinearGradient(0, h, 0, h - 120);
    grad.addColorStop(0, 'rgba(255, 20, 0, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - 120, w, 120);

    ctx.fillStyle = 'rgba(255, 68, 0, 0.15)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('CRUST_THERMODYNAMIC_ALARM', 40, h - 20);
  }

  private paintFrostbyteCrystals(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;

    // Freezing vignette: cyan glow framing the scene
    const grad = ctx.createRadialGradient(w/2, h/2, w * 0.4, w/2, h/2, w);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.8, 'rgba(0, 204, 255, 0.02)');
    grad.addColorStop(1, 'rgba(0, 204, 255, 0.06)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative geometric snowflake nodes in the background
    ctx.strokeStyle = 'rgba(0, 204, 255, 0.03)';
    ctx.lineWidth = 1;
    
    const drawSnowflakeNode = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        
        // Minor needles
        const subX = cx + Math.cos(angle) * (r * 0.6);
        const subY = cy + Math.sin(angle) * (r * 0.6);
        ctx.moveTo(subX, subY);
        ctx.lineTo(subX + Math.cos(angle + 0.5) * (r * 0.3), subY + Math.sin(angle + 0.5) * (r * 0.3));
        ctx.moveTo(subX, subY);
        ctx.lineTo(subX + Math.cos(angle - 0.5) * (r * 0.3), subY + Math.sin(angle - 0.5) * (r * 0.3));
      }
      ctx.stroke();
    };

    drawSnowflakeNode(w * 0.15, h * 0.25, 40);
    drawSnowflakeNode(w * 0.85, h * 0.2, 35);
    drawSnowflakeNode(w * 0.1, h * 0.75, 45);
    drawSnowflakeNode(w * 0.8, h * 0.7, 30);

    ctx.fillStyle = 'rgba(0, 204, 255, 0.15)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('CRITICAL_THERMAL_SUB_ZERO', 40, 40);
  }

  private paintVoidAbyssAnomalies(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;

    // Draw central cosmic anomaly singularity
    const cx = w / 2;
    const cy = h / 2;

    // Accretion disk warp shadows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 260, 50, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 210, 40, -0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('GRAVITATIONAL_SINGULARITY_S7', cx - 80, cy + 90);
  }

  private paintGoldenCircuitry(ctx: CanvasRenderingContext2D) {
    const w = this.engine.width;
    const h = this.engine.height;

    // Circuit board layout (golden channels)
    ctx.strokeStyle = 'rgba(255, 204, 0, 0.028)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    // Vertical bus
    ctx.moveTo(w * 0.15, 0);
    ctx.lineTo(w * 0.15, h * 0.3);
    ctx.lineTo(w * 0.15 + 40, h * 0.3 + 40);
    ctx.lineTo(w * 0.15 + 40, h);

    // Parallel bus
    ctx.moveTo(w * 0.15 + 15, 0);
    ctx.lineTo(w * 0.15 + 15, h * 0.29);
    ctx.lineTo(w * 0.15 + 15 + 40, h * 0.29 + 40);
    ctx.lineTo(w * 0.15 + 15 + 40, h);

    // Right-side logic block
    ctx.moveTo(w * 0.85, 0);
    ctx.lineTo(w * 0.85, h * 0.5);
    ctx.lineTo(w * 0.85 - 50, h * 0.5 + 50);
    ctx.lineTo(w * 0.85 - 50, h);

    ctx.moveTo(w * 0.85 - 15, 0);
    ctx.lineTo(w * 0.85 - 15, h * 0.49);
    ctx.lineTo(w * 0.85 - 15 - 50, h * 0.49 + 50);
    ctx.lineTo(w * 0.85 - 15 - 50, h);

    ctx.stroke();

    // Small golden nodes/squares at junctions
    ctx.fillStyle = 'rgba(255, 204, 0, 0.05)';
    ctx.fillRect(w * 0.15 - 2, h * 0.3 - 2, 4, 4);
    ctx.fillRect(w * 0.15 + 15 - 2, h * 0.29 - 2, 4, 4);
    ctx.fillRect(w * 0.85 - 2, h * 0.5 - 2, 4, 4);
    ctx.fillRect(w * 0.85 - 15 - 2, h * 0.49 -  2, 4, 4);

    ctx.fillStyle = 'rgba(255, 204, 0, 0.15)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.fillText('CACHE_DATA_CHIP_ALIGNED', w - 170, h - 30);
  }

  private paintGrid(ctx: CanvasRenderingContext2D, size: number, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < this.engine.width; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.engine.height);
    }
    for (let y = 0; y < this.engine.height; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.engine.width, y);
    }
    ctx.stroke();
  }

  drawGrid(size: number, color: string) {
    if (this.currentFps < 30) return;
    this.paintGrid(this.engine.ctx, size, color);
  }

  private paintStarfield(ctx: CanvasRenderingContext2D, count: number) {
    const step = 2;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < count; i += step) {
      const x = ((i * 137) % this.engine.width);
      const y = ((i * 89) % this.engine.height);
      const s = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStarfield(count: number) {
    if (this.currentFps < 25) return;
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    // Reduce draw calls - skip every other star
    const step = this.currentFps < 40 ? 2 : 1;
    for (let i = 0; i < count; i += step) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * this.engine.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * this.engine.height;
        const s = (Math.sin(t + i) * 0.5 + 0.5) * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(t * 2 + i) * 0.5 + 0.5})`;
        ctx.fillRect(x, y, s, s);
    }
  }

  /** Version for offscreen canvas (takes target context, uses game time for consistency) */
  private paintLavaBubbles(ctx: CanvasRenderingContext2D) {
    const t = this.engine.globalTime;
    const count = 10;
    for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 500) * 0.5 + 0.5) * this.engine.width;
        const y = (this.engine.height - (t * 50 + i * 40) % (this.engine.height + 100));
        const r = (Math.sin(t + i) * 0.5 + 0.5) * 10 + 5;
        ctx.fillStyle = `rgba(255, 50, 0, 0.1)`;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
    }
  }

  drawLavaBubbles() {
    // Fallback: draw directly if cache unavailable
    this.paintLavaBubbles(this.engine.ctx);
  }

  /** Version for offscreen canvas (takes target context, uses game time for consistency) */
  private paintSnowflakes(ctx: CanvasRenderingContext2D) {
    const t = this.engine.globalTime;
    const count = 20;
    for (let i = 0; i < count; i++) {
        const x = (Math.sin(i * 1000 + t * 0.5) * 0.5 + 0.5) * this.engine.width;
        const y = (t * 80 + i * 30) % (this.engine.height + 50);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawSnowflakes() {
    // Fallback: draw directly if cache unavailable
    this.paintSnowflakes(this.engine.ctx);
  }

  drawDynamicMesh() {
    // Skip mesh on very low FPS
    if (this.currentFps < 20) return;
    
    const ctx = this.engine.ctx;
    const t = this.engine.globalTime;
    const width = this.engine.width;
    const height = this.engine.height;
    
    // Determine dynamic state
    const healthRatio = this.engine.health / this.engine.maxHealth;
    const isLowHealth = healthRatio < 0.3;
    const isIntense = this.engine.performanceFactor > 1.5 || this.engine.bugs.length > 20 || this.engine.waveManager.isBossWave;
    
    let waveMultX = 20;
    let waveMultY = 15;
    let speedMult = 1;
    
    if (isLowHealth) {
      waveMultX = 30 + Math.sin(t * 10) * 10;
      waveMultY = 25 + Math.cos(t * 12) * 10;
      speedMult = 2;
    } else if (isIntense) {
      waveMultX = 25;
      waveMultY = 20;
      speedMult = 1.5;
    }

    ctx.lineWidth = 1;
    // Increase grid size on low FPS to reduce lines drawn
    const gridSize = this.currentFps < 40 ? 120 : 80;
    const step = this.meshComplexityStep;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      let first = true;
      for (let y = 0; y <= height; y += step) {
        const waveX = Math.sin((y * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((x * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(x + waveX, y + waveY);
          first = false;
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }
    for (let y = 0; y <= height; y += gridSize) {
      let first = true;
      for (let x = 0; x <= width; x += step) {
        const waveX = Math.sin((y * 0.005) + (t * 0.2 * speedMult)) * waveMultX;
        const waveY = Math.cos((x * 0.005) + (t * 0.15 * speedMult)) * waveMultY;
        if (first) {
          ctx.moveTo(x + waveX, y + waveY);
          first = false;
        } else {
          ctx.lineTo(x + waveX, y + waveY);
        }
      }
    }
    
    let strokeColor = 'rgba(255, 255, 255, 0.01)';
    if (isLowHealth) strokeColor = `rgba(255, 0, 0, ${0.05 + Math.abs(Math.sin(t * 5)) * 0.15})`;
    else if (isIntense) strokeColor = `rgba(255, 150, 0, 0.08)`;
    
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }

  drawCRTOverlay() {
    const ctx = this.engine.ctx;
    const w = this.engine.width;
    const h = this.engine.height;
    
    // Skip full overlay on low FPS
    if (this.currentFps < 30) {
      // Minimal overlay
      if (Math.random() > 0.995) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
        ctx.fillRect(0, 0, w, h);
      }
      return;
    }
    
    ctx.save();
    // Scanlines - reduce frequency
    ctx.fillStyle = 'rgba(18, 16, 16, 0.02)';
    for (let i = 0; i < h; i += 8) {
      ctx.fillRect(0, i, w, 1);
    }
    
    // Flicker
    if (Math.random() > 0.995) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(0, 0, w, h);
    }
    
    // Static noise - reduced from 100 to 30 draws
    ctx.globalAlpha = 0.01;
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    ctx.restore();
  }

  drawGlitchOverlay() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const isBoss = this.engine.waveManager.isBossWave;
    
    // Intensity factor combining wave progression, boss flag, and performance surge
    const performanceFactor = Math.max(1, this.engine.performanceFactor);
    // crtIntensity from scaler provides preset-driven base (0.04 mobile ... 0.22 ultra) + auto damp
    const crtBase = this.scaler.crtIntensity;
    const intensity = (isBoss ? 0.6 : Math.min(0.3, (this.engine.wave - 15) * 0.01)) * (performanceFactor * 0.5 + 0.5) * (crtBase / 0.16);
    
    // Random scanline flicker - reduced frequency on low FPS
    const flickerChance = this.currentFps < 40 ? intensity * 0.5 : intensity;
    if (Math.random() < flickerChance) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * Math.random()})`;
      ctx.fillRect(0, Math.random() * height, width, Math.random() * 3);
    }

    if (isBoss && Math.random() < 0.05 * performanceFactor) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.03)';
        ctx.fillRect(0, Math.random() * height, width, 1);
    }
    
    // Simplified RGB split - skip on low FPS
    if (this.currentFps > 40 && Math.random() < intensity * 0.3) {
      const sliceY = Math.random() * height;
      const sliceH = Math.random() * 15 + 3;
      const offset = (Math.random() - 0.5) * 6 * performanceFactor;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sliceY, width, sliceH);
      ctx.clip();
      ctx.translate(offset, 0);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 255, 0.06)' : 'rgba(0, 255, 255, 0.06)';
      ctx.fillRect(0, sliceY, width, sliceH);
      ctx.restore();
    }
  }

  drawScanlines() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    
    // Skip scanlines on very low FPS to improve performance
    if (this.currentFps < 30) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    
    // Use cached offscreen scanlines — avoids 60+ fillRect calls per frame
    this.staticLayerCache.blitScanlines(this.engine, 10, 'rgba(0, 0, 0, 0.03)');
    
    // Skip moving scanline pulse on low FPS
    if (this.currentFps > 40) {
      const y = (this.engine.globalTime * 100) % height;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, y, width, 50);
    }
    ctx.restore();
  }

  drawChromaticAberration() {
    // Skip on low FPS to save performance
    if (this.currentFps < 35) return;
    
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const offset = this.parent.chromaticOffset;
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.15;
    
    // Simplified aberration - only 3 bands instead of 5
    const bands = 3;
    for (let i = 0; i < bands; i++) {
        const h = height / bands;
        const y = i * h;
        const jitter = (Math.random() - 0.5) * offset * 0.3;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-offset + jitter, y, width, h);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(offset - jitter, y, width, h);
    }
    
    ctx.restore();
  }

  drawBossIntro() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const timer = this.engine.waveManager.bossIntroTimer;
    const t = this.engine.globalTime;

    // Darken and glitch
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, (4 - timer) * 0.5)})`;
    ctx.fillRect(0, 0, width, height);

    if (Math.random() < 0.1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, Math.random() * height, width, 10);
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Scanlines
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Lore / Narrative Text
    ctx.textAlign = 'left';
    ctx.font = '800 12px "JetBrains Mono", monospace';
    
    const logs = [
        "[ ALERT ] : PROJECT NEXUS INTEGRITY BREACHED",
        "[ LOG ]   : ANOMALY CLASS 'OVERSEER' DETECTED IN SECTOR 7",
        "[ LOG ]   : KINETIC SUPPRESSION PROTOCOLS: [ INACTIVE ]",
        "[ ERROR ] : SYSTEM CORRUPTION AT 84.3%",
        "[ LOG ]   : INITIATING EMERGENCY DATA PURGE...",
        "[ ALERT ] : SENTIENCE DETECTED WITHIN THE CORE"
    ];

    const displayCount = Math.floor((4 - timer) * 4);
    for (let i = 0; i < Math.min(logs.length, displayCount); i++) {
        const flicker = Math.random() > 0.1 ? 1 : 0.5;
        ctx.fillStyle = `rgba(255, 50, 50, ${flicker})`;
        ctx.fillText(logs[i], 40, height - 100 - (i * 20));
    }

    // Central Warning
    if (timer < 3) {
        const scale = 1 + Math.sin(t * 15) * 0.05;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        ctx.font = '900 64px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        
        // Glitch split
        const off = Math.sin(t * 40) * 4;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
        ctx.fillText('CORE BREACH', off, 0);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillText('CORE BREACH', -off, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CORE BREACH', 0, 0);
        
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('SYSTEM OVERRIDE IN PROGRESS', 0, 50);
        
        // Progress bar for "override"
        const barW = 300;
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(-barW/2, 70, barW, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-barW/2, 70, barW * (1 - timer / 3), 4);
        
        ctx.restore();
    }
  }

  drawBossWarning() {
    const ctx = this.engine.ctx;
    const width = this.engine.width;
    const height = this.engine.height;
    const t = this.engine.globalTime;
    
    const alpha = Math.abs(Math.sin(t * 8));
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 * alpha})`;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.font = '900 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! WARNING: CRITICAL SYSTEM THREAT !', width / 2, height / 2 - 100);
    
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('OVERSEER CLASS ANOMALY DETECTED', width / 2, height / 2 - 60);
    ctx.restore();
  }

}
