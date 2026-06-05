import { UserStats } from '../game/StatsManager';

// Helper for Google API Requests
async function apiCall(accessToken: string, url: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Google API error: Status ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

// 1. Google Sheets helper - get or create
export async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  const queryStr = encodeURIComponent("name = 'BUGSMASHER Combat Log & Metrics' and mimeType = 'application/vnd.google-apps.spreadsheet'");
  const driveSearch = await apiCall(accessToken, `https://www.googleapis.com/drive/v3/files?q=${queryStr}`);
  
  if (driveSearch.files && driveSearch.files.length > 0) {
    return driveSearch.files[0].id;
  }

  // Create formatted spreadsheet
  const createSheet = await apiCall(accessToken, 'https://sheets.googleapis.com/v4/spreadsheets', {
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
  return createSheet.spreadsheetId;
}

// 2. Google Sheets - Push a performance record in real-time
export async function pushPerformanceRow(accessToken: string, stats: UserStats) {
  try {
    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
    const runtimeMinutes = ((stats.totalPlayTime || 0) / 60).toFixed(1);
    const rowValues = [
      new Date().toLocaleString(),
      stats.totalBugsKilled || 0,
      stats.totalWavesCompleted || 0,
      stats.totalScore || 0,
      parseFloat(runtimeMinutes),
      stats.bossesKilled || 0,
      stats.totalPowerupsCollected || 0
    ];

    await apiCall(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Combat Logs!A:G:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues]
      })
    });
    console.log('Real-time spreadsheet update successful.');
    return spreadsheetId;
  } catch (err) {
    console.warn('Failed to push performance row in real-time:', err);
    throw err;
  }
}

// 3. Google Sheets - Fetch performance history for Recharts Graph
export interface HistoricalDataPoint {
  index: number;
  date: string;
  kills: number;
  wave: number;
  score: number;
  duration: number;
  bosses: number;
  powerups: number;
}

