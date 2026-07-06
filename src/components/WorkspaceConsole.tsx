import { useState, useEffect } from 'react';
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
  Zap, 
  Database,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { getTodaysChallenge } from '../game/DailyChallengeManager';
import { StatsManager } from '../game/StatsManager';

interface WorkspaceConsoleProps {
  onClose: () => void;
}

export function WorkspaceConsole({ onClose }: WorkspaceConsoleProps) {
  const { user, signIn, logOut, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'sheets' | 'calendar' | 'docs'>('tasks');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({
    tasks: 'PENDING SYNC',
    sheets: 'STATS AVAILABLE',
    calendar: 'ALERTS READY',
    docs: 'DEBRIEFS PENDING'
  });

  const challenge = getTodaysChallenge();
  const stats = StatsManager.getStats();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => { setFeedback(null); }, 10000);
      return () => { clearTimeout(timer); };
    }
    return;
  }, [feedback]);

  // General Fetch Client for Google APIs
  const apiCall = async (url: string, options: RequestInit = {}) => {
    if (!accessToken) {
      throw new Error('Federated connection expired. Please login again.');
    }
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json().catch(() => ({}));
  };

  // 1. sync daily directives with Google Tasks
  const handleSyncTasks = async () => {
    soundManager.uiClick();
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      // Step A: Fetch or create 'BUGSMASHER Operative Tasks' list
      const listsRes = await apiCall('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
      let targetList = (listsRes.items || []).find((l: any) => l.title === 'BUGSMASHER Operative Tasks');
      
      if (!targetList) {
        targetList = await apiCall('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
          method: 'POST',
          body: JSON.stringify({ title: 'BUGSMASHER Operative Tasks' })
        });
      }

      // Step B: Fetch existing tasks on this list to prevent duplicate entries
      const existingTasksRes = await apiCall(`https://tasks.googleapis.com/tasks/v1/lists/${targetList.id}/tasks`);
      const existingTitles = (existingTasksRes.items || []).map((t: any) => t.title);

      // Create new sub-tasks
      const taskDirectives = [
        `Main Mission: ${challenge.winCondition.label}`,
        ...challenge.modifiers.map(m => `Active Modifier Hazard: Handle extreme ${m.replace('_', ' ')} settings`)
      ];

      let createdCount = 0;
      for (const taskText of taskDirectives) {
        if (!existingTitles.includes(taskText)) {
          await apiCall(`https://tasks.googleapis.com/tasks/v1/lists/${targetList.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify({
              title: taskText,
              notes: `Task scheduled via BUGSMASHER Tactical Hub on ${new Date().toLocaleDateString()}. Complete today's mission to claim secure operational rewards!`
            })
          });
          createdCount++;
        }
      }

      soundManager.skillUpgrade();
      setSyncStatus(prev => ({ ...prev, tasks: 'SYNCHRONIZED' }));
      setFeedback({
        type: 'success',
        message: createdCount > 0 
          ? `Successfully synchronized ${createdCount} daily objectives to Google Tasks under 'BUGSMASHER Operative Tasks'!` 
          : "All active daily objectives are already entered in your Google Tasks calendar feed!",
        link: 'https://tasks.google.com'
      });
    } catch (err: any) {
      console.error(err);
      soundManager.uiError();
      setFeedback({ type: 'error', message: err.message || 'Failed to synchronize with Google Tasks.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. export stats to Google Sheets
  const handleExportSheets = async () => {
    soundManager.uiClick();
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      // Step A: Find existing spreadsheet called "BUGSMASHER Combat Log & Metrics"
      const queryStr = encodeURIComponent("name = 'BUGSMASHER Combat Log & Metrics' and mimeType = 'application/vnd.google-apps.spreadsheet'");
      const driveSearch = await apiCall(`https://www.googleapis.com/drive/v3/files?q=${queryStr}`);
      
      let spreadsheetId = '';
      let isNew = false;

      if (driveSearch.files && driveSearch.files.length > 0) {
        spreadsheetId = driveSearch.files[0].id;
      } else {
        // Step B: Create a brand new Spreadsheet
        isNew = true;
        const createSheet = await apiCall('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          body: JSON.stringify({
            properties: { title: 'BUGSMASHER Combat Log & Metrics' },
            sheets: [
              {
                properties: { title: 'Combat Logs' },
                data: [
                  {
                    startRow: 0,
                    startColumn: 0,
                    rowData: [
                      {
                        values: [
                          { userEnteredValue: { stringValue: 'Timestamp' } },
                          { userEnteredValue: { stringValue: 'Anomalies Purged (Kills)' } },
                          { userEnteredValue: { stringValue: 'Waves Survived' } },
                          { userEnteredValue: { stringValue: 'Aggregate Core Score' } },
                          { userEnteredValue: { stringValue: 'Tactical Runtime (Minutes)' } },
                          { userEnteredValue: { stringValue: 'Overseers Neutralized (Bosses)' } },
                          { userEnteredValue: { stringValue: 'Cores Harvested (Powerups)' } }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          })
        });
        spreadsheetId = createSheet.spreadsheetId;
      }

      // Step C: Append latest operative performance row
      const runtimeMinutes = (stats.totalPlayTime / 60).toFixed(1);
      const rowValues = [
        new Date().toLocaleString(),
        stats.totalBugsKilled,
        stats.totalWavesCompleted,
        stats.totalScore,
        parseFloat(runtimeMinutes),
        stats.bossesKilled,
        stats.totalPowerupsCollected
      ];

      await apiCall(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Combat Logs!A:G:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        body: JSON.stringify({
          values: [rowValues]
        })
      });

      soundManager.skillUpgrade();
      setSyncStatus(prev => ({ ...prev, sheets: 'EXPORTED' }));
      setFeedback({
        type: 'success',
        message: isNew 
          ? 'Created a new spreadsheet "BUGSMASHER Combat Log & Metrics" and uploaded initial combat metrics logs!' 
          : 'Appended your latest gameplay metrics successfully! Tactical records updated.',
        link: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      });
    } catch (err: any) {
      console.error(err);
      soundManager.uiError();
      setFeedback({ type: 'error', message: err.message || 'Failed write to sheets.' });
    } finally {
      setLoading(false);
    }
  };

  // 3. schedule daily alert in Google Calendar
  const handleScheduleCalendar = async (type: 'daily' | 'boss') => {
    soundManager.uiClick();
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      const now = new Date();
      let eventBody = {};

      if (type === 'daily') {
        // Daily recurring alert event
        const start = new Date(now);
        start.setHours(18, 0, 0, 0); // 6:00 PM alert
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30); // 30 mins duration

        eventBody = {
          summary: 'BUGSMASHER: Daily Mission Update Alert',
          description: `Assemble at the Core! Stand against the local bug swarm, clear procedural anomalies, and earn custom visual skins. 🐛✨`,
          start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          recurrence: ['RRULE:FREQ=DAILY'],
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] }
        };
      } else {
        // Limited-time custom boss surge weekend event
        const start = new Date(now);
        start.setDate(start.getDate() + ((5 - start.getDay() + 7) % 7)); // Next Saturday surge
        start.setHours(12, 0, 0, 0);
        const end = new Date(start);
        end.setHours(start.getHours() + 4);

        eventBody = {
          summary: '🚨 BUGSMASHER: Swarm Influx Raid Surge Event 🚨',
          description: `Elite Boss Rush raid surge window. Core drop rates are boosted by up to 200%. Load your armory configurations and secure defensive coordinates!`,
          start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] }
        };
      }

      await apiCall('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(eventBody)
      });

      soundManager.skillUpgrade();
      setSyncStatus(prev => ({ ...prev, calendar: 'ALERTS ACTIVE' }));
      setFeedback({
        type: 'success',
        message: type === 'daily' 
          ? 'Synchronized Daily Recurring Alarm Event to your Calendar!' 
          : 'Scheduled Elite Weekly Raid Surge Event! Ready for tactical engagement alerts.',
        link: 'https://calendar.google.com'
      });
    } catch (err: any) {
      console.error(err);
      soundManager.uiError();
      setFeedback({ type: 'error', message: err.message || 'Failed update on Calendar.' });
    } finally {
      setLoading(false);
    }
  };

  // 4. compile war journal log in Google Docs
  const handleCompileDoc = async () => {
    soundManager.uiClick();
    if (!accessToken) return;
    setLoading(true);
    setFeedback(null);
    try {
      // mapConfig was unused
      // const _mapConfig = SaveManager.getHighScore() > 0 ? "ADVANCED CORE" : "RECRUIT SIMULATOR";
      const docTitle = `BUGSMASHER Tactical Debrief - Operative Report`;

      // Step A: Create Document
      const createDoc = await apiCall('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        body: JSON.stringify({ title: docTitle })
      });
      const docId = createDoc.documentId;

      // Step B: Write formatted structural briefing text
      const contentText = 
        `BUGSMASHER SECURITY FIELD OPERATIONS REPORT\n` +
        `===================================================\n` +
        `OPERATIVE LOG ID: SEC-OPS-${Math.floor(Math.random() * 90000 + 10000)}\n` +
        `TIMESTAMP GENERATED: ${new Date().toLocaleString()}\n\n` +
        `CORE SUMMARY STATISTICS:\n` +
        `- TOTAL PURGED ANOMALIES: ${stats.totalBugsKilled.toLocaleString()} targets\n` +
        `- MAXIMUM WAVE SEGMENT COMPLETED: Wave ${stats.totalWavesCompleted}\n` +
        `- TOP SCORE DEPLOYED: ${SaveManager.getHighScore().toLocaleString()} pts\n` +
        `- POWERUPS INTEGRATED: ${stats.totalPowerupsCollected} module increments\n` +
        `- TOTAL ENGAGEMENT DURATION: ${(stats.totalPlayTime / 60).toFixed(1)} strategic minutes\n\n` +
        `TACTICAL INTELLIGENCE BRIEFING:\n` +
        `1. Stand behind the energy core shielding layout and utilize custom skins for optimized gun calibration indicators.\n` +
        `2. Maintain continuous dash velocity (Spacebar) when swarmer bugs split.\n` +
        `3. Leverage the procedurally generated tactical forge settings to test varying difficulty modifiers.\n\n` +
        `--- END OF TRANSMISSION [GRID ONLINE] ---`;

      // Document write batch update
      await apiCall(`https://www.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: contentText
              }
            }
          ]
        })
      });

      soundManager.skillUpgrade();
      setSyncStatus(prev => ({ ...prev, docs: 'JOURNAL DEPLOYED' }));
      setFeedback({
        type: 'success',
        message: 'Successfully generated high-fidelity Tactical Mission Debrief Document inside your Google Drive folder!',
        link: `https://docs.google.com/document/d/${docId}`
      });
    } catch (err: any) {
      console.error(err);
      soundManager.uiError();
      setFeedback({ type: 'error', message: err.message || 'Failed generation Google Docs.' });
    } finally {
      setLoading(false);
    }
  };

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
                  onClick={() => { soundManager.uiClick(); signIn(); }}
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
                onClick={() => { soundManager.uiClick(); logOut(); }}
                className="w-full sm:w-auto px-3 py-1.5 border border-zinc-800 text-zinc-500 hover:text-white rounded-lg text-[9px] font-mono tracking-widest uppercase transition-all"
              >
                Terminate
              </button>
            </div>
          ) : (
            <button
              onClick={() => { soundManager.uiClick(); signIn(); }}
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
                      onClick={handleSyncTasks}
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'SYNCHRONIZING DIGITAL ASSETS...' : 'Sync to Google Tasks'}
                    </button>
                    <p className="text-[9px] text-zinc-500 font-mono text-center">Creates & updates a designated 'BUGSMASHER Operative Tasks' list in your Tasks feed.</p>
                  </div>
                )}

                {/* 2. GOOGLE SHEETS STAT BOOK */}
                {activeTab === 'sheets' && (
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
                      onClick={handleExportSheets}
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'DRAFTING LEDGER LOGS...' : 'Export Metrics spreadsheet'}
                    </button>
                    <p className="text-[9px] text-zinc-500 font-mono text-center">Writes rows into spreadsheet 'BUGSMASHER Combat Log & Metrics' with exact timestamps.</p>
                  </div>
                )}

                {/* 3. GOOGLE CALENDAR SCHEDULER */}
                {activeTab === 'calendar' && (
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
                          onClick={() => handleScheduleCalendar('daily')}
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
                          onClick={() => handleScheduleCalendar('boss')}
                          disabled={loading}
                          className="py-2.5 bg-red-500/10 border border-red-500/35 text-red-300 hover:bg-red-500 hover:text-white font-mono font-bold text-[9px] uppercase rounded-xl transition-all"
                        >
                          Trigger Weekend Surge event
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. GOOGLE DOCS MISSION DEBRIEFS */}
                {activeTab === 'docs' && (
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
                      onClick={handleCompileDoc}
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'TRANSMITTING BRIEFING DATA...' : 'Generate Official google doc War Log'}
                    </button>
                    <p className="text-[9px] text-zinc-500 font-mono text-center">Saves document to your primary Drive folder, complete with combat diagnostics.</p>
                  </div>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#030508]/60 border border-white/5 rounded-xl">
      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">{label}</span>
      <span className="text-sm font-black text-white font-mono mt-0.5 block">{value}</span>
    </div>
  );
}
