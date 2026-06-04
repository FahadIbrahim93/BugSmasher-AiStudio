import { motion } from 'motion/react';
import { Volume2, VolumeX, Settings2, ArrowLeft, MousePointer2, Monitor, Gem, Accessibility, Keyboard, Globe } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useState, useEffect, useCallback } from 'react';
import { loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
  type ColorblindMode,
  type DifficultyId,
} from '../game/AccessibilitySettings';
import { t, setLocale, getLocale, subscribeLocale, type LocaleId } from '../i18n';
import { analytics } from '../lib/analytics';
import {
  loadControlBindings,
  saveControlBindings,
  type ControlBindings,
} from '../game/ControlBindings';

export function SettingsMenu({ onBack, onOpenArmory }: { onBack: () => void; onOpenArmory?: () => void }) {
  const [masterVol, setMasterVol] = useState(soundManager.masterVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);
  const [musicVol, setMusicVol] = useState(soundManager.musicVolume);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [currentLocale, setCurrentLocale] = useState<LocaleId>(getLocale());
  const [a11y, setA11y] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  const updateA11y = (patch: Partial<AccessibilitySettings>) => {
    const next = { ...a11y, ...patch };
    setA11y(next);
    saveAccessibilitySettings(next);
  };

  const handleMasterVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMasterVolume(val);
    setMasterVol(val);
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSfxVolume(val);
    setSfxVol(val);
  };

  const handleMusicVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMusicVolume(val);
    setMusicVol(val);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const [bindings, setBindings] = useState<ControlBindings>(loadControlBindings);
  const [listeningFor, setListeningFor] = useState<string | null>(null);

  const handleKeyCapture = useCallback((e: KeyboardEvent) => {
    if (!listeningFor) return;
    e.preventDefault();
    e.stopPropagation();
    const newBindings = { ...bindings, [listeningFor]: e.code };
    setBindings(newBindings);
    saveControlBindings(newBindings);
    setListeningFor(null);
    soundManager.uiClick();
  }, [listeningFor, bindings]);

  useEffect(() => {
    if (listeningFor) {
      window.addEventListener('keydown', handleKeyCapture, true);
      return () => window.removeEventListener('keydown', handleKeyCapture, true);
    }
  }, [listeningFor, handleKeyCapture]);

  const [showPerformance, setShowPerformance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

  const [highFidelityVFX, setHighFidelityVFX] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_high_fidelity_vfx');
      if (saved !== null) {
        return saved === 'true';
      }
      // Detect mobile device
      const isMobileDevice = (window.innerWidth < 768) || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0) ||
        ('ontouchstart' in window);
      return !isMobileDevice;
    }
    return true;
  });

  const toggleVFX = () => {
    const newValue = !highFidelityVFX;
    setHighFidelityVFX(newValue);
    analytics.track('settings_changed', { key: 'highFidelityVfx', value: newValue });
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_high_fidelity_vfx', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_vfx_settings_changed', { detail: newValue }));
    }
  };

  useEffect(() => subscribeLocale((l) => setCurrentLocale(l)), []);

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    soundManager.uiClick();
    setLocale(e.target.value as LocaleId);
  };

  const togglePerformanceStats = () => {
    const newValue = !showPerformance;
    setShowPerformance(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_show_perf_stats', newValue ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('nexus_perf_stats_changed', { detail: newValue }));
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center z-[60] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={() => { soundManager.uiClick(); onBack(); }}
          className="absolute top-8 left-8 p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Settings2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] font-display">{t('settings.title')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Audio Section */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
              <Volume2 className="w-4 h-4" />
              <span>{t('settings.audio')}</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-white font-mono text-xs uppercase tracking-widest">{t('settings.masterGain')}</label>
                  <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={isMuted ? 0 : masterVol} 
                  onChange={handleMasterVolume}
                  className="w-full accent-white opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">{t('settings.sfxIntensity')}</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={sfxVol} 
                  onChange={handleSfxVolume}
                  className="w-full accent-zinc-500"
                />
              </div>

              <div className="space-y-3">
                <label className="text-white font-mono text-xs uppercase tracking-widest">{t('settings.ambientStream')}</label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={musicVol} 
                  onChange={handleMusicVolume}
                  className="w-full accent-zinc-500"
                />
              </div>

              {/* Volume Preview Button */}
              {(masterVol > 0 || sfxVol > 0 || musicVol > 0) && !isMuted && (
                <button
                  onClick={() => {
                    soundManager.init();
                    soundManager.powerup('multiplier');
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:text-white transition-colors text-zinc-400 font-mono text-[10px] uppercase tracking-wider"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{t('settings.previewAudio')}</span>
                </button>
              )}
            </div>
          </section>

          {/* Language */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
              <Globe className="w-4 h-4" />
              <span>{t('locale.label')}</span>
            </div>
            <select
              id="locale-select"
              data-testid="locale-select"
              value={currentLocale}
              onChange={handleLocaleChange}
              aria-label={t('locale.label')}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm normal-case focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="en">{t('locale.en')}</option>
              <option value="es">{t('locale.es')}</option>
            </select>
          </section>

          {/* Graphics & Controls */}
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <Monitor className="w-4 h-4" />
                <span>{t('settings.visuals')}</span>
              </div>
              <div 
                onClick={() => { soundManager.uiClick(); toggleVFX(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group animate-fade-in"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">{t('settings.highFidelityVfx')}</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{t('settings.highFidelityDesc')}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${highFidelityVFX ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${highFidelityVFX ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              <div 
                onClick={() => { soundManager.uiClick(); togglePerformanceStats(); }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-zinc-400 group-hover:text-white transition-colors font-mono text-xs uppercase">{t('settings.showPerfStats')}</span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{t('settings.showPerfDesc')}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showPerformance ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showPerformance ? 'left-6' : 'left-1'}`} />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <MousePointer2 className="w-4 h-4" />
                <span>{t('settings.inputMethod')}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">{t('settings.leftClick')}</span>
                  <span className="text-white uppercase">{t('settings.leftClickAction')}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">{t('settings.hoverCollect')}</span>
                  <span className="text-white uppercase">{t('settings.hoverCollectAction')}</span>
                </div>
              </div>
            </section>

            {/* Control Remapping */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
                <Keyboard className="w-4 h-4" />
                <span>{t('settings.keyBindings')}</span>
              </div>
              {(['fire', 'dash', 'pause'] as const).map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono text-xs uppercase">{action}</span>
                  <button
                    onClick={() => {
                      soundManager.uiClick();
                      setListeningFor(listeningFor === action ? null : action);
                    }}
                    className={`relative px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all ${
                      listeningFor === action
                        ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 animate-pulse shadow-[0_0_12px_rgba(0,255,255,0.3)]'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {listeningFor === action ? t('settings.pressKey') : bindings[action]}
                  </button>
                </div>
              ))}
              <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-wider">
                {t('settings.clickBindingHint')}
              </p>
            </section>
          </div>
        </div>

        {/* Accessibility */}
        <section className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center space-x-3 text-zinc-500 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-2">
            <Accessibility className="w-4 h-4" />
            <span>{t('settings.accessibility')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">              <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              {t('settings.difficulty')}
              <select
                value={a11y.difficulty}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ difficulty: e.target.value as DifficultyId }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="easy">{t('settings.difficultyEasy')}</option>
                <option value="normal">{t('settings.difficultyNormal')}</option>
                <option value="hard">{t('settings.difficultyHard')}</option>
              </select>
            </label>              <label className="flex flex-col gap-2 font-mono text-xs text-zinc-400 uppercase">
              {t('settings.colorblindAssist')}
              <select
                value={a11y.colorblindMode}
                onChange={(e) => { soundManager.uiClick(); updateA11y({ colorblindMode: e.target.value as ColorblindMode, showEnemyShapes: e.target.value !== 'off' }); }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm normal-case"
              >
                <option value="off">{t('settings.colorblindOff')}</option>
                <option value="protanopia">{t('settings.colorblindProtanopia')}</option>
                <option value="deuteranopia">{t('settings.colorblindDeuteranopia')}</option>
                <option value="tritanopia">{t('settings.colorblindTritanopia')}</option>
              </select>
            </label>
          </div>
          {[
            { key: 'reducedMotion' as const, label: t('settings.reducedMotion'), hint: t('settings.reducedMotionHint') },
            { key: 'showEnemyShapes' as const, label: t('settings.enemyShapes'), hint: t('settings.enemyShapesHint') },
            { key: 'gamepadEnabled' as const, label: t('settings.gamepadSupport'), hint: t('settings.gamepadHint') },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => { soundManager.uiClick(); updateA11y({ [item.key]: !a11y[item.key] }); }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-zinc-400 font-mono text-xs uppercase">{item.label}</span>
                <p className="text-[9px] text-zinc-500 font-mono">{item.hint}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative ${a11y[item.key] ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${a11y[item.key] ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </section>

        {/* Cosmetics Shortcut */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <button
            onClick={() => {
              soundManager.uiClick();
              onOpenArmory?.();
            }}
            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <Gem className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{t('settings.armoryShortcut')}</span>
                <p className="text-[10px] font-mono text-zinc-500">{t('settings.armoryDesc')}</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => { soundManager.uiClick(); onBack(); }}
            className="px-12 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
          >
            {t('settings.applyChanges')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
