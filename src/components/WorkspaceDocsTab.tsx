import { FileText } from 'lucide-react';

interface WorkspaceDocsTabProps {
  loading: boolean;
  onCompileDoc: () => Promise<void>;
}

export function WorkspaceDocsTab({ loading, onCompileDoc }: WorkspaceDocsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <FileText size={16} />
        </div>
        <div className="space-y-0.5 text-left font-mono">
          <h4 className="text-xs font-black text-white uppercase">Procedural War Log Generator</h4>
          <p className="text-[9px] text-zinc-500 font-medium">Create a formal operational combat debrief and write a Google Doc journal</p>
        </div>
      </div>

      <div className="p-4 bg-[#030508] border border-white/5 rounded-xl font-mono text-left space-y-3">
        <span className="text-[8px] font-mono text-cyan-400 font-black tracking-widest">WAR REPORT METADATA PREVIEW</span>

        <div className="space-y-1 bg-black/60 p-3 rounded border border-white/5 text-[10px]">
          <p className="text-white font-black uppercase">Title: BUGSMASHER Tactical Debrief - Operative Report</p>
          <p className="text-zinc-500 mt-1">Includes core anomaly extermination levels, wave indexes cleared, prestige configurations and tactical instructions for upcoming deployments.</p>
        </div>
      </div>

      <button
        onClick={() => { void onCompileDoc(); }}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
      >
        {loading ? 'TRANSMITTING BRIEFING DATA...' : 'Generate Official google doc War Log'}
      </button>
      <p className="text-[9px] text-zinc-500 font-mono text-center">Saves document to your primary Drive folder, complete with combat diagnostics.</p>
    </div>
  );
}
