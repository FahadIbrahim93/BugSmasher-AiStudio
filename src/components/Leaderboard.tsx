import { X, Trophy, Medal, Hash, Skull, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FirebaseService, LeaderboardEntry } from '../lib/firebaseService';
import { HighScoreManager, HighScoreEntry } from '../game/HighScoreManager';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [tab, setTab] = useState<'global' | 'local'>('global');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<HighScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGlobal() {
      if (tab === 'global') {
        setLoading(true);
        try {
          const top = await FirebaseService.getTopScores(20);
          setGlobalEntries(top);
        } catch (err) {
          console.error("Failed to load global scores:", err);
          setGlobalEntries([]);
        } finally {
          setLoading(false);
        }
      }
    }
    loadGlobal();
  }, [tab]);

  useEffect(() => {
    setLocalEntries(HighScoreManager.getTopScores());
  }, [tab]);

  const handleClearLocal = () => {
    if (confirm('Are you sure you want to permanently format all local top-5 scores?')) {
      HighScoreManager.clearScores();
      setLocalEntries([]);
      soundManager.uiClick();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-lg transition-colors ${tab === 'global' ? 'bg-cyan-500/10' : 'bg-fuchsia-500/10'}`}>
              <Trophy className={`w-6 h-6 ${tab === 'global' ? 'text-cyan-400' : 'text-fuchsia-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-white uppercase font-display">
                {tab === 'global' ? 'Global Leaderboard' : 'Local Host Top-5'}
              </h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {tab === 'global' ? 'Nexus Archive / Sector Rankings' : 'Physical Memory / Client Threading'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { soundManager.uiClick(); onClose(); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          <button
            onClick={() => { soundManager.uiClick(); setTab('global'); }}
            className={`flex-1 py-3 text-xs font-mono font-extrabold uppercase tracking-widest transition-all border-b-2 ${
              tab === 'global' ? 'text-cyan-400 border-cyan-500 bg-white/[0.04]' : 'text-zinc-500 border-transparent hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            Global Network
          </button>
          <button
            onClick={() => { soundManager.uiClick(); setTab('local'); }}
            className={`flex-1 py-3 text-xs font-mono font-extrabold uppercase tracking-widest transition-all border-b-2 ${
              tab === 'local' ? 'text-fuchsia-400 border-fuchsia-500 bg-white/[0.04]' : 'text-zinc-500 border-transparent hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            Host Storage (Top 5)
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {tab === 'global' ? (
            loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-zinc-500 animate-pulse">SYNCHRONIZING WITH NEXUS...</p>
                </div>
              </div>
            ) : globalEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                <Hash className="w-12 h-12 text-zinc-500" />
                <p className="font-mono text-xs uppercase tracking-widest">No data entries found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {globalEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      idx === 0 ? 'bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-8 flex justify-center">
                        {idx < 3 ? (
                          <Medal className={`w-6 h-6 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : 'text-amber-600'}`} />
                        ) : (
                          <span className="text-xs font-mono text-zinc-600 font-bold">#{(idx + 1).toString().padStart(2, '0')}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">{entry.username}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-widest flex items-center gap-1">
                            <Skull className="w-3 h-3 text-cyan-400" /> Wave {entry.wave}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-black text-cyan-400 font-mono tracking-tighter">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                        {(() => {
                          const ua = entry.updatedAt;
                          const ms = typeof ua === 'number' ? ua : (ua && typeof ua === 'object' && 'seconds' in ua ? (ua as any).seconds * 1000 : Date.now());
                          return new Date(ms).toLocaleDateString();
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )
          ) : (
            localEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 text-center py-20">
                <Hash className="w-12 h-12 text-zinc-700 font-mono" />
                <div>
                  <p className="font-mono text-xs uppercase text-zinc-500 tracking-widest">NO HARDWARE ENTRIES SAVED</p>
                  <p className="font-mono text-[9px] uppercase text-zinc-600 mt-2">COMPLY WITH QA EXECUTIVES TO RECORD COMBAT DATA</p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {localEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      idx === 0 ? 'bg-fuchsia-950/20 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)]' : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-8 flex justify-center">
                        {idx < 3 ? (
                          <Medal className={`w-6 h-6 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : 'text-amber-600'}`} />
                        ) : (
                          <span className="text-xs font-mono text-zinc-600 font-bold">#{(idx + 1).toString().padStart(2, '0')}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">{entry.playerName}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-widest flex items-center gap-1">
                            <Skull className="w-3 h-3 text-fuchsia-400" /> Wave {entry.wave}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-black text-fuchsia-400 font-mono tracking-tighter">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3 text-zinc-600" /> {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            {tab === 'global' ? 'Relay System Version: v3.1 / ENCRYPTED_SSL' : 'Host Environment Strategy: Top 5 Storage'}
          </p>
          {tab === 'local' && localEntries.length > 0 ? (
            <button
              onClick={handleClearLocal}
              className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-500/20 hover:border-red-500/50 rounded text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Clear Local Scores
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-mono text-green-500/70 uppercase">Relay: Live</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
