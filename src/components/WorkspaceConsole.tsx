import { useState } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  FileText,
  ClipboardList,
  ShieldAlert,
  RefreshCw,
  UserPlus,
  Database,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { soundManager } from '../game/SoundManager';
import { useWorkspaceActions } from './useWorkspaceActions';
import { WorkspaceTasksTab } from './WorkspaceTasksTab';
import { WorkspaceSheetsTab } from './WorkspaceSheetsTab';
import { WorkspaceCalendarTab } from './WorkspaceCalendarTab';
import { WorkspaceDocsTab } from './WorkspaceDocsTab';

interface WorkspaceConsoleProps {
  onClose: () => void;
}

export function WorkspaceConsole({ onClose }: WorkspaceConsoleProps) {
  const { user, signIn, logOut, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'sheets' | 'calendar' | 'docs'>('tasks');
  const {
    loading,
    feedback,
    syncStatus,
    challenge,
    stats,
    handleSyncTasks,
    handleExportSheets,
    handleScheduleCalendar,
    handleCompileDoc,
  } = useWorkspaceActions(accessToken);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-[#06080d] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
      >
        {/* Header ribbon */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-cyan-500/15 bg-cyan-950/20">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400 font-mono">
                Federated Tactical Sync Portal
              </h2>
              <p className="text-[9px] text-cyan-400/50 uppercase tracking-widest mt-0.5 font-mono">
                Workspace API Orchestrator // Operational Grid Linkage
              </p>
            </div>
          </div>
          <button
            onClick={() => { soundManager.uiClick(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Banner */}
        <div className="p-4 bg-zinc-950/80 border-b border-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {user ? (
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <img
                  src={user.photoURL || "/src/assets/images/placeholder_avatar.png"}
                  alt="Avatar"
                  className="w-9 h-9 rounded-lg border border-cyan-500/30 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black animate-pulse" />
              </div>
              <div className="text-left font-mono leading-none">
                <p className="text-[10px] text-cyan-400/60 uppercase font-black tracking-widest">TRANSMITTING SECURE LINK</p>
                <p className="text-xs font-black text-white mt-1 uppercase max-w-[200px] truncate">{user.displayName || 'OPERATIVE'}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-left">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              <div className="font-mono leading-none">
                <p className="text-[10px] text-yellow-500/70 uppercase font-black">Authentication offline</p>
                <p className="text-[9px] text-zinc-500 mt-1 uppercase">Link Workspace apps to access stats syncing and alerts.</p>
              </div>
            </div>
          )}

          {user ? (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {!accessToken ? (
                <button
                  onClick={() => { soundManager.uiClick(); void signIn(); }}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-mono font-bold text-[10px] uppercase rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Re-auth Link</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-cyan-950/30 border border-cyan-400/35 text-cyan-400 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase flex items-center space-x-1">
                  <Database className="w-3 h-3 animate-pulse" />
                  <span>TRANSMISSION ACTIVE</span>
                </span>
              )}
              <button
                onClick={() => { soundManager.uiClick(); void logOut(); }}
                className="w-full sm:w-auto px-3 py-1.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-lg text-[9px] font-mono tracking-widest uppercase transition-all"
              >
                Terminate
              </button>
            </div>
          ) : (
            <button
              onClick={() => { soundManager.uiClick(); void signIn(); }}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-950/20 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4 fill-black" />
              <span>Connect Google Account</span>
            </button>
          )}
        </div>

        {/* Console tab selectors */}
        <div className="flex bg-[#030508] border-b border-cyan-500/10 p-2 gap-1.5">
          <TabBtn active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); }} icon={<ClipboardList size={14} />} label="TASKS" status={syncStatus.tasks} />
          <TabBtn active={activeTab === 'sheets'} onClick={() => { setActiveTab('sheets'); }} icon={<FileSpreadsheet size={14} />} label="STAT BOOK" status={syncStatus.sheets} />
          <TabBtn active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); }} icon={<CalendarIcon size={14} />} label="SCHEDULER" status={syncStatus.calendar} />
          <TabBtn active={activeTab === 'docs'} onClick={() => { setActiveTab('docs'); }} icon={<FileText size={14} />} label="WAR LOGS" status={syncStatus.docs} />
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300 custom-scrollbar relative">

          {/* Action indicator notifications */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />
                  <span>{feedback.message}</span>
                </div>
                {feedback.link && (
                  <a
                    href={feedback.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] text-white transition-all w-full sm:w-auto justify-center"
                  >
                    <span>Inspect</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!accessToken && (
            <div className="p-8 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-center space-y-4">
              <ShieldAlert className="w-8 h-8 text-yellow-500 mx-auto opacity-70 animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-xs uppercase tracking-widest text-white font-mono font-black">Sync Authorization Required</h4>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Your Google identity credential is safe and remains strictly managed. Link your account above to synchronize combat intelligence.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {accessToken && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* 1. GOOGLE TASKS SYNC */}
                {activeTab === 'tasks' && (
                  <WorkspaceTasksTab challenge={challenge} loading={loading} onSyncTasks={handleSyncTasks} />
                )}

                {/* 2. GOOGLE SHEETS STAT BOOK */}
                {activeTab === 'sheets' && (
                  <WorkspaceSheetsTab stats={stats} loading={loading} onExportSheets={handleExportSheets} />
                )}

                {/* 3. GOOGLE CALENDAR SCHEDULER */}
                {activeTab === 'calendar' && (
                  <WorkspaceCalendarTab loading={loading} onScheduleCalendar={handleScheduleCalendar} />
                )}

                {/* 4. GOOGLE DOCS MISSION DEBRIEFS */}
                {activeTab === 'docs' && (
                  <WorkspaceDocsTab loading={loading} onCompileDoc={handleCompileDoc} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Info footer banner */}
        <div className="p-4 bg-[#030508] border-t border-cyan-500/10 text-[9px] text-zinc-500 font-mono flex items-center gap-2">
          <Info size={12} className="text-cyan-400 shrink-0" />
          <span>Sync transmissions use strict direct end-to-end sandbox operations without remote developer proxy logging.</span>
        </div>
      </motion.div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
  status
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  status?: string;
}) {
  return (
    <button
      onClick={() => { soundManager.uiHover(); onClick(); }}
      className={`flex-1 p-2.5 rounded-xl border font-mono text-[9px] font-bold text-center flex flex-col items-center justify-center gap-1 transition-all ${
        active
          ? 'bg-cyan-500/10 text-white border-cyan-500/40'
          : 'bg-white/[0.01] border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <div className="flex items-center space-x-1.5 uppercase font-bold tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      {status && (
        <span className={`text-[7px] font-black rounded uppercase px-1 leading-normal ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-zinc-600'}`}>
          {status}
        </span>
      )}
    </button>
  );
}
