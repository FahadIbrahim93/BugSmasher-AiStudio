import { useState, useEffect, type ComponentType } from 'react';
import { motion } from 'motion/react';
import { Shield, Coins, Target, Zap, Award, Bug, BrainCircuit, Sparkles, type LucideProps } from 'lucide-react';
import { progressionManager, ProgressionData } from '../game/ProgressionManager';
import { RESOURCES, SKILLS, ResourceType } from '../game/ResourceTypes';
import { soundManager } from '../game/SoundManager';

// Tree node definition
interface TreeNode {
  id: string;
  name: string;
  branch: 'defense' | 'offense' | 'sentry';
  x: number; // grid x (%)
  y: number; // grid y (%)
  parents: string[];
  icon: ComponentType<LucideProps>;
}

const TREE_NODES: TreeNode[] = [
  // Defensive Core Branch
  { id: 'hardened_hull', name: 'Hardened Hull', branch: 'defense', x: 20, y: 25, parents: [], icon: Shield },
  { id: 'crystal_finder', name: 'Crystal Finder', branch: 'defense', x: 20, y: 70, parents: ['hardened_hull'], icon: Coins },

  // Kinetic Offense Branch
  { id: 'crit_hit', name: 'Critical Stasis', branch: 'offense', x: 50, y: 20, parents: [], icon: Target },
  { id: 'kinetic_amplifier', name: 'Kinetic Amplifier', branch: 'offense', x: 50, y: 50, parents: ['crit_hit'], icon: Zap },
  { id: 'amplified_pulse', name: 'Amplified Pulse', branch: 'offense', x: 50, y: 80, parents: ['kinetic_amplifier'], icon: Award },

  // Autonomous Sentry Branch
  { id: 'scavenger_protocol', name: 'Scavenger Protocol', branch: 'sentry', x: 80, y: 25, parents: [], icon: Bug },
  { id: 'sentry_optimization', name: 'Sentry Optimization', branch: 'sentry', x: 80, y: 55, parents: ['scavenger_protocol'], icon: BrainCircuit },
  { id: 'combo_master', name: 'Combo Master', branch: 'sentry', x: 80, y: 85, parents: ['sentry_optimization'], icon: Sparkles }
];

