import React, { useState } from 'react'
import { saveManager } from '@/lib'
import { achievementSystem } from '@/lib/AchievementSystem'

interface SettingsMenuProps {
  onClose: () => void
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(saveManager.isSoundEnabled())
  const [musicEnabled, setMusicEnabled] = useState(saveManager.isMusicEnabled())
  const [tab, setTab] = useState<'settings' | 'stats' | 'achievements'>('settings')

  const toggleSound = () => { const v = !soundEnabled; setSoundEnabled(v); saveManager.setSoundEnabled(v) }
  const toggleMusic = () => { const v = !musicEnabled; setMusicEnabled(v); saveManager.setMusicEnabled(v) }

  const h = Math.floor(saveManager.getTotalPlayTime() / 3600)
  const m = Math.floor((saveManager.getTotalPlayTime() % 3600) / 60)

  return (
    <div className="flex flex-col items-center max-w-lg w-full p-8 space-y-6">
      <div className="text-center border-b border-white/10 pb-4 w-full">
        <div className="text-xs text-white/30 font-mono tracking-[0.3em]">SETTINGS</div>
      </div>

      <div className="flex w-full border border-white/10">
        {(['settings', 'stats', 'achievements'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] font-mono tracking-widest transition-all ${
              tab === t ? 'bg-white/5 text-white/60 border-b border-white/30' : 'text-white/20 hover:text-white/40'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between p-3 border border-white/10">
            <span className="text-xs font-mono text-white/60">Sound Effects</span>
            <button
              onClick={toggleSound}
              className={`px-4 py-1.5 text-[10px] font-mono tracking-widest border transition-all ${
                soundEnabled ? 'border-white/30 text-white/60' : 'border-white/10 text-white/20'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 border border-white/10">
            <span className="text-xs font-mono text-white/60">Music</span>
            <button
              onClick={toggleMusic}
              className={`px-4 py-1.5 text-[10px] font-mono tracking-widest border transition-all ${
                musicEnabled ? 'border-white/30 text-white/60' : 'border-white/10 text-white/20'
              }`}
            >
              {musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 border border-white/10">
            <span className="text-xs font-mono text-white/60">Performance Mode</span>
            <span className="text-[10px] font-mono text-white/30">Auto</span>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'HIGH SCORE', value: saveManager.getHighScore().toLocaleString() },
              { label: 'GAMES PLAYED', value: String(saveManager.getGamesPlayed()) },
              { label: 'TOTAL KILLS', value: saveManager.getTotalBugsKilled().toLocaleString() },
              { label: 'HIGHEST WAVE', value: String(saveManager.getHighestWave()) },
              { label: 'CRYSTALS EARNED', value: saveManager.getTotalCrystalsEarned().toLocaleString() },
              { label: 'TOTAL PLAY TIME', value: `${h}h ${m}m` },
            ].map(s => (
              <div key={s.label} className="p-3 border border-white/10 text-center">
                <div className="text-[9px] font-mono text-white/30 tracking-wider">{s.label}</div>
                <div className="text-sm font-mono text-white/70 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="w-full max-h-80 overflow-y-auto space-y-2">
          <div className="text-[10px] font-mono text-white/30 mb-3 text-center">
            {achievementSystem.getUnlockCount()} / {achievementSystem.getTotalCount()} UNLOCKED
          </div>
          {achievementSystem.achievements.map(a => (
            <div key={a.id} className={`p-3 border ${a.unlocked ? 'border-yellow-400/20' : 'border-white/5'} text-left`}>
              <div className="flex items-center gap-3">
                <span className="text-sm">{a.icon}</span>
                <div className="flex-1">
                  <div className={`text-xs font-mono ${a.unlocked ? 'text-white/70' : 'text-white/30'}`}>{a.name}</div>
                  <div className="text-[10px] font-mono text-white/20">{a.description}</div>
                </div>
                <div className={`text-[10px] font-mono ${a.unlocked ? 'text-yellow-400/50' : 'text-white/10'}`}>
                  {a.unlocked ? '✓' : `${a.requirement.type} ${a.requirement.target}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-4 border border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 font-mono text-sm tracking-[0.3em] transition-all"
      >
        CLOSE
      </button>
    </div>
  )
}
