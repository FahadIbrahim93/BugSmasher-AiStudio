import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Download, Trash2, Edit2, Calendar, Check } from 'lucide-react';
import { SaveManager, GameSaveData } from '../game/SaveManager';
import { SaveSlot } from '../game/IndexedDBSaveSystem';
import { soundManager } from '../game/SoundManager';

interface SaveSlotsModalProps {
  mode: 'save' | 'load';
  gameStateToSave?: GameSaveData;
  onClose: () => void;
  onSlotLoaded?: (data: GameSaveData) => void;
  onSlotSaved?: () => void;
}

const TOTAL_SLOTS = 4;

export function SaveSlotsModal({
  mode,
  gameStateToSave,
  onClose,
  onSlotLoaded,
  onSlotSaved,
}: SaveSlotsModalProps) {
  const [slots, setSlots] = useState<Record<string, SaveSlot>>({});
  const [loading, setLoading] = useState(true);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Fetch slots on load
  const fetchSlots = async () => {
    setLoading(true);
    try {
      const list = await SaveManager.listSlots();
      const slotsMap: Record<string, SaveSlot> = {};
      list.forEach((slot) => {
        slotsMap[slot.id] = slot;
      });
      setSlots(slotsMap);
    } catch (e) {
      console.error('Failed to load slots list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSaveToSlot = async (slotId: string) => {
    if (!gameStateToSave) return;
    soundManager.uiClick();

    const defaultName = `Slot ${slotId.split('_')[1]} - Wave ${gameStateToSave.wave}`;
    const success = await SaveManager.saveToSlot(slotId, gameStateToSave, defaultName);
    if (success) {
      await fetchSlots();
      if (onSlotSaved) onSlotSaved();
    }
  };

  const handleLoadFromSlot = async (slotId: string) => {
    soundManager.uiClick();
    const data = await SaveManager.loadFromSlot(slotId);
    if (data && onSlotLoaded) {
      onSlotLoaded(data);
    }
  };

  const handleDeleteSlot = async (slotId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    soundManager.uiError();
    if (confirm('Are you sure you want to permanently format this neural memory bank (delete save)?')) {
      await SaveManager.deleteSlot(slotId);
      await fetchSlots();
    }
  };

  const startRenameSlot = (slotId: string, currentName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    soundManager.uiClick();
    setEditingSlotId(slotId);
    setTempName(currentName);
  };

  const submitRename = async (slotId: string) => {
    soundManager.uiClick();
    const slot = slots[slotId];
    if (!slot || !tempName.trim()) {
      setEditingSlotId(null);
      return;
    }

    const updatedSlot = {
      ...slot,
      name: tempName.trim()
    };

    const success = await SaveManager.saveToSlot(slotId, updatedSlot.data, updatedSlot.name);
    if (success) {
      await fetchSlots();
    }
    setEditingSlotId(null);
  };

  const getBiomeColors = (biome: string) => {
    switch (biome) {
      case 'quantum_void':
        return { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', glow: 'shadow-cyan-500/20', raw: '#06b6d5' };
      case 'ember_depths':
        return { text: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-950/20', glow: 'shadow-red-500/20', raw: '#ff3300' };
      case 'frostbyte':
        return { text: 'text-cyan-300', border: 'border-cyan-450/30', bg: 'bg-sky-950/20', glow: 'shadow-cyan-400/20', raw: '#00ffff' };
      case 'void_abyss':
        return { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20', glow: 'shadow-purple-500/20', raw: '#a855f7' };
      case 'golden_cache':
      case 'golden_spire':
        return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', glow: 'shadow-amber-500/20', raw: '#fbbf24' };
      default:
        return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', glow: 'shadow-emerald-500/20', raw: '#39ff14' };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl relative"
      >
        {/* Abstract futuristic background decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono font-black text-cyan-400 tracking-widest uppercase">
              COGNITIVE STORAGE CORE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-wider flex items-center mt-1">
              {mode === 'save' ? (
                <>
                  <Save className="w-6 h-6 mr-3 text-cyan-400" />
                  Save Game State
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-3 text-emerald-400" />
                  Load Game State
                </>
              )}
            </h2>
          </div>
          <button
            onClick={() => { soundManager.uiClick(); onClose(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors border border-transparent hover:border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Description */}
        <p className="text-zinc-400 text-xs sm:text-sm font-mono mb-6 leading-relaxed">
          {mode === 'save' 
            ? 'Select a neural memory slate below to commit your current cybernetic progression matrix. Overwriting an occupied slate formats the old node data.'
            : 'Select an active core archive cell to restore your battlefield progression. Loading a state replaces the current operation sequence.'}
        </p>

        {/* Save Slots List Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Accessing IndexedDB Memory Banks...</span>
            </div>
          ) : (
            Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
              const slotId = `slot_${index + 1}`;
              const slot = slots[slotId];
              const isActiveSlot = SaveManager.getActiveSlotId() === slotId;

              if (!slot) {
                // Empty Slot Card
                return (
                  <div
                    key={slotId}
                    className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between transition-all group"
                  >
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 font-bold group-hover:text-zinc-400 transition-colors font-mono">
                        0{index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 font-mono">CELL SLATE {index + 1}</span>
                        <span className="text-sm font-black text-zinc-600 font-mono tracking-widest uppercase">
                          MEMORY EMPTY
                        </span>
                      </div>
                    </div>

                    {mode === 'save' ? (
                      <button
                        onClick={() => handleSaveToSlot(slotId)}
                        onMouseEnter={() => soundManager.uiHover()}
                        className="py-2.5 px-6 bg-zinc-900 hover:bg-white hover:text-black hover:scale-[1.02] border border-zinc-800 hover:border-white rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 transition-all flex items-center justify-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Write State
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest select-none">
                        Unusable Node
                      </div>
                    )}
                  </div>
                );
              }

              // Occupied Slot Card
              const colors = getBiomeColors(slot.biome);
              const dateText = new Date(slot.timestamp).toLocaleString();
              const healthPercent = (slot.data.health / slot.data.maxHealth) * 100;

              return (
                <div
                  key={slotId}
                  className={`border ${isActiveSlot ? 'border-cyan-500/70 bg-cyan-950/5' : 'border-zinc-800 bg-zinc-950'} rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col relative overflow-hidden group`}
                >
                  {/* Active slot indicator banner */}
                  {isActiveSlot && (
                    <div className="absolute top-0 right-0 bg-cyan-500/10 border-l border-b border-cyan-500 px-3 py-1 font-mono text-[9px] font-bold text-cyan-400 tracking-widest uppercase rounded-bl-xl flex items-center">
                      <Check className="w-3 h-3 mr-1" /> ACTIVE TARGET
                    </div>
                  )}

                  {/* Slot Details and Rename Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    {editingSlotId === slotId ? (
                      <div className="flex items-center space-x-2 w-full max-w-md">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          maxLength={32}
                          className="bg-zinc-900 border border-zinc-700 text-white font-mono text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(slotId);
                            if (e.key === 'Escape') setEditingSlotId(null);
                          }}
                        />
                        <button
                          onClick={() => submitRename(slotId)}
                          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSlotId(null)}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-lg text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold font-mono text-sm ${colors.text}`}>
                          0{index + 1}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white font-mono uppercase tracking-wide">
                              {slot.name}
                            </span>
                            <button
                              onClick={(e) => startRenameSlot(slotId, slot.name, e)}
                              className="text-zinc-500 hover:text-white transition-colors"
                              title="Rename memory core node"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-wider flex items-center mt-0.5">
                            <Calendar className="w-3.5 h-3.5 mr-1" /> committed: {dateText}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl mb-4 font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Current Sector</span>
                      <span className={`text-xs font-bold ${colors.text} uppercase`}>
                        {slot.biome.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Smashed Wave</span>
                      <span className="text-xs font-bold text-white uppercase">
                        WAVE {slot.data.wave}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Battle Score</span>
                      <span className="text-xs font-bold text-white tracking-wider">
                        {slot.data.score.toLocaleString()} PTS
                      </span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono mb-1">Hull Integrity</span>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.max(1, Math.min(100, healthPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons/Actions Row */}
                  <div className="flex items-center justify-between mt-1">
                    {/* Deletion control */}
                    <button
                      onClick={(e) => handleDeleteSlot(slotId, e)}
                      onMouseEnter={() => soundManager.uiHover()}
                      className="text-zinc-500 hover:text-red-400 text-xs font-mono flex items-center transition-colors px-2 py-1 rounded-lg hover:bg-red-500/5"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Format node
                    </button>

                    {/* Write/Load slot action */}
                    {mode === 'save' ? (
                      <button
                        onClick={() => handleSaveToSlot(slotId)}
                        onMouseEnter={() => soundManager.uiHover()}
                        className="py-2 px-5 bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black border border-zinc-800 hover:border-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all flex items-center"
                      >
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Overwrite Slate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLoadFromSlot(slotId)}
                        onMouseEnter={() => soundManager.uiHover()}
                        className="py-2 px-5 bg-zinc-900 text-zinc-400 hover:bg-emerald-500 hover:text-black border border-zinc-800 hover:border-emerald-500 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all flex items-center shadow-lg"
                      >
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Mount Slate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info line */}
        <div className="border-t border-zinc-800 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>COGNITIVE STORAGE: OPERATIONAL</span>
          <span>SYSTEM CHIPS_V1.12</span>
        </div>
      </motion.div>
    </div>
  );
}
