import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Database, Loader2 } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

// Tab bodies are lazy-loaded so the recharts/workspaceService graph only
// ships when the Detox & Recovery Metrics tab is actually opened.
const IntelSkillTree = lazy(() => import('./IntelSkillTree'));
const IntelLog = lazy(() => import('./IntelLog'));
const IntelDashboard = lazy(() => import('./IntelDashboard'));

interface IntelHubProps {
  onBack: () => void;
}

export const IntelHub = ({ onBack }: IntelHubProps) => {
  const [activeTab, setActiveTab] = useState<'log' | 'tree' | 'dashboard'>('tree');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="bg-[#05070a] glass-neon w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        
        {/* Header */}
        <div className="p-6 border-b border-rose-500/20 flex justify-between items-center bg-rose-950/10">
          <div>
            <h2 className="heading-xl text-2xl sm:text-3xl text-rose-500 select-none flex items-center gap-3 uppercase">
              <Database className="text-rose-500 animate-pulse" />
              Somatic Catharsis Log
            </h2>
            <p className="text-rose-400/50 text-[10px] sm:text-xs font-mono mt-1 uppercase tracking-widest leading-none">
              COGNITIVE STRESS TRACKER // AGGRESSION VENT DISCHARGE METRICS // CLINICAL DETOX LOBBY
            </p>
          </div>
          <button 
            onClick={() => { soundManager.uiClick(); onBack(); }}
            className="p-2.5 bg-cyan-950/35 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-400 rounded-full transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection Ribbon */}
        <div className="flex bg-rose-950/5 border-b border-rose-500/10 p-2 gap-2 select-none">
          <button
            onClick={() => { soundManager.uiClick(); setActiveTab('tree'); }}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              activeTab === 'tree'
                ? 'bg-rose-500/15 border border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Catharsis Upgrade Tree
          </button>
          <button
            onClick={() => { soundManager.uiClick(); setActiveTab('log'); }}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              activeTab === 'log'
                ? 'bg-rose-500/15 border border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Cognitive Stress Logs Index
          </button>
          <button
            onClick={() => { soundManager.uiClick(); setActiveTab('dashboard'); }}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              activeTab === 'dashboard'
                ? 'bg-rose-500/15 border border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Detox & Recovery Metrics
          </button>
        </div>

        {/* Core Frame Content */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col lg:flex-row">
          
          <AnimatePresence mode="wait">
            {activeTab === 'tree' && (
              <Suspense fallback={<TabLoading />}><IntelSkillTree key="tree" /></Suspense>
            )}
            {activeTab === 'log' && (
              <Suspense fallback={<TabLoading />}><IntelLog key="log" /></Suspense>
            )}
            {activeTab === 'dashboard' && (
              <Suspense fallback={<TabLoading />}><IntelDashboard key="dashboard" /></Suspense>
            )}
          </AnimatePresence>

        </div>

        {/* Footer */}
        <div className="p-4 bg-cyan-950/20 border-t border-cyan-500/20 text-center select-none flex justify-between items-center px-6">
          <p className="text-[9px] font-mono text-cyan-500/50 tracking-widest uppercase">
            Authorized personnel only // Neural link established
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400/80">COMM LINK: STABLE</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

function TabLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
    </div>
  );
}
