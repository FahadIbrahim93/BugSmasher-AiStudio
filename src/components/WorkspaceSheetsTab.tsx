import { FileSpreadsheet } from 'lucide-react';
import { SaveManager } from '../game/SaveManager';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#030508]/60 border border-white/5 rounded-xl">
      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">{label}</span>
      <span className="text-sm font-black text-white font-mono mt-0.5 block">{value}</span>
    </div>
  );
}

interface WorkspaceSheetsTabProps {
  stats: { totalBugsKilled: number; totalWavesCompleted: number; totalPlayTime: number };
  loading: boolean;
  onExportSheets: () => Promise<void>;
}

export function WorkspaceSheetsTab({ stats, loading, onExportSheets }: WorkspaceSheetsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <FileSpreadsheet size={16} />
        </div>
        <div className="space-y-0.5 text-left font-mono">
          <h4 className="text-xs font-black text-white uppercase">Spreadsheet Combat Metrics Ledger</h4>
          <p className="text-[9px] text-zinc-500 font-medium">Map cumulative high-fidelity game statistics directly onto spreadsheets</p>
        </div>
      </div>

      {/* Stats Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        <MetricCard label="AGGREGATE KILLS" value={stats.totalBugsKilled.toLocaleString()} />
        <MetricCard label="WAVES CLEARED" value={stats.totalWavesCompleted.toString()} />
        <MetricCard label="MAX CORE SCORE" value={SaveManager.getHighScore().toLocaleString()} />
        <MetricCard label="TACTICAL RUNTIME" value={`${(stats.totalPlayTime / 60).toFixed(1)} mins`} />
      </div>

      <button
        onClick={() => { void onExportSheets(); }}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
      >
        {loading ? 'DRAFTING LEDGER LOGS...' : 'Export Metrics spreadsheet'}
      </button>
      <p className="text-[9px] text-zinc-500 font-mono text-center">Writes rows into spreadsheet &apos;BUGSMASHER Combat Log &amp; Metrics&apos; with exact timestamps.</p>
    </div>
  );
}