export async function fetchPerformanceHistory(accessToken: string): Promise<HistoricalDataPoint[]> {
  try {
    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
    const valuesRes = await apiCall(accessToken, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Combat Logs!A:G`);
    
    const rows = valuesRes.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    // Skip header row
    const dataPoints: HistoricalDataPoint[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rawDate = row[0] || '';
      // Format date to a highly clean human readable format (e.g. "Jun 5, 10:15")
      let cleanDate = rawDate;
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          cleanDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      } catch {
        // Fallback
      }

      dataPoints.push({
        index: i,
        date: cleanDate,
        kills: parseInt(row[1]) || 0,
        wave: parseInt(row[2]) || 0,
        score: parseInt(row[3]) || 0,
        duration: parseFloat(row[4]) || 0,
        bosses: parseInt(row[5]) || 0,
        powerups: parseInt(row[6]) || 0
      });
    }

    return dataPoints;
  } catch (err) {
    console.warn('Failed to load performance history from sheets:', err);
    throw err;
  }
}

// 4. Gmail API - Send formatted combat analysis reports
function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailReport(accessToken: string, recipientEmail: string, stats: UserStats, highscore: number) {
  try {
    const subject = `🚨 BUGSMASHER: Weekly Combat Analysis & High-Score Briefing 🚨`;
    
    // Evaluate operational rank based on total score & kills
    let opRank = 'Recruit Analyst';
    if (stats.totalBugsKilled > 1000) opRank = 'Grand Overseer Purger';
    else if (stats.totalBugsKilled > 500) opRank = 'Titan Squad Commando';
    else if (stats.totalBugsKilled > 100) opRank = 'Veteran Decimator';

    const runtimeMinutes = ((stats.totalPlayTime || 0) / 60).toFixed(1);

    const reportHtml = `
      <div style="font-family: 'Courier New', monospace; background-color: #030508; color: #22d3ee; padding: 30px; border: 2px solid #22d3ee; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #22d3ee; border-bottom: 2px solid #22d3ee; padding-bottom: 15px; margin-top: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 2px;">
          NEXUS HIGH COMMAND REPORT
        </h1>
        <p style="color: #8ec3db; font-size: 11px; margin-bottom: 25px; text-transform: uppercase;">
          OPERATIONAL VECTOR DEBRIEF // LEVEL SECURITY: CLASSIFIED // RECIPIENT: ${recipientEmail}
        </p>
        
        <div style="background-color: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.2); padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #ffffff; font-size: 16px; margin-top: 0; text-transform: uppercase;">OPERATIVE SUMMONS</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase; width: 50%;">Operative Rank:</td>
              <td style="padding: 6px 0; color: #ffd700; font-weight: bold; text-transform: uppercase;">${opRank}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase;">High Score Record:</td>
              <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${highscore.toLocaleString()} PTS</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase;">Total Swarm Neutralized:</td>
              <td style="padding: 6px 0; color: #22d3ee; font-weight: bold;">${(stats.totalBugsKilled || 0).toLocaleString()} BUGS</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase;">Sector Wave Segment:</td>
              <td style="padding: 6px 0; color: #ffffff;">Wave ${stats.totalWavesCompleted || 0}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase;">Active Combat Time:</td>
              <td style="padding: 6px 0; color: #ffffff;">${runtimeMinutes} Active Minutes</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; text-transform: uppercase;">Apex Threat Kills:</td>
              <td style="padding: 6px 0; color: #ef4444; font-weight: bold;">${stats.bossesKilled || 0} Overlords</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 25px; line-height: 1.6; font-size: 13px; color: #cbd5e1;">
          <h3 style="color: #22d3ee; text-transform: uppercase; font-size: 14px; border-left: 3px solid #22d3ee; padding-left: 10px; margin-bottom: 12px;">TACTICAL RESPONSE DIAGNOSTICS</h3>
          <p style="margin: 0 0 10px 0;">
            Excellent defensive work! Swarm engagement logs confirm an outstanding accuracy and defensive maneuvering. Your optimal build specializes in securing nanotech upgrades early in the run.
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #94a3b8;">
            <li style="margin-bottom: 5px;"><strong>Kinetic Amp Synergy</strong>: Collecting multi-point power-up cores is critical for shredding swarmers.</li>
            <li style="margin-bottom: 5px;"><strong>Boss Maneuverability</strong>: Shift into high-velocity dash modes when Class-V Apex bosses target the energy core.</li>
            <li style="margin-bottom: 5px;"><strong>Directive Alignments</strong>: Continue synchronizing tasks through the Tactical Portal to claim local elite visual rewards.</li>
          </ul>
        </div>

        <div style="border-top: 1px solid rgba(6, 182, 212, 0.2); padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; text-transform: uppercase;">
          BUGSMASHER SECURE OPS // PRODUCED VIA COGNITIVE INTEL HUB // END TRANSMISSION // GRID GREEN
        </div>
      </div>
    `;

    const emailParts = [
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      reportHtml
    ];

    const emailStr = emailParts.join('\r\n');
    const rawBase64 = base64UrlEncode(emailStr);

    const gmailRes = await apiCall(accessToken, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: rawBase64
      })
    });

    console.log('Gmail report sent successfully:', gmailRes);
    return gmailRes;
  } catch (err) {
    console.warn('Failed to send mail through Gmail API:', err);
    throw err;
  }
}

// 5. Google Drive API - Backup current game save directly to Drive
export async function exportSaveToGoogleDrive(accessToken: string, saveDataStateStr: string): Promise<string> {
  try {
    // Step A: Search for existing file named bugsmasher_backup.json
    const query = encodeURIComponent("name = 'bugsmasher_backup.json' and trashed = false");
    const searchRes = await apiCall(accessToken, `https://www.googleapis.com/drive/v3/files?q=${query}`);
    
    let fileId = '';
    if (searchRes.files && searchRes.files.length > 0) {
      fileId = searchRes.files[0].id;
    } else {
      // Create new file metadata
      const createRes = await apiCall(accessToken, 'https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'bugsmasher_backup.json',
          mimeType: 'application/json'
        })
      });
      fileId = createRes.id;
    }

    // Step B: Upload actual game save content to the file using media content pipeline
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: saveDataStateStr
    }).then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `Failed content upload. Status: ${res.status}`);
      }
    });

    console.log('Google Drive Backup written successfully. File ID:', fileId);
    return fileId;
  } catch (err) {
    console.warn('Google Drive export failed:', err);
    throw err;
  }
}

// 6. Google Drive API - Recover/Restore save data backup from Drive
export async function importSaveFromGoogleDrive(accessToken: string): Promise<string> {
  try {
    const query = encodeURIComponent("name = 'bugsmasher_backup.json' and trashed = false");
    const searchRes = await apiCall(accessToken, `https://www.googleapis.com/drive/v3/files?q=${query}`);
    
    if (!searchRes.files || searchRes.files.length === 0) {
      throw new Error(`Operational backup 'bugsmasher_backup.json' not found on your Google Drive.`);
    }

    const fileId = searchRes.files[0].id;
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!downloadRes.ok) {
      const errBody = await downloadRes.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Failed to download file alt=media. Status: ${downloadRes.status}`);
    }

    const saveText = await downloadRes.text();
    console.log('Backup pulled successfully from Google Drive.');
    return saveText;
  } catch (err) {
    console.warn('Google Drive restoration failed:', err);
    throw err;
  }
}
