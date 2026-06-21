import { useState, useEffect, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bug, Database, Info, Activity, Shield, Zap, Target, Award, BrainCircuit, Sparkles, Coins,
  TrendingUp, Mail, UploadCloud, DownloadCloud, CheckCircle, RefreshCw, AlertTriangle, FileSpreadsheet, Lock,
  type LucideProps
} from 'lucide-react';
import { GameConfig } from '../game/GameConfig';
import { ProgressionManager, ProgressionData } from '../game/ProgressionManager';
import { RESOURCES, SKILLS, ResourceType } from '../game/ResourceTypes';
import { soundManager } from '../game/SoundManager';
import { useAuth } from '../contexts/AuthContext';
import { StatsManager } from '../game/StatsManager';
import { SaveManager } from '../game/SaveManager';
import { 
  fetchPerformanceHistory, 
  pushPerformanceRow, 
  sendGmailReport, 
  exportSaveToGoogleDrive, 
  importSaveFromGoogleDrive, 
  HistoricalDataPoint 
} from '../lib/workspaceService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface IntelHubProps {
  onBack: () => void;
}

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

export const IntelHub = ({ onBack }: IntelHubProps) => {
  const [activeTab, setActiveTab] = useState<'log' | 'tree' | 'dashboard'>('tree');
  const [progData, setProgData] = useState<ProgressionData>(ProgressionManager.getData());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('crit_hit');

  // Google Workspace States
  const { user, accessToken, signIn } = useAuth();
  const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [gmailStatus, setGmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [backupStatus, setBackupStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Somatic Diagnostics States (Infinity-UI Inspired)
  const [diagIdx, setDiagIdx] = useState(0);
  const [somaticVoltage, setSomaticVoltage] = useState(48);
  const [dopamineRate, setDopamineRate] = useState(82);

  const somaticStatements = [
    "CHANNULATING ACUTE VENT VECTORS...",
    "DISCHARGING AMYGDALA OVERLOAD VOLTAGE...",
    "FLUSHING RESIDUAL STRESS HORMONES & CORTISOL...",
    "CONVERTING ANXIETY FREQUENCIES TO DOPAMINE BURSTS...",
    "STABILIZING SOMATIC CALIBRATION RATIO...",
    "VENT ENGINE DISCHARGE STAGE: SUCCESSFUL // RECOVERY COMPLETE"
  ];

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const interval = setInterval(() => {
      setDiagIdx((prev) => (prev + 1) % somaticStatements.length);
      setSomaticVoltage(Math.floor(Math.random() * 30) + 35);
      setDopamineRate(Math.floor(Math.random() * 20) + 78);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const stats = StatsManager.getStats();

  // Load Spreadsheet performance points on opening dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && accessToken) {
      loadChartData();
    }
  }, [activeTab, accessToken]);

  const loadChartData = async () => {
    setIsLoadingChart(true);
    setDashboardError(null);
    try {
      const data = await fetchPerformanceHistory(accessToken!);
      setChartData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err);
      setDashboardError(msg);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    return ProgressionManager.subscribe(() => {
      setProgData(ProgressionManager.getData());
    });
  }, []);

  const bossIntel = GameConfig.bugs.boss.variants || [];

  const handleUpgradeNode = (nodeId: string) => {
    if (ProgressionManager.upgradeSkill(nodeId)) {
      soundManager.skillUpgrade();
      setProgData(ProgressionManager.getData());
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
    return (progData.inventory[res as ResourceType] || 0) >= (amt as number);
  });

  // Helper to check if node dependencies are met
  const isNodeAvailable = (node: TreeNode) => {
    if (node.parents.length === 0) return true;
    return node.parents.every(parentId => {
      const parentRank = progData.skills[parentId] || 0;
      return parentRank > 0;
    });
  };

  const [recipientEmail, setRecipientEmail] = useState<string>('');

  useEffect(() => {
    if (user?.email) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  const handleBackupDrive = async () => {
    if (!accessToken) return;
    const proceed = window.confirm(
      "CONFIRM CLOUD ARCHIVING:\n\nDo you wish to push your active operational save profile, unlocked nano upgrades, and combat records securely to Google Drive?"
    );
    if (!proceed) return;

    setIsActionLoading(true);
    setBackupStatus(null);
    try {
      const backupBundle = {
        saveData: localStorage.getItem('bugsmasher_save_data'),
        highScore: localStorage.getItem('bugsmasher_all_time_high'),
        stats: localStorage.getItem('nexus_user_stats'),
        progression: localStorage.getItem('nexus_progression'),
        story: localStorage.getItem('bugsmasher_story_progress'),
        timestamp: Date.now()
      };
      await exportSaveToGoogleDrive(accessToken, JSON.stringify(backupBundle));
      setBackupStatus({ success: true, message: 'OPERATIONAL BACKUP DEPLOYED SUCCESSFULLY TO GOOGLE DRIVE.' });
    } catch (err: unknown) {
      setBackupStatus({ success: false, message: (err instanceof Error ? err.message : String(err)) || 'Drive archiving upload failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestoreDrive = async () => {
    if (!accessToken) return;
    const proceed = window.confirm(
      "⚠️ CRITICAL SYSTEM DEBRIS OVERWRITE ALERT ⚠️\n\nThis will download your cloud back-up profile from Google Drive and OVERWRITE all active local tactical progression, crystals, high scores, and logs.\n\nTHIS ACTION CANNOT BE UNDONE. Confirm override?"
    );
    if (!proceed) return;

    setIsActionLoading(true);
    setBackupStatus(null);
    try {
      const rawBackup = await importSaveFromGoogleDrive(accessToken);
      const bundle = JSON.parse(rawBackup);
      
      // Apply back to storage
      if (bundle.saveData) localStorage.setItem('bugsmasher_save_data', bundle.saveData);
      if (bundle.highScore) localStorage.setItem('bugsmasher_all_time_high', bundle.highScore);
      if (bundle.stats) localStorage.setItem('nexus_user_stats', bundle.stats);
      if (bundle.progression) localStorage.setItem('nexus_progression', bundle.progression);
      if (bundle.story) localStorage.setItem('bugsmasher_story_progress', bundle.story);

      setBackupStatus({ success: true, message: 'RESTORE COMPLETED. RE-ALIGNING NEURAL LINK... SYSTEM OVERRIDE ACTIVE!' });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: unknown) {
      setBackupStatus({ success: false, message: (err instanceof Error ? err.message : String(err)) || 'Drive restore failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendGmailReport = async () => {
    if (!accessToken) return;
    setIsActionLoading(true);
    setGmailStatus(null);
    try {
      const targetEmail = recipientEmail || user?.email || 'hopetheorybd@gmail.com';
      await sendGmailReport(accessToken, targetEmail, stats, SaveManager.getHighScore());
      setGmailStatus({ success: true, message: `COMBAT BRIEFS DISPATCHED SECURELY TO: ${targetEmail}` });
    } catch (err: unknown) {
      setGmailStatus({ success: false, message: (err instanceof Error ? err.message : String(err)) || 'Failed to dispatch Gmail briefs.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTriggerSheetsAppend = async () => {
    if (!accessToken) return;
    setIsActionLoading(true);
    try {
      await pushPerformanceRow(accessToken, stats);
      await loadChartData();
    } catch (err: unknown) {
      console.warn("Append failed:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="bg-[#05070a] border border-[#22d3ee]/20 w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        
        {/* Header */}
        <div className="p-6 border-b border-rose-500/20 flex justify-between items-center bg-rose-950/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-500 select-none tracking-tight flex items-center gap-3 font-display uppercase">
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
                              const needed = amt as number;
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
                        onClick={() => handleUpgradeNode(selectedNodeId)}
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
            )}

            {activeTab === 'log' && (
              <motion.div 
                key="log"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0"
              >
                {/* Boss Section */}
                <section>
                  <h3 className="text-xl font-bold text-red-500 mb-4 border-l-4 border-red-500 pl-3 uppercase tracking-tighter">
                    Class-V Apex Predators (Bosses)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {bossIntel.map((boss) => (
                      <div key={boss.id} className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-opacity">
                          <Bug size={80} />
                        </div>
                        <h4 className="text-lg font-bold text-red-400 mb-2">{boss.name}</h4>
                        <div className="space-y-2 text-sm text-red-200/70">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-red-500" />
                            <span>Ability: {boss.logic === 'spider' ? 'Web Snare' : boss.logic === 'moth' ? 'Psionic Distortion' : 'Mandible Armor'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-red-500" />
                            <span>Threat Level: EXTREME</span>
                          </div>
                          <p className="mt-4 text-xs italic opacity-60">
                            {boss.id === 'arachne' && "A multi-limbed nightmare that restricts tactical movement with high-tensile polymer webs."}
                            {boss.id === 'moth' && "Exhibits quantum phase-shifting and neural interference, distorting core targeting systems."}
                            {boss.id === 'mandible' && "Possesses heavily reinforced chitin plating. Vulnerable only during aggressive outreach."}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-red-500/20 flex justify-between items-center text-[10px] font-mono uppercase">
                          <span>Scan Status</span>
                          <span className="text-red-500 animate-pulse">Analyzing...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Regular Bugs */}
                <section>
                  <h3 className="text-xl font-bold text-rose-500 mb-4 border-l-4 border-rose-500 pl-3 uppercase tracking-tighter">
                    Standard Infestation Log
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(GameConfig.bugs).filter(([k]) => k !== 'boss' && k !== 'mini').map(([id, conf]: [string, any]) => (
                      <div key={id} className="p-3 bg-rose-950/20 border border-rose-500/20 rounded hover:border-rose-400 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-rose-400 uppercase">{id}</span>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.color }} />
                        </div>
                        <div className="text-[10px] space-y-1 opacity-70">
                          <div>HP: {conf.baseHp} +{conf.hpPerWave}/W</div>
                          <div>SPD: {conf.baseSpeed}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Biome Data */}
                <section>
                  <h3 className="text-xl font-bold text-purple-500 mb-4 border-l-4 border-purple-500 pl-3 uppercase tracking-tighter">
                    Biome Archetypes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(GameConfig.biomes).map(([id, b]) => (
                      <div key={id} className="p-3 bg-purple-950/20 border border-purple-500/20 rounded flex gap-4 items-start">
                        <div className="p-2 bg-black/40 rounded">
                          <Info size={16} className="text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-bold text-purple-300 uppercase text-xs tracking-widest">{b.name}</h5>
                          <p className="text-[10px] text-purple-200/60 mt-1">
                            {id === 'quantum_void' ? 'Anomalous teleportation active.' : id === 'ember_depths' ? 'Extreme thermal stress detected.' : 'Atmospheric conditions regulated.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0 flex flex-col h-full text-zinc-200"
              >
                {/* Connection Status Overlay if not authorized */}
                {!accessToken ? (
                  <div className="space-y-6 select-none max-w-5xl mx-auto w-full">
                    {/* Informative Clinical Banner */}
                    <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl flex flex-col md:flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <Activity className="text-rose-400 animate-pulse" size={24} />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-black text-rose-300 uppercase tracking-wider">SOMATIC COMPACTION INTERACTION MODE // ACTIVE FEED</h4>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          The client-side catharsis telemetry is tracking your active rage venting cycles. Anchor this session below to deploy automated metric sync protocols.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Simulated Amygdala & Cortisol Diagnostic Readout */}
                      <div className="lg:col-span-2 bg-[#05070a]/45 p-6 rounded-2xl border border-rose-500/20 shadow-xl flex flex-col justify-between font-mono space-y-6">
                        <div>
                          <div className="flex items-center justify-between border-b border-rose-500/10 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <span className="text-xs font-black text-rose-300 uppercase tracking-widest">CEREBRAL_VENT_DIAGNOSTICS</span>
                            </div>
                            <span className="text-[9px] text-[#22c55e] bg-emerald-950/20 border border-emerald-500/25 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">VENTING_ACTIVE</span>
                          </div>

                          {/* Specific Telemetry Items matching infinity-ui but clinical */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-xl space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Amygdala Calibration Voltage</span>
                              <div className="flex items-baseline justify-between">
                                <span className="text-xl font-black text-white">{somaticVoltage} mV</span>
                                <span className="text-[8px] text-rose-400 uppercase tracking-widest animate-pulse">[PEAK]</span>
                              </div>
                            </div>

                            <div className="p-3 bg-amber-950/10 border border-amber-500/10 rounded-xl space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Cortisol Disposal Rate</span>
                              <div className="flex items-baseline justify-between">
                                <span className="text-xl font-black text-white">DISCHARGING</span>
                                <span className="text-xs font-black text-amber-400">{dopamineRate}%</span>
                              </div>
                              <div className="w-full bg-amber-950/40 rounded-full h-1 overflow-hidden relative mt-1.5">
                                <div 
                                  className="bg-amber-500 h-full shadow-[0_0_6px_rgba(245,158,11,0.7)] transition-all duration-500" 
                                  style={{ width: `${dopamineRate}%` }}
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Anxiolytic Release Success</span>
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-black text-white">{(stats.totalBugsKilled || 0).toLocaleString()} releases</span>
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Discharged Load Limits</span>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-600">STABLE CORE //</span>
                                <span className="text-emerald-400 font-bold">REDUCED FRUSTRATIONS</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Statements cycle inspired by infinity-ui and matching visual style */}
                        <div className="bg-black/60 border border-rose-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center py-6 min-h-[90px]">
                          <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-2 font-black">NEURAL SYSTEM TELEMETRY STREAM</span>
                          <div className="text-xs text-rose-400 font-extrabold tracking-wider leading-relaxed h-10 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={diagIdx}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="max-w-md block"
                              >
                                {somaticStatements[diagIdx]}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Right: Connect Workspace card */}
                      <div className="bg-[#05070a]/45 p-6 rounded-2xl border border-rose-500/20 shadow-xl flex flex-col justify-between text-center select-none font-mono">
                        <div className="space-y-4">
                          <div className="w-10 h-10 rounded-full border border-rose-500/30 bg-rose-950/20 flex items-center justify-center mx-auto mb-2 animate-bounce">
                            <Lock className="text-rose-400" size={18} />
                          </div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">Deploy HQ Cloud Sync</h3>
                          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                            Unlock dynamic plotting, cross-device persistence backups, Google Sheets log-writing and automated encrypted email brief dispatches.
                          </p>

                          <div className="space-y-2 text-left bg-black/40 p-3 rounded-xl border border-white/5 text-[9px] text-zinc-400">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet size={12} className="text-rose-400 shrink-0" />
                              <span>Sheets: Drive real-time historical stats graphs</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Database size={12} className="text-rose-400 shrink-0" />
                              <span>Drive API: Nanotech profile save archives</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-rose-400 shrink-0" />
                              <span>Gmail Service: Dispatch Weekly Intel briefs</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => { soundManager.uiClick(); signIn(); }}
                          className="w-full mt-6 py-3 bg-rose-600 text-white font-mono font-bold text-xs uppercase rounded-xl hover:bg-rose-500 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95 cursor-pointer"
                        >
                          Establish Workspace Portal
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/10 pb-4">
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 animate-pulse">
                          <TrendingUp size={22} className="text-cyan-400" />
                          DEFENSIVE OPERATIONS STATS FEED
                        </h3>
                        <p className="text-xs text-zinc-300 font-mono mt-0.5 uppercase tracking-widest text-[#22d3ee]/60">
                          OPERATIVE: {user?.email || 'NEXUS OPERATIVE'} | PORTAL STATE: ACTIVE_FEED
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { soundManager.uiClick(); loadChartData(); }}
                          className="px-4 py-2 bg-cyan-950/45 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono text-xs uppercase rounded-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                          disabled={isLoadingChart || isActionLoading}
                        >
                          <RefreshCw size={14} className={isLoadingChart ? 'animate-spin' : ''} />
                          Refresh Sync FEED
                        </button>
                      </div>
                    </div>

                    {/* Stats Widget Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest block">Anomalies Decimated</span>
                        <span className="text-2xl font-mono font-black text-white block mt-1">{(stats.totalBugsKilled || 0).toLocaleString()}</span>
                        <div className="absolute right-2 bottom-2 text-cyan-500/5"><Bug size={40} /></div>
                      </div>
                      <div className="p-4 bg-amber-950/10 border border-amber-500/10 rounded-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest block">Waves Completed</span>
                        <span className="text-2xl font-mono font-black text-white block mt-1">{stats.totalWavesCompleted || 0}</span>
                        <div className="absolute right-2 bottom-2 text-amber-500/5"><Shield size={40} /></div>
                      </div>
                      <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest block">Personal High Score</span>
                        <span className="text-2xl font-mono font-black text-white block mt-1">{SaveManager.getHighScore().toLocaleString()}</span>
                        <div className="absolute right-2 bottom-2 text-emerald-500/5"><Award size={40} /></div>
                      </div>
                      <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-xl relative overflow-hidden">
                        <span className="text-[10px] font-mono text-purple-500/60 uppercase tracking-widest block">Tactical Runtime</span>
                        <span className="text-2xl font-mono font-black text-white block mt-1">{((stats.totalPlayTime || 0) / 60).toFixed(1)} mins</span>
                        <div className="absolute right-2 bottom-2 text-purple-500/5"><Activity size={40} /></div>
                      </div>
                    </div>

                    {/* Performance Graphs Panel */}
                    <div className="bg-black/40 border border-cyan-500/10 rounded-2xl p-6 min-h-[300px] flex flex-col justify-center">
                      {isLoadingChart ? (
                        <div className="text-center py-12 select-none">
                          <RefreshCw className="mx-auto text-cyan-400 mb-3 animate-spin" size={32} />
                          <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Interrogating Tactical Logs Database...</p>
                        </div>
                      ) : dashboardError ? (
                        <div className="text-center py-8">
                          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
                          <h4 className="text-sm font-bold uppercase text-white mb-2 leading-none">Database Frame Fetch Interrupted</h4>
                          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4 leading-normal">{dashboardError}</p>
                          <button
                            onClick={() => { soundManager.uiClick(); loadChartData(); }}
                            className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase rounded hover:bg-amber-500/20"
                          >
                            Recalibrate Connection
                          </button>
                        </div>
                      ) : chartData.length === 0 ? (
                        <div className="text-center py-8">
                          <FileSpreadsheet className="mx-auto text-cyan-500/40 mb-3" size={40} />
                          <h4 className="text-sm font-bold uppercase text-white mb-1 leading-none">No Chronological Logs Located</h4>
                          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6 leading-normal">
                            We haven't found any logged combat sessions in your Google Sheets. Create or append custom records to initialize telemetry mapping!
                          </p>
                          <button
                            onClick={async () => { soundManager.uiClick(); await handleTriggerSheetsAppend(); }}
                            className="px-5 py-2.5 bg-cyan-500 text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-cyan-400 transition-all flex items-center gap-1.5 mx-auto active:scale-95 disabled:opacity-50 cursor-pointer"
                            disabled={isActionLoading}
                          >
                            <UploadCloud size={14} />
                            Deploy Initial Core Metrics to sheet
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-8 min-h-0">
                          {/* Charts Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Area Chart: Purges & Score Progressions */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                <Bug size={14} /> Swarm Neutralization & Core Points Growth
                              </h4>
                              <div className="h-64 w-full bg-black/20 p-2 rounded-xl border border-white/5">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} dy={10} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#05070a', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', fontSize: '11px', fontFamily: 'Courier New, monospace' }} labelClassName="text-cyan-400 font-bold" />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                                    <Area name="Bugs Killed" type="monotone" dataKey="kills" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorKills)" />
                                    <Area name="Score Progress" type="monotone" dataKey="score" stroke="#eab308" strokeWidth={1} fillOpacity={1} fill="url(#colorScore)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Bar Chart: Survival Wave Chronology */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-amber-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                <Shield size={14} /> Surviving Wave Index & Tactical Engagement Time
                              </h4>
                              <div className="h-64 w-full bg-black/20 p-2 rounded-xl border border-white/5">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} dy={10} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#05070a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '11px', fontFamily: 'Courier New, monospace' }} labelClassName="text-amber-500 font-bold" />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                                    <Bar name="Waves Survived" dataKey="wave" fill="#f59e0b" maxBarSize={20} radius={[4, 4, 0, 0]} />
                                    <Bar name="Duration (min)" dataKey="duration" fill="#a855f7" maxBarSize={20} radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                          </div>

                          {/* Quick Append Tool */}
                          <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500 font-mono select-none border-t border-cyan-500/10">
                            <span>Interactive charts drawn dynamically from 'BUGSMASHER Combat Log & Metrics' sheet</span>
                            <button
                              onClick={async () => { soundManager.uiClick(); await handleTriggerSheetsAppend(); }}
                              className="px-3 py-1.5 bg-cyan-950/20 hover:bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] uppercase rounded flex items-center gap-1 transition-all cursor-pointer"
                              disabled={isActionLoading}
                            >
                              <UploadCloud size={10} /> Push/Append Current Stats Row
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Integrated Services: Gmail briefs and Google Drive back-ups */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Google Drive Column */}
                      <div className="bg-[#030508] border border-cyan-500/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-3">
                          <Database size={20} className="text-cyan-400" />
                          <div>
                            <h4 className="text-md font-bold text-white uppercase tracking-wider leading-none">Operational Security backups</h4>
                            <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Google Drive API Deployment // Storage Isolation</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Archiving core weapons parameters, nanotech progressions, unlocked slots, crystals, and threat logs directly to Google Drive enables instant high-fidelity synchronization across devices.
                        </p>
                        
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleBackupDrive}
                            className="flex-1 py-2.5 bg-cyan-950/45 hover:bg-cyan-500/15 border border-cyan-500/45 text-cyan-400 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            disabled={isActionLoading}
                          >
                            <UploadCloud size={14} /> Back-up to Drive
                          </button>
                          <button
                            onClick={handleRestoreDrive}
                            className="flex-1 py-2.5 bg-cyan-950/45 hover:bg-cyan-500/15 border border-cyan-500/45 text-cyan-400 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            disabled={isActionLoading}
                          >
                            <DownloadCloud size={14} /> Get backup profile
                          </button>
                        </div>

                        {backupStatus && (
                          <div className={`p-3 rounded-lg border text-xs font-mono ${
                            backupStatus.success 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                              : 'bg-red-950/20 border-red-500/30 text-red-400'
                          }`}>
                            <div className="flex items-start gap-1.5">
                              {backupStatus.success ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                              <span>{backupStatus.message}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Gmail Column */}
                      <div className="bg-[#030508] border border-cyan-500/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-3">
                          <Mail size={20} className="text-cyan-400" />
                          <div>
                            <h4 className="text-md font-bold text-white uppercase tracking-wider leading-none">Weekly HQ Intel Briefing</h4>
                            <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Gmail Dispatch Service // Secure Blueprints</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Request an encrypted tactical threat brief containing personalized combat analysis, high-score achievements records, and core defensive mechanics tips mapped directly to your inbox.
                        </p>

                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold text-cyan-500">Recipient Dispatch Email</label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full bg-[#030508] border border-cyan-500/20 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 transition-colors"
                            placeholder="Enter recipient email..."
                          />
                        </div>

                        <button
                          onClick={handleSendGmailReport}
                          className="w-full py-2.5 bg-cyan-500 text-black text-xs font-mono font-bold uppercase rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          disabled={isActionLoading || !recipientEmail}
                        >
                          <Mail size={14} /> Send Tactical Briefing
                        </button>

                        {gmailStatus && (
                          <div className={`p-3 rounded-lg border text-xs font-mono ${
                            gmailStatus.success 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                              : 'bg-red-950/20 border-red-500/30 text-red-400'
                          }`}>
                            <div className="flex items-start gap-1.5">
                              {gmailStatus.success ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                              <span>{gmailStatus.message}</span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </>
                )}
              </motion.div>
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
