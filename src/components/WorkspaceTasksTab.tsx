import { ClipboardList, Zap } from 'lucide-react';

interface WorkspaceTasksTabProps {
  challenge: { winCondition: { label: string }; modifiers: string[] };
  loading: boolean;
  onSyncTasks: () => Promise<void>;
}

export function WorkspaceTasksTab({ challenge, loading, onSyncTasks }: WorkspaceTasksTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <ClipboardList size={16} />
        </div>
        <div className="space-y-0.5 text-left font-mono">
          <h4 className="text-xs font-black text-white uppercase">Daily Directives Synchronization</h4>
          <p className="text-[9px] text-zinc-500 font-medium">Sync mission objectives into your real-life core task list</p>
        </div>
      </div>

      <div className="bg-[#030508] border border-white/5 p-4 rounded-xl space-y-3.5">
        <p className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-widest">Active Operative Directives</p>

        <div className="flex items-center space-x-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left">
          <Zap size={14} className="text-yellow-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-white uppercase">{challenge.winCondition.label}</p>
            <p className="text-[9px] text-zinc-500 font-mono">PRIMARY MISSION OBJECTIVE</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {challenge.modifiers.map(modId => (
            <div key={modId} className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-[9px] font-mono text-zinc-400">
              <span className="text-red-400 font-bold block uppercase">MODIFIER SECTOR HAZARD</span>
              <span className="uppercase">{modId.replace('_', ' ')} settings</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => { void onSyncTasks(); }}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
      >
        {loading ? 'SYNCHRONIZING DIGITAL ASSETS...' : 'Sync to Google Tasks'}
      </button>
      <p className="text-[9px] text-zinc-500 font-mono text-center">Creates &amp; updates a designated &apos;BUGSMASHER Operative Tasks&apos; list in your Tasks feed.</p>
    </div>
  );
}
