import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Bug, Shield, Award, TrendingUp, Mail, UploadCloud, DownloadCloud,
  CheckCircle, RefreshCw, AlertTriangle, FileSpreadsheet, Lock, Database,
} from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { useAuth } from '../contexts/AuthContext';
import { statsManager } from '../game/StatsManager';
import { SaveManager } from '../game/SaveManager';
import {
  fetchPerformanceHistory,
  pushPerformanceRow,
  sendGmailReport,
  exportSaveToGoogleDrive,
  importSaveFromGoogleDrive,
  HistoricalDataPoint,
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
  Legend,
} from 'recharts';

export default function IntelDashboard() {
  // Google Workspace States
  const { user, accessToken, signIn } = useAuth();
  const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [gmailStatus, setGmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [backupStatus, setBackupStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // REAL system diagnostics — replaces the fake clinical slot-machine telemetry
  const [telemetry, setTelemetry] = useState({
    fps: 0,
    frameTime: 0,
    jsHeapMb: 0,
    audioOsc: 0,
    audioThrottled: 0,
    audioBudget: 0,
  });

  useEffect(() => {
    let rafId = 0;
    let lastFrame = performance.now();
    const frames: number[] = [];

    const tick = (now: number) => {
      const frameTime = now - lastFrame;
      lastFrame = now;
      frames.push(frameTime);
      if (frames.length > 30) frames.shift();

      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      const audio = soundManager.getAudioStats();
      setTelemetry({
        fps: Math.round(1000 / Math.max(1, avg)),
        frameTime: Math.round(avg * 10) / 10,
        jsHeapMb: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0,
        audioOsc: audio.oscillatorsSpawned,
        audioThrottled: audio.throttledEvents,
        audioBudget: audio.budgetPerWindow,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); };
  }, []);

  const stats = statsManager.getStats();

  // Load Spreadsheet performance points on opening dashboard
  useEffect(() => {
    if (accessToken) {
      void loadChartData();
    }
  }, [accessToken]);

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
            {/* Left: REAL System Diagnostics Readout */}
            <div className="lg:col-span-2 bg-[#05070a]/45 p-6 rounded-2xl border border-cyan-500/20 shadow-xl flex flex-col justify-between font-mono space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">SYSTEM_DIAGNOSTICS</span>
                  </div>
                  <span className="text-[9px] text-[#22c55e] bg-emerald-950/20 border border-emerald-500/25 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">LIVE_FEED</span>
                </div>

                {/* Real Telemetry Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">Frame Rate</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">{telemetry.fps} FPS</span>
                      <span className={`text-[8px] uppercase tracking-widest ${telemetry.fps >= 55 ? 'text-emerald-400' : telemetry.fps >= 30 ? 'text-amber-400' : 'text-red-400 animate-pulse'}`}>
                        {telemetry.fps >= 55 ? '[SMOOTH]' : telemetry.fps >= 30 ? '[STABLE]' : '[DROPPING]'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">Frame Time</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">{telemetry.frameTime} ms</span>
                      <span className="text-[8px] text-cyan-500/60 uppercase tracking-widest">[LIVE]</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/10 border border-amber-500/10 rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">JS Heap Used</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">{telemetry.jsHeapMb} MB</span>
                      <span className="text-[8px] text-amber-400 uppercase tracking-widest">[MEM]</span>
                    </div>
                    <div className="w-full bg-amber-950/40 rounded-full h-1 overflow-hidden relative mt-1.5">
                      <div
                        className="bg-amber-500 h-full shadow-[0_0_6px_rgba(245,158,11,0.7)] transition-all duration-500"
                        style={{ width: `${Math.min(100, (telemetry.jsHeapMb / 256) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">Audio Pipeline Load</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-black ${telemetry.audioThrottled > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {telemetry.audioOsc} OSC / {telemetry.audioThrottled} DROPPED
                      </span>
                      <span className="text-zinc-600">BUDGET {telemetry.audioBudget}/WINDOW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real session stats stream */}
              <div className="bg-black/60 border border-cyan-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center py-6 min-h-[90px]">
                <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-2 font-black">VENTING SESSION LOG</span>
                <div className="grid grid-cols-3 gap-4 text-xs text-cyan-300 font-extrabold tracking-wider w-full max-w-md">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{(stats.totalBugsKilled || 0).toLocaleString()}</span>
                    <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-1">BIOMASS RELEASED</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{stats.totalWavesCompleted || 0}</span>
                    <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-1">WAVES SURVIVED</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{stats.bossesKilled || 0}</span>
                    <span className="text-[7px] text-zinc-500 uppercase tracking-widest mt-1">OVERSEERS EXCISED</span>
                  </div>
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
                onClick={() => { soundManager.uiClick(); void signIn(); }}
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
                onClick={() => { soundManager.uiClick(); void loadChartData(); }}
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
                  onClick={() => { soundManager.uiClick(); void loadChartData(); }}
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
                  We haven&apos;t found any logged combat sessions in your Google Sheets. Create or append custom records to initialize telemetry mapping!
                </p>                            <button
                  onClick={() => { soundManager.uiClick(); void handleTriggerSheetsAppend(); }}
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
                  <span>Interactive charts drawn dynamically from &apos;BUGSMASHER Combat Log &amp; Metrics&apos; sheet</span>
                  <button
                    onClick={() => { soundManager.uiClick(); void handleTriggerSheetsAppend(); }}
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
                  onClick={() => { void handleBackupDrive(); }}
                  className="flex-1 py-2.5 bg-cyan-950/45 hover:bg-cyan-500/15 border border-cyan-500/45 text-cyan-400 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  disabled={isActionLoading}
                >
                  <UploadCloud size={14} /> Back-up to Drive
                </button>
                <button
                  onClick={() => { void handleRestoreDrive(); }}
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
                <label htmlFor="recipient-email" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold text-cyan-500">Recipient Dispatch Email</label>
                <input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); }}
                  className="w-full bg-[#030508] border border-cyan-500/20 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="Enter recipient email..."
                />
              </div>

              <button
                onClick={() => { void handleSendGmailReport(); }}
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
  );
}
