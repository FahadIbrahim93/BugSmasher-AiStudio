import { useState } from 'react';
import { Sparkles, Terminal, Play, X, Sliders, Repeat, Layers, Eye, RefreshCw, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import { CustomMapManager, HANDCRAFTED_BATTLEGROUNDS, type CustomMapConfig } from '../game/CustomMapManager';
import { PCGSystem, type PCGTheme, type PCGMapConfig } from '../game/PCGSystem';

export function BattlegroundGenerator({
  onClose,
  onLaunch,
}: {
  onClose: () => void;
  onLaunch: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'presets' | 'pcg'>('presets');

  // PRESETS STATE
  const [activeMapId, setActiveMapId] = useState<string>(() => {
    const active = CustomMapManager.getActiveConfiguration();
    return active.id;
  });
  const [mapConfig, setMapConfig] = useState<CustomMapConfig>(() => {
    return { ...CustomMapManager.getActiveConfiguration() };
  });
  const [rotationEnabled, setRotationEnabled] = useState<boolean>(() => {
    return CustomMapManager.isRotationEnabled();
  });

  // PCG / PROPOSAL STATE
  const [pcgSeed, setPcgSeed] = useState<string>('ALPHA-99');
  const [pcgTheme, setPcgTheme] = useState<PCGTheme>('cyberspace_node');
  const [previewFlash, setPreviewFlash] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Instantiating a dummy/offline pcg generator for live client-side blueprint computation
  // Minimal structural match for PCGSystem (which only reads width/height + a few other things in practice)
  const dummyEngine = { width: 800, height: 600, bugs: [], hazards: [] } as unknown as import('../game/GameEngine').GameEngine;
  const pcgGenerator = new PCGSystem(dummyEngine);
  const livePcgMap: PCGMapConfig = pcgGenerator.generateMap(pcgSeed, pcgTheme);

  // Load preset config
  const handleSelectMap = (id: string) => {
    soundManager.uiClick();
    const map = CustomMapManager.activateMapById(id);
    setMapConfig({ ...map });
    setActiveMapId(id);
    
    setPreviewFlash(true);
    setTimeout(() => setPreviewFlash(false), 200);
  };

  const handleToggleRotation = () => {
    soundManager.armoryEquip();
    const nextState = !rotationEnabled;
    setRotationEnabled(nextState);
    CustomMapManager.setRotationEnabled(nextState);
  };

  const updateConfig = (key: keyof CustomMapConfig, value: string | number | boolean) => {
    const updated = { ...mapConfig, [key]: value } as CustomMapConfig;
    setMapConfig(updated);
    CustomMapManager.saveCustomMap(updated);
  };

  // Generate a random high-quality procedural seed
  const handleRandomizeSeed = () => {
    soundManager.uiClick();
    const prefixes = ['NEXUS', 'OMEGA', 'ALPHA', 'CORE', 'SWARM', 'SECTOR', 'HYDRA', 'ZETA', 'VOID'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    const newSeed = `${randomPrefix}-${randomNum}`;
    setPcgSeed(newSeed);

    setPreviewFlash(true);
    setTimeout(() => setPreviewFlash(false), 200);
  };

  const handleCopySeedCode = () => {
    soundManager.skillUpgrade();
    const challengeCode = `BUGSMASHER-PCG-SEED://${pcgTheme}::${pcgSeed}`;
    navigator.clipboard.writeText(challengeCode);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 1500);
  };

  const handleLaunch = () => {
    soundManager.uiClick();
    
    if (activeTab === 'pcg') {
      // Save procedurally generated map as the active custom battleground config
      CustomMapManager.saveCustomMap(livePcgMap as unknown as CustomMapConfig);
    }
    
    onLaunch();
  };

  // Resolve visual metadata for the summary panel
  const resolvedMap = activeTab === 'presets' ? mapConfig : livePcgMap;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-[#05070a] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] md:max-h-[88vh]"
      >
        {/* Header Ribbon */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-cyan-500/25 bg-cyan-950/10">
          <div className="flex items-center space-x-3">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 font-display">
                Tactical Battleground Forge
              </h2>
              <p className="text-[9px] text-cyan-400/50 uppercase tracking-widest mt-0.5 leading-none">
                Handcrafted Sectors & Systematic Auto-Rotators // PCG Engine v3.1
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.uiClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex bg-cyan-950/5 border-b border-cyan-500/10 p-2 gap-2">
          <button
            onClick={() => { soundManager.uiClick(); setActiveTab('presets'); }}
            className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'presets'
                ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300'
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Predefined Sectors
          </button>
          <button
            onClick={() => { soundManager.uiClick(); setActiveTab('pcg'); }}
            className={`flex-1 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'pcg'
                ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300'
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Procedural Seed Generator (PCG)
          </button>
        </div>

        {/* Core content block */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300 custom-scrollbar">
          
          <AnimatePresence mode="wait">
            {activeTab === 'presets' ? (
              <motion.div 
                key="presets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Handcrafted Sectors Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-black flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SELECT PREDEFINED INFRASTRUCTURE</span>
                    </label>
                    <span className="text-[8px] font-mono text-cyan-400/60 bg-cyan-950/20 border border-cyan-500/15 px-2 py-0.5 rounded uppercase font-bold">
                      {HANDCRAFTED_BATTLEGROUNDS.length} Sectors Loaded
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {HANDCRAFTED_BATTLEGROUNDS.map((map) => {
                      const isSelected = activeMapId === map.id && !rotationEnabled;
                      return (
                        <button
                          key={map.id}
                          onClick={() => handleSelectMap(map.id)}
                          disabled={rotationEnabled}
                          className={`relative p-3.5 text-left border rounded-2xl transition-all group overflow-hidden ${
                            isSelected 
                              ? 'bg-cyan-950/10 border-cyan-500 shadow-lg shadow-cyan-950/20 scale-[1.02]' 
                              : 'bg-white/[0.01] border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.02] disabled:opacity-35'
                          }`}
                        >
                          {isSelected && (
                            <span 
                              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full shadow-lg"
                              style={{ backgroundColor: map.color, boxShadow: `0 0 10px ${map.color}` }}
                            />
                          )}

                          <p 
                            style={{ color: map.color }}
                            className="text-[8px] font-bold font-mono uppercase tracking-[0.2em]"
                          >
                            {map.visualStyle}__node
                          </p>
                          <p className="text-xs font-black mt-1 text-white group-hover:text-cyan-400 transition-colors uppercase font-mono max-w-[85%] truncate">
                            {map.name.replace(/_/g, ' ')}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-cyan-500/10" />

                {/* Auto Rotation Setting */}
                <div className="p-4 bg-cyan-950/10 border border-cyan-500/15 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                        <Repeat className={`w-4 h-4 text-cyan-400 ${rotationEnabled ? 'animate-spin' : ''}`} />
                        <span>Systematic Auto-Rotation System</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        Automatically morphs, rotates, and renders different handcrafted environments every 5 waves to keep visual tension, color scheme, and battlefield structure in extreme flux.
                      </p>
                    </div>

                    <button
                      onClick={handleToggleRotation}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shrink-0 font-mono ${
                        rotationEnabled 
                          ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                          : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {rotationEnabled ? 'ROTATION: ACTIVE' : 'ENABLE ROTATION'}
                    </button>
                  </div>

                  {rotationEnabled && (
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl flex items-center space-x-3 animate-pulse">
                      <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
                        SYSTEM_SEQUENCE: WAVE_STEP_5_ROTATION_ON // PREDEFINED LAYOUTS IN ROTATION
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="pcg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Part 1: Seed config input, randomizer & copy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold block">
                      SYSTEM ALPHANUMERIC SEED STRING
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pcgSeed}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
                          setPcgSeed(val);
                        }}
                        placeholder="ENTER SEED CODE"
                        maxLength={15}
                        className="flex-1 bg-black/60 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={handleRandomizeSeed}
                        className="px-3.5 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 hover:text-white transition-all active:scale-95"
                        title="Randomize custom seed code"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase font-mono block">Supports letters, digits and dashes. Deterministic layout algorithm.</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold block">
                      COMMUNITY CHALLENGE CODE
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopySeedCode}
                        className="w-full py-2.5 bg-cyan-950/20 hover:bg-cyan-500/15 border border-cyan-500/35 rounded-xl flex items-center justify-center space-x-2 text-cyan-300 text-xs font-mono font-semibold"
                      >
                        <Copy size={14} />
                        <span>{copiedNotification ? 'CODE COPIED!' : 'COPY CHALLENGE CODE'}</span>
                      </button>
                    </div>
                    <span className="text-[8px] text-zinc-500 uppercase font-mono block">Copy challenge blueprint strings to share setup with the community.</span>
                  </div>
                </div>

                {/* Part 2: Theme / Shader selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold block">
                    BIOME PRESET ENVIRO-SHADER
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {([
                      { id: 'nuclear_melt', label: 'MELTDOWN', color: '#39ff14' },
                      { id: 'cyberspace_node', label: 'CYBER GRID', color: '#00f3ff' },
                      { id: 'void_rift', label: 'VOID RIFT', color: '#bf55ec' },
                      { id: 'glacier_ice', label: 'METEOR ICE', color: '#00e5ff' },
                      { id: 'magma_core', label: 'MAGMA FLUX', color: '#ff4500' }
                    ] as const).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => { soundManager.uiClick(); setPcgTheme(theme.id); }}
                        className={`py-3 rounded-xl border font-mono text-[9px] font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                          pcgTheme === theme.id
                            ? 'bg-cyan-500/10 text-white scale-[1.03]'
                            : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:text-white hover:border-cyan-500/10'
                        }`}
                        style={{ borderColor: pcgTheme === theme.id ? theme.color : undefined }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.color, boxShadow: pcgTheme === theme.id ? `0 0 8px ${theme.color}` : undefined }} />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live PCG Blueprint stats summary */}
                <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-2xl">
                  <div className="flex items-center space-x-2.5 mb-3 border-b border-cyan-500/15 pb-2">
                    <Terminal className="text-cyan-400 w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">Blueprints Generation Diagnostics</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 block mb-1">OBSTACLES</span>
                      <span className="text-cyan-300 font-bold">{livePcgMap.obstacles.length} Interactive pylons</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 block mb-1">OBJECTIVE BEACON</span>
                      <span className="text-cyan-300 font-bold">1 Defense Node</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 block mb-1">SPAWN INTENSITY</span>
                      <span className="text-cyan-300 font-bold">{(livePcgMap.spawnMultiplier * 100).toFixed(0)}% frequency</span>
                    </div>
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 block mb-1">GEOMETRIC SCALE</span>
                      <span className="text-cyan-300 font-bold">{livePcgMap.gridSize}px grid</span>
                    </div>
                  </div>
                  
                  {/* Challenge details */}
                  <div className="mt-3 flex items-start gap-2 text-zinc-400 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <Sliders size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] uppercase tracking-wide leading-relaxed font-mono">
                      <span className="text-cyan-400 font-bold">DIFFICULTY PROTOCOL:</span> {livePcgMap.challengeInfo}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px bg-cyan-500/10" />

          {/* Core Settings & Preview card (Adaptive to presets/PCG choices!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            
            {/* Fine settings for calibration (Only visible when active presets is selected) */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>FORGE PARAMETER CALIBRATION</span>
                </h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-1">
                  Fine-tune layout specifications (Manual blocks)
                </p>
              </div>

              {/* Grid Slider */}
              <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold">GRID CALIBRATION SCALE</span>
                  <span className="text-cyan-400 font-extrabold">{resolvedMap.gridSize}px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="10"
                  value={resolvedMap.gridSize}
                  onChange={(e) => {
                    if (activeTab === 'presets') updateConfig('gridSize', parseInt(e.target.value));
                  }}
                  disabled={rotationEnabled || activeTab === 'pcg'}
                  className="w-full accent-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>

              {/* Particle density Slider */}
              <div className="space-y-2 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold">BIOTIC PARTICLES DENSITY</span>
                  <span className="text-cyan-400 font-extrabold">{(resolvedMap as { particleCount?: number }).particleCount || 40} units</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={(resolvedMap as { particleCount?: number }).particleCount || 40}
                  onChange={(e) => {
                    if (activeTab === 'presets') updateConfig('particleCount', parseInt(e.target.value));
                  }}
                  disabled={rotationEnabled || activeTab === 'pcg'}
                  className="w-full accent-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Live Holographic blueprint preview render */}
            <div className="flex flex-col">
              <div className="space-y-1 mb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>TACTICAL BLUEPRINT HUD OVERVIEW</span>
                </h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-1">
                  Live colors & systematic environmental simulation
                </p>
              </div>

              <div 
                className="flex-grow bg-black/80 rounded-2xl p-5 border relative flex flex-col justify-between overflow-hidden shadow-inner select-none min-h-[220px]"
                style={{ 
                  borderColor: rotationEnabled ? '#22d3ee20' : `${resolvedMap.color}25`,
                  backgroundImage: `radial-gradient(circle, ${rotationEnabled ? '#050c18' : resolvedMap.colorA} 0%, ${rotationEnabled ? '#010306' : resolvedMap.colorB} 100%)`
                }}
              >
                <AnimatePresence>
                  {previewFlash && (
                    <motion.div 
                      hot-reload-flash="true"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white z-10 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Render virtual background grid lines */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: `linear-gradient(to right, ${rotationEnabled ? '#00ccff' : resolvedMap.color} 1px, transparent 1px), linear-gradient(to bottom, ${rotationEnabled ? '#00ccff' : resolvedMap.color} 1px, transparent 1px)`,
                  backgroundSize: `${rotationEnabled ? 130 : resolvedMap.gridSize}px ${rotationEnabled ? 130 : resolvedMap.gridSize}px`
                }} />

                {/* Core corner aesthetics */}
                <span className="absolute top-4 left-4 border-t border-l w-2 h-2 opacity-40 pointer-events-none" style={{ borderColor: rotationEnabled ? '#00ccff' : resolvedMap.color }} />
                <span className="absolute top-4 right-4 border-t border-r w-2 h-2 opacity-40 pointer-events-none" style={{ borderColor: rotationEnabled ? '#00ccff' : resolvedMap.color }} />
                <span className="absolute bottom-4 left-4 border-b border-l w-2 h-2 opacity-40 pointer-events-none" style={{ borderColor: rotationEnabled ? '#00ccff' : resolvedMap.color }} />
                <span className="absolute bottom-4 right-4 border-b border-r w-2 h-2 opacity-40 pointer-events-none" style={{ borderColor: rotationEnabled ? '#00ccff' : resolvedMap.color }} />

                <div className="space-y-1 relative z-2">
                  <span 
                    style={{ color: rotationEnabled ? '#22d3ee' : resolvedMap.color }}
                    className="text-[8px] font-mono font-black uppercase tracking-[0.25em]"
                  >
                    {rotationEnabled ? 'ROTATOR_ACTIVE_SEQUENCE' : activeTab === 'presets' ? 'COMPILED_STATIC_BLUEPRINT' : `PROCEDURAL_SEED_MAP // ${pcgTheme.toUpperCase()}`}
                  </span>
                  
                  <h3 className="text-base font-black font-mono text-white uppercase tracking-tight mt-1 max-w-[250px] truncate leading-tight">
                    {rotationEnabled ? 'HANDCRAFTED_SECTOR_ROTATION' : resolvedMap.name}
                  </h3>
                  
                  <p className="text-[9px] text-zinc-400 leading-normal font-mono uppercase tracking-wide pt-1">
                    {rotationEnabled 
                      ? 'Six dynamic environments alternate every wave segment in real-time.'
                      : activeTab === 'presets' 
                      ? 'Preloaded handcrafted target testing sector.'
                      : `Live computed seed from key algorithm.`
                    }
                  </p>
                </div>

                {/* Blueprint details bottom swatch */}
                <div className="flex justify-between items-end relative z-2 border-t border-white/5 pt-3 mt-3">
                  <div className="space-y-0.5">
                    <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block">OPERATING_TAG</span>
                    <span 
                      className="text-[8px] font-mono font-bold block bg-zinc-950 px-2 py-0.5 border border-white/10 rounded truncate max-w-[130px]"
                      style={{ color: rotationEnabled ? '#22d3ee' : resolvedMap.color }}
                    >
                      {rotationEnabled ? 'ROTATOR_SEQ_OK' : resolvedMap.label}
                    </span>
                  </div>

                  <div className="flex space-x-1 border border-white/5 bg-zinc-950 p-1.5 rounded-lg">
                    <div className="w-4.5 h-4.5 rounded border border-white/20" style={{ backgroundColor: rotationEnabled ? '#1a1a1a' : resolvedMap.colorA }} />
                    <div className="w-4.5 h-4.5 rounded border border-white/20" style={{ backgroundColor: rotationEnabled ? '#0a0a0a' : resolvedMap.colorB }} />
                    <div 
                      className="w-4.5 h-4.5 rounded border border-white/20 animate-pulse" 
                      style={{ 
                        backgroundColor: rotationEnabled ? '#00f3ff' : resolvedMap.color,
                        boxShadow: `0 0 6px ${rotationEnabled ? '#00f3ff' : resolvedMap.color}` 
                      }} 
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Big launcher deployer button */}
          <button
            onClick={handleLaunch}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black uppercase text-xs tracking-[0.25em] rounded-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-cyan-950/20 font-mono"
          >
            <Play className="w-4.5 h-4.5 fill-black border-none" />
            <span>DEPLOYS ACTIVE TACTICAL ENVIRONMENT</span>
          </button>

        </div>
      </motion.div>
    </div>
  );
}
