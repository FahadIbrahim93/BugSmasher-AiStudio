# SFX Pack Contract — BugSmasher Audio Overhaul (P0)

Minimal, optional WAV asset contract consumed by `src/game/AudioAssetLoader.ts`.
Every asset is **optional**: if a file is missing or fails to decode, `SoundManager`
falls back to procedural Web Audio synthesis. No blocking loads — preloading is
fire-and-forget and failures are silent.

## Format

- Container: WAV (RIFF), 16-bit PCM, mono
- Sample rate: 22,050 Hz (matching `scripts/generate-sfx.mjs`)
- Duration: 0.02 – 2.5 s (short feedback bursts, no loops)
- Loudness target: peak ≈ **-3 dBFS**, integrated ≈ **-18 LUFS** for impacts;
  UI clicks ≈ **-12 dBFS** peak. Keep tails ~6 dB quieter than attacks.

## File inventory

| File                            | Category          | SfxId          | Trigger                           | Loudness      |
| ------------------------------- | ----------------- | -------------- | --------------------------------- | ------------- |
| `public/audio/shoot.wav`        | Attack            | `shoot`        | Click hit / auto-turret shot      | -3 dBFS peak  |
| `public/audio/splat.wav`        | Kill              | `splat`        | Bug splatter (rate-varied)        | -3 dBFS peak  |
| `public/audio/crit_hit.wav`     | Kill              | `crit_hit`     | Critical hit (`damageBug` isCrit) | -3 dBFS peak  |
| `public/audio/miss.wav`         | Negative feedback | `miss`         | Empty-space click                 | -9 dBFS peak  |
| `public/audio/combo_break.wav`  | Negative feedback | `combo_break`  | Streak expiry / base breach       | -6 dBFS peak  |
| `public/audio/powerup.wav`      | Pickup            | `powerup`      | Powerup activation                | -6 dBFS peak  |
| `public/audio/hit_base.wav`     | Damage            | `hit_base`     | Bug reaches the core              | -6 dBFS peak  |
| `public/audio/boss_warning.wav` | Alarm             | `boss_warning` | Boss telegraph                    | -3 dBFS peak  |
| `public/audio/ui_click.wav`     | UI                | `ui_click`     | Menu / upgrade click              | -12 dBFS peak |
| `public/audio/ui_hover.wav`     | UI                | `ui_hover`     | Menu hover                        | -18 dBFS peak |

## Categories

- **Attack** — shoot
- **Kill** — splat, crit_hit
- **Negative feedback** — miss, combo_break
- **Pickup** — powerup
- **Damage / Alarm** — hit_base, boss_warning
- **UI** — ui_click, ui_hover

## Rules

1. **WAV-first, synthesis-fallback.** Each `SoundManager` SFX method calls
   `audioAssets.play(id, ...)` and returns early when it plays; otherwise it
   synthesizes. Adding a WAV must never require changing game code.
2. **No new blocking I/O.** Files are pre-fetched at module import; decoding is
   deferred to first `init()`. Missing files are skipped silently.
3. **Budgeted synthesis.** The synth path caps oscillator allocation to
   `SoundManager.OSC_BUDGET_PER_WINDOW` (48) per 100 ms so dense bursts cannot
   drop frames on mid-tier mobile. Telemetry is exposed via `getAudioStats()`.
4. **A11y aware.** Master/SFX/Music/Voice volumes persist to `localStorage`
   (`bugsmasher_*`). `setReducedMotion(true)` flattens adaptive music intensity.
5. **Per-event distinctness.** Normal kill, crit, boss hit, and miss must be
   audibly distinct (different oscillators/filters, verified by tests).

## Adding an asset

1. Drop the WAV in `public/audio/`.
2. Add its `SfxId` + path in `AudioAssetLoader.ts`.
3. Add the WAV-first guard in the matching `SoundManager` method.
4. Re-run `node scripts/generate-sfx.mjs --new-only` to regenerate placeholder
   assets from the scripted synth suite.
