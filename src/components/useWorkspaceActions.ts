import { useState, useEffect } from 'react';
import { soundManager } from '../game/SoundManager';
import { SaveManager } from '../game/SaveManager';
import { getTodaysChallenge } from '../game/DailyChallengeManager';
import { statsManager } from '../game/StatsManager';

export function useWorkspaceActions(accessToken: string | null) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({
    tasks: 'PENDING SYNC',
    sheets: 'STATS AVAILABLE',
    calendar: 'ALERTS READY',
    docs: 'DEBRIEFS PENDING'
  });

  const challenge = getTodaysChallenge();
  const stats = statsManager.getStats();

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
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', 'application/json');
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

  return {
    loading,
    feedback,
    syncStatus,
    challenge,
    stats,
    handleSyncTasks,
    handleExportSheets,
    handleScheduleCalendar,
    handleCompileDoc,
  };
}
