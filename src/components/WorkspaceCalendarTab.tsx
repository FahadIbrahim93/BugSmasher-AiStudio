import { Calendar as CalendarIcon } from 'lucide-react';

interface WorkspaceCalendarTabProps {
  loading: boolean;
  onScheduleCalendar: (type: 'daily' | 'boss') => Promise<void>;
}

export function WorkspaceCalendarTab({ loading, onScheduleCalendar }: WorkspaceCalendarTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3 pb-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <CalendarIcon size={14} />
        </div>
        <div className="space-y-0.5 text-left font-mono">
          <h4 className="text-xs font-black text-white uppercase">Operational Calendar Alert Service</h4>
          <p className="text-[9px] text-zinc-500 font-medium">Add directive alarms and weekly squad challenges directly to your schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sub card 1: Daily Alerts */}
        <div className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl text-left flex flex-col justify-between">
          <div className="space-y-1.5 mb-4">
            <span className="text-[8px] font-mono text-amber-400 font-black tracking-widest">PROPAGATION PROTOCOL</span>
            <h4 className="text-[11px] font-black text-white uppercase">Daily Alert Reminder</h4>
            <p className="text-[9px] text-zinc-500 font-mono">Set a daily 6:00 PM alarm containing specific combat tips to secure objectives.</p>
          </div>
          <button
            onClick={() => { void onScheduleCalendar('daily'); }}
            disabled={loading}
            className="py-2.5 bg-amber-500/15 border border-amber-400/40 text-amber-300 hover:bg-amber-500 hover:text-black font-mono font-bold text-[9px] uppercase rounded-xl transition-all"
          >
            Schedule Daily Alerts
          </button>
        </div>

        {/* Sub card 2: Elite Surge Event */}
        <div className="p-4 bg-zinc-950/70 border border-white/5 rounded-2xl text-left flex flex-col justify-between">
          <div className="space-y-1.5 mb-4">
            <span className="text-[8px] font-mono text-red-400 font-black tracking-widest">CO-OP BATTLE WINDOW</span>
            <h4 className="text-[11px] font-black text-white uppercase">Weekend Raid Challenge</h4>
            <p className="text-[9px] text-zinc-500 font-mono">Adds Saturday surge alerts representing 2x core extraction windows on Boss Rush modes.</p>
          </div>
          <button
            onClick={() => { void onScheduleCalendar('boss'); }}
            disabled={loading}
            className="py-2.5 bg-red-500/10 border border-red-500/35 text-red-300 hover:bg-red-500 hover:text-white font-mono font-bold text-[9px] uppercase rounded-xl transition-all"
          >
            Trigger Weekend Surge event
          </button>
        </div>

      </div>
    </div>
  );
}