export default function IntelSkillTree() {
  const [progData, setProgData] = useState<ProgressionData>(progressionManager.getData());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('crit_hit');

  useEffect(() => {
    return progressionManager.subscribe(() => {
      setProgData(progressionManager.getData());
    });
  }, []);

  const handleUpgradeNode = (nodeId: string) => {
    if (progressionManager.upgradeSkill(nodeId)) {
      soundManager.skillUpgrade();
      setProgData(progressionManager.getData());
    } else {
      soundManager.uiError();
    }
  };

  const selectedNode = TREE_NODES.find(n => n.id === selectedNodeId);
  const selectedSkill = SKILLS.find(s => s.id === selectedNodeId);
  const currentRank = selectedSkill ? (progData.skills[selectedNodeId] || 0) : 0;
  const maxRank = selectedSkill?.maxLevel || 1;
  const upgradeCost = selectedSkill?.costPerLevel(currentRank) || {};

  const canAffordNode = selectedSkill && Object.entries(upgradeCost).every(([res, amt]) => {
    return (progData.inventory[res as ResourceType] || 0) >= (amt);
  });

  // Helper to check if node dependencies are met
  const isNodeAvailable = (node: TreeNode) => {
    if (node.parents.length === 0) return true;
    return node.parents.every(parentId => {
      const parentRank = progData.skills[parentId] || 0;
      return parentRank > 0;
    });
  };

  return (
    <motion.div
      key="tree"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex-1 flex flex-col lg:flex-row min-h-0"
    >
      {/* Visual Tree Stage */}
      <div className="flex-1 bg-[#020406] border-b lg:border-b-0 lg:border-r border-cyan-500/10 relative p-6 flex flex-col justify-between overflow-hidden min-h-[350px] lg:min-h-0">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
          {/* Retro Grid Background */}
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 80%), linear-gradient(rgba(18,30,49,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(18,30,49,0.3) 1px, transparent 1px)', backgroundSize: '100% 100%, 20px 20px, 20px 20px' }} />
        </div>

        {/* Header Subtitles / Columns Info */}
        <div className="grid grid-cols-3 w-full text-center z-10 select-none">
          <div>
            <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">DEFENSIVE CHASSIS</span>
            <div className="h-[2px] bg-cyan-500/20 max-w-[80px] mx-auto mt-1" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">KINETIC OFFENSE</span>
            <div className="h-[2px] bg-cyan-500/20 max-w-[80px] mx-auto mt-1" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">SENTRY AUTONOMY</span>
            <div className="h-[2px] bg-cyan-500/20 max-w-[80px] mx-auto mt-1" />
          </div>
        </div>

        {/* SVG Web Layers Connecting the Nodes */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          {TREE_NODES.map((node) => {
            return node.parents.map((parentId) => {
              const parent = TREE_NODES.find(n => n.id === parentId);
              if (!parent) return null;

              const x1 = `${parent.x}%`;
              const y1 = `${parent.y}%`;
              const x2 = `${node.x}%`;
              const y2 = `${node.y}%`;

              const parentRank = progData.skills[parentId] || 0;
              const isUnlocked = parentRank > 0;

              return (
                <line
                  key={`${parentId}-${node.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isUnlocked ? '#06b6d4' : '#1e293b'}
                  strokeWidth={isUnlocked ? 2.5 : 1.5}
                  strokeDasharray={isUnlocked ? undefined : '5,5'}
                  className={isUnlocked ? 'animate-[dash_2s_linear_infinite]' : ''}
                />
              );
            });
          })}
        </svg>

        {/* Node Buttons Layers */}
        <div className="absolute inset-0 z-10">
          {TREE_NODES.map((node) => {
            const NodeIcon = node.icon;
            const rank = progData.skills[node.id] || 0;
            const isSelected = selectedNodeId === node.id;
            const isAvailable = isNodeAvailable(node);
            const isUnlocked = rank > 0;

            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <button
                  onClick={() => { soundManager.uiClick(); setSelectedNodeId(node.id); }}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                    isUnlocked 
                      ? 'bg-rose-950/40 border-rose-500 text-rose-400 hover:scale-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : isAvailable
                      ? 'bg-zinc-950 border-rose-500/45 text-rose-500/70 hover:scale-110 hover:border-rose-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50'
                  } ${isSelected ? 'ring-4 ring-rose-400 ring-offset-4 ring-offset-black scale-110' : ''}`}
                  disabled={!isAvailable && !isUnlocked}
                >
                  <NodeIcon size={20} />
                </button>
                
                {/* Rank Pip */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black border border-rose-500/30 rounded px-1.5 py-0.5 text-[8px] font-mono text-rose-300 pointer-events-none font-bold whitespace-nowrap">
                  RANK {rank}
                </div>
              </div>
            );
          })}
        </div>

        <div className="z-10 select-none text-right font-mono">
          <span className="text-[10px] font-mono text-rose-500/30 uppercase tracking-widest">TAP NODES TO ANALYZE OR UPGRADE SYSTEMS</span>
        </div>
      </div>

      {/* Selection Inspector Column */}
      <div className="w-full lg:w-[380px] bg-rose-950/5 flex flex-col justify-between p-6">
        {selectedNode && selectedSkill ? (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-rose-400 font-extrabold uppercase bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                  {selectedNode.branch.toUpperCase()} SYSTEM
                </span>
                <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">CALIBRATED</span>
              </div>
              <h4 className="text-xl font-black text-white uppercase font-display tracking-tight mt-2">{selectedNode.name}</h4>
              <div className="h-px bg-rose-500/20 mt-3" />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Description</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{selectedSkill.description}</p>
            </div>

            {/* Rank indicators */}
            <div className="flex items-center justify-between p-3.5 bg-rose-950/20 border border-rose-500/10 rounded-xl">
              <span className="text-xs font-mono text-zinc-400">Target Efficiency</span>
              <span className="text-sm font-mono font-black text-rose-300 uppercase">
                {currentRank >= maxRank ? 'MAX SECTORS SECURED' : `RANK ${currentRank} / ${maxRank}`}
              </span>
            </div>

            {/* Connection tree dependencies */}
            {selectedNode.parents.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Required Connection</span>
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
                  <Shield size={12} className="text-rose-500" />
                  <span>Must unlock {TREE_NODES.find(n => n.id === selectedNode.parents[0])?.name || 'parent'}</span>
                </div>
              </div>
            )}

            {/* Costs and affordability */}
            {currentRank < maxRank && (
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Nanotech Assembly Cost</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(upgradeCost).map(([res, amt]) => {
                    if (!amt) return null;
                    const resDef = RESOURCES[res as ResourceType];
                    const has = progData.inventory[res as ResourceType] || 0;
                    const needed = amt;
                    return (
                      <div key={res} className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex flex-col justify-center">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resDef.color }} />
                          <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none truncate">{resDef.name}</span>
                        </div>
                        <span className={`text-xs font-mono font-black leading-none ${has >= needed ? 'text-cyan-400' : 'text-red-500'}`}>
                          {has} / {needed}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action trigger button */}
            <button
              onClick={() => { handleUpgradeNode(selectedNodeId); }}
              disabled={!canAffordNode || currentRank >= maxRank}
              className={`w-full py-4 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition-all text-center ${
                currentRank >= maxRank
                  ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 cursor-not-allowed'
                  : canAffordNode
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95'
                  : 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              {currentRank >= maxRank ? 'MAX SECTORS SECURED' : canAffordNode ? 'Initiate Upgrade Link' : 'INSUFFICIENT NANOTECH'}
            </button>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-40">
            <p className="text-xs font-mono">SELECT SYSTEM BLOCK TO ANALYZE</p>
          </div>
        )}

        {/* Shared Inventory display footer */}
        <div className="p-3 border-t border-cyan-500/10 mt-6 select-none bg-cyan-950/10 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-mono text-cyan-500/55 uppercase">BIOTIC CR:</span>
          <span className="text-sm font-mono font-bold text-cyan-300">{progData.inventory.crystals || 0}</span>
        </div>
      </div>

    </motion.div>
  );
}
