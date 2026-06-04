import { useState, useEffect } from 'react';
import { Hammer, BrainCircuit, Box, BarChart3, X, Zap, Cpu, Shield, Wrench, FlaskConical, Target, Binary, History, Clock, Trophy, Skull, Waves, Gauge } from 'lucide-react';
import { t } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressionManager, ProgressionData } from '../game/ProgressionManager';
import { RESOURCES, RECIPES, SKILLS, ResourceType, Recipe, Skill } from '../game/ResourceTypes';
import { soundManager } from '../game/SoundManager';
import { StatsManager, UserStats } from '../game/StatsManager';

interface ProgressionCenterProps {
  onClose: () => void;
}

export function ProgressionCenter({ onClose }: ProgressionCenterProps) {
  const [activeTab, setActiveTab] = useState<'crafting' | 'skills' | 'inventory' | 'stats'>('crafting');
  const [data, setData] = useState<ProgressionData>(ProgressionManager.getData());
  const [stats, setStats] = useState<UserStats>(StatsManager.getStats());

  useEffect(() => {
    return ProgressionManager.subscribe(() => {
      setData(ProgressionManager.getData());
    });
  }, []);


  const handleCraft = (recipeId: string, ingredients: Partial<Record<ResourceType, number>>) => {
    if (ProgressionManager.craftItem(recipeId, ingredients)) {
      soundManager.skillUpgrade();
      setData(ProgressionManager.getData());
    } else {
      soundManager.uiError();
    }
  };

  const handleUpgradeSkill = (skillId: string) => {
    if (ProgressionManager.upgradeSkill(skillId)) {
      soundManager.skillUpgrade();
      setData(ProgressionManager.getData());
    } else {
      soundManager.uiError();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-[60] backdrop-blur-2xl flex flex-col p-6 sm:p-10 font-sans text-white overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase flex items-center space-x-3">
              <Binary className="text-blue-500 w-8 h-8" />
              <span>{t('progression.title')}</span>
            </h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-1">{t('progression.subtitle')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Resource Ribbon */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
          {Object.entries(RESOURCES).map(([id, res]) => (
            <div key={id} className="flex items-center space-x-2 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: res.color }} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{res.name}</span>
              <span className="text-sm font-black font-mono">{data.inventory[id as ResourceType] || 0}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-white/10 pb-4">
          <TabButton 
            active={activeTab === 'crafting'} 
            onClick={() => setActiveTab('crafting')}
            icon={<Hammer className="w-4 h-4" />}
            label={t('progression.tabAssembly')}
          />
          <TabButton 
            active={activeTab === 'skills'} 
            onClick={() => setActiveTab('skills')}
            icon={<BrainCircuit className="w-4 h-4" />}
            label={t('progression.tabNeural')}
          />
          <TabButton 
            active={activeTab === 'stats'} 
            onClick={() => {
              setStats(StatsManager.getStats());
              setActiveTab('stats');
            }}
            icon={<BarChart3 className="w-4 h-4" />}
            label={t('progression.tabStats')}
          />
          <TabButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<Box className="w-4 h-4" />}
            label={t('progression.tabStorage')}
          />
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'crafting' && (
              <motion.div 
                key="crafting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {RECIPES.map(recipe => (
                   <CraftCard 
                    key={recipe.id}
                    recipe={recipe}
                    inventory={data.inventory}
                    count={data.consumables[recipe.id] || 0}
                    onCraft={() => handleCraft(recipe.id, recipe.ingredients)}
                   />
                ))}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div 
                key="skills"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {SKILLS.map(skill => (
                  <SkillCard 
                    key={skill.id}
                    skill={skill}
                    inventory={data.inventory}
                    level={data.skills[skill.id] || 0}
                    onUpgrade={() => handleUpgradeSkill(skill.id)}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                   {Object.entries(RESOURCES).map(([id, res]) => (
                     <div key={id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center border border-white/10" style={{ boxShadow: `0 0 20px ${res.color}22` }}>
                           <div className="w-4 h-4 rounded-sm rotate-45" style={{ backgroundColor: res.color }} />
                        </div>
                        <h4 className="font-bold text-xs uppercase tracking-tighter mb-1">{res.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mb-3">{res.rarity.toUpperCase()}</p>
                        <p className="text-2xl font-black font-mono">{data.inventory[id as ResourceType] || 0}</p>
                     </div>
                   ))}
                </div>
                
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                   <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">{t('progression.consumables')}</h3>
                   <div className="flex flex-wrap gap-4">
                      {Object.entries(data.consumables).map(([id, count]) => {
                        const recipe = RECIPES.find(r => r.id === id);
                        if (!recipe) return null;
                        return (
                          <div key={id} className="flex items-center space-x-4 px-6 py-4 bg-black/40 rounded-2xl border border-white/5">
                             <div className="text-blue-400"><Wrench className="w-5 h-5" /></div>
                             <div>
                                <p className="text-xs font-bold uppercase tracking-wide">{recipe.name}</p>
                                <p className="text-xl font-black font-mono">{count}</p>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsDashboard stats={stats} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-white/10 text-white border border-white/10' 
          : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="font-mono text-xs uppercase tracking-widest font-bold">{label}</span>
    </button>
  );
}

function CraftCard({ recipe, inventory, count, onCraft }: { recipe: Recipe, inventory: Record<ResourceType, number>, count: number, onCraft: () => void }) {
  const canCraft = Object.entries(recipe.ingredients).every(([res, amount]) => (inventory[res] || 0) >= (amount as number));

  return (
    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-blue-400 group-hover:scale-110 transition-transform">
          <Wrench className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">{t('progression.inStock')}</p>
          <p className="text-lg font-black font-mono">{count}</p>
        </div>
      </div>
      
      <h3 className="text-lg font-black tracking-tight mb-2">{recipe.name}</h3>
      <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-6">{recipe.description}</p>
      
      <div className="space-y-3 mb-8">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{t('progression.requirements')}</p>
        {Object.entries(recipe.ingredients).map(([res, amount]) => {
          const resDef = RESOURCES[res as ResourceType];
          const has = inventory[res] || 0;
          const needed = amount as number;
          return (
            <div key={res} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resDef.color }} />
                <span className="text-[10px] font-mono text-zinc-400 uppercase">{resDef.name}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${has >= needed ? 'text-zinc-400' : 'text-red-500'}`}>
                {has}/{needed}
              </span>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onCraft}
        disabled={!canCraft}
        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          canCraft 
            ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
            : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
        }`}
      >
        {t('progression.initiateAssembly')}
      </button>
    </div>
  );
}

function formatPlayTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds)}s`;
}

function StatsDashboard({ stats }: { stats: UserStats }) {
  const hasData = stats.totalRuns > 0 || stats.totalBugsKilled > 0 || stats.totalScore > 0;
  const avgKillsPerRun = stats.totalRuns > 0 ? Math.round(stats.totalBugsKilled / stats.totalRuns) : 0;
  const efficiency = stats.totalPlayTime > 0
    ? (stats.totalBugsKilled / (stats.totalPlayTime / 60)).toFixed(1)
    : '—';

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-16 h-16 text-zinc-600 mb-6" />
        <p className="text-zinc-500 font-mono text-sm">{t('progression.statsNoData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          {t('progression.statsTitle')}
        </h3>
        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
          {t('progression.statsLastPlayed')}: {new Date(stats.lastPlayed).toLocaleDateString()}
        </div>
      </div>

      {/* Hero stats — 3 large cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HeroStatCard
          icon={<Trophy className="w-5 h-5" />}
          label={t('progression.statsRuns')}
          value={stats.totalRuns.toLocaleString()}
          color="blue"
        />
        <HeroStatCard
          icon={<Waves className="w-5 h-5" />}
          label={t('progression.statsBestWave')}
          value={stats.bestWaveReached > 0 ? stats.bestWaveReached.toLocaleString() : '—'}
          color="purple"
        />
        <HeroStatCard
          icon={<Skull className="w-5 h-5" />}
          label={t('progression.statsKills')}
          value={stats.totalBugsKilled.toLocaleString()}
          color="green"
        />
      </div>

      {/* Detail stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <DetailStatCard
          icon={<Zap className="w-3.5 h-3.5" />}
          label={t('progression.statsScore')}
          value={stats.totalScore.toLocaleString()}
        />
        <DetailStatCard
          icon={<History className="w-3.5 h-3.5" />}
          label={t('progression.statsWaves')}
          value={stats.totalWavesCompleted.toLocaleString()}
        />
        <DetailStatCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label={t('progression.statsPlayTime')}
          value={formatPlayTime(stats.totalPlayTime)}
        />
        <DetailStatCard
          icon={<Zap className="w-3.5 h-3.5" />}
          label={t('progression.statsPowerups')}
          value={stats.totalPowerupsCollected.toLocaleString()}
        />
        <DetailStatCard
          icon={<Cpu className="w-3.5 h-3.5" />}
          label={t('progression.statsBossesKilled')}
          value={stats.bossesKilled.toLocaleString()}
        />
        <DetailStatCard
          icon={<Target className="w-3.5 h-3.5" />}
          label={t('progression.statsKillsPerRun')}
          value={avgKillsPerRun.toLocaleString()}
        />
      </div>

      {/* Efficiency bar */}
      <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-zinc-500">
            <Gauge className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">{t('progression.statsEfficiency')}</span>
          </div>
          <span className="text-sm font-black font-mono text-white">{efficiency} <span className="text-[9px] font-mono text-zinc-600 font-normal">kills/min</span></span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, stats.totalRuns > 0 ? (stats.totalBugsKilled / stats.totalRuns / 50) * 100 : 0)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
}

function HeroStatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: 'blue' | 'purple' | 'green' }) {
  const gradients = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
    green: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
  };
  const iconColors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-emerald-400',
  };

  return (
    <div className={`p-6 bg-gradient-to-br ${gradients[color]} rounded-3xl border relative overflow-hidden group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className={`flex items-center space-x-2 mb-4 ${iconColors[color]}`}>
          {icon}
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">{label}</span>
        </div>
        <p className="text-3xl font-black font-mono tracking-tighter text-white">{value}</p>
      </div>
    </div>
  );
}

function DetailStatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-center space-x-2 text-zinc-500 mb-3">
        {icon}
        <span className="text-[8px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-white font-mono tracking-tight">{value}</p>
    </div>
  );
}

function SkillCard({ skill, inventory, level, onUpgrade }: { skill: Skill, inventory: Record<ResourceType, number>, level: number, onUpgrade: () => void }) {
  const cost = skill.costPerLevel(level);
  const canUpgrade = Object.entries(cost).every(([res, amount]) => (inventory[res] || 0) >= (amount as number)) && level < skill.maxLevel;

  return (
    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col hover:border-white/20 transition-all group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black tracking-tighter">{skill.name}</h3>
        <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-mono font-black text-blue-400 uppercase">
          {t('progression.rank', { level, max: skill.maxLevel })}
        </div>
      </div>
      
      <p className="text-sm text-zinc-400 mb-8">{skill.description}</p>
      
      <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">{t('progression.upgradePathCost')}</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(cost).map(([res, amount]) => {
            if (!amount) return null;
            const resDef = RESOURCES[res as ResourceType];
            const has = inventory[res] || 0;
            const needed = amount as number;
            return (
              <div key={res} className="flex flex-col space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{resDef.name}</span>
                <span className={`text-xs font-mono font-black ${has >= needed ? 'text-white' : 'text-red-500'}`}>
                  {has} / {needed}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={onUpgrade}
        disabled={!canUpgrade}
        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          canUpgrade 
            ? 'bg-white text-black hover:bg-zinc-200 active:scale-95' 
            : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
        }`}
      >
        {level >= skill.maxLevel ? t('progression.maxRank') : t('progression.engageNeural')}
      </button>
    </div>
  );
}
