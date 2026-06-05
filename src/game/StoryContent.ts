// ============================================================================
// StoryContent.ts — Lore, backstory, and scene data
// All story content lives here as pure data. No game logic.
// ============================================================================

import type { SceneTrigger, StoryScene } from './GamePhase';

// ---------------------------------------------------------------------------
// ACT 1: ESTABLISHMENT — Waves 1-5
// ---------------------------------------------------------------------------

const WAVE_SCENES: SceneTrigger[] = [

  // ── WAVE 1 — The Call to Arms ─────────────────────────────────────────────
  {
    triggerId: 'wave_1',
    preTrigger: true,
    scene: {
      id: 'wave_1_intro',
      title: '[W1] INCOMING SIGNAL DETECTED',
      body: 'The Nexus-Core is fully operational.\n\nSensors indicate a swarm of Class-D insects emerging from the glitch anomaly. They are disorganized, but aggressive.\n\nNo survivors reported from Outpost Sigma. This is on you now.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 2 — First Contact ─────────────────────────────────────────────────
  {
    triggerId: 'wave_2',
    preTrigger: true,
    scene: {
      id: 'wave_2_intro',
      title: '[W2] DEEPER TRANSMISSIONS',
      body: 'Scans confirm the anomaly is expanding. New insect strains detected — faster, smarter.\n\nThe crystal resonance we detected appears to be accelerating the mutations.\n\nWhatever came through that rift, it is learning.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 3 — The Pattern Emerges ───────────────────────────────────────────
  {
    triggerId: 'wave_3',
    preTrigger: true,
    scene: {
      id: 'wave_3_intro',
      title: '[W3] MUTATION LOG CONFIRMED',
      body: 'Healer-class insects have been confirmed among the swarm. They reinforce damaged units mid-combat.\n\nPrioritize them. A single healer can extend a swarm survival by 400%.\n\nThe crystal fragments are acting as organic neural nodes.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 4 — Biome Shift ────────────────────────────────────────────────────
  {
    triggerId: 'wave_4',
    preTrigger: true,
    scene: {
      id: 'wave_4_intro',
      title: '[W4] BIOME CORRUPTION DETECTED',
      body: 'The anomaly has destabilized local spacetime. Multiple biome layers are collapsing into each other.\n\nExpect extreme temperature fluctuations. Ember and Frost-class insects are manifesting simultaneously.\n\nYour defenses were not designed for this. Adapt or die.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 5 — First Boss: Armored Beetle ────────────────────────────────────
  {
    triggerId: 'boss_armored_beetle',
    preTrigger: true,
    scene: {
      id: 'boss_1_intro',
      title: 'ANOMALY PEAK — BOSS ENTITY DETECTED',
      body: 'The convergence point has formed.\n\nOur instruments are detecting a massive organic presence at the epicenter. Crystalline armor plating. Ramming capability: catastrophic.\n\nThis is not a swarm anymore. This is a Warlord.\n\nEngage with everything you have, Commander.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      bossType: 'armored_beetle',
      autoAdvanceMs: 10000,
    },
  },
  {
    triggerId: 'boss_armored_beetle',
    preTrigger: false,
    scene: {
      id: 'boss_1_defeat',
      title: 'BOSS NEUTRALIZED — RIFT REMAINS OPEN',
      body: 'The Warlord has fallen. Crystalline remains are being absorbed back into the anomaly.\n\nBut the rift remains open.\n\nFour more signatures detected. Each one orders of magnitude more dangerous than the last.\n\nThis is only the beginning.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 6 — Aftermath ──────────────────────────────────────────────────────
  {
    triggerId: 'wave_6',
    preTrigger: false,
    scene: {
      id: 'wave_6_aftermath',
      title: '[W6] AFTERMATH — THE SCUT WORKED',
      body: 'The beetle remains are dissolving back into crystal fragments. The resonance signature is still getting stronger.\n\nCommander, I have got good news and bad news.\n\nGood news: you survived.\n\nBad news: the beetle was the scout.\n\nWe are tracking three new anomaly signatures converging on the Nexus-Core. They know what they are doing.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 7 — Signal Spike ───────────────────────────────────────────────────
  {
    triggerId: 'wave_7',
    preTrigger: true,
    scene: {
      id: 'wave_7_signal',
      title: '[W7] SIGNAL SPIKE — COORDINATED SWARM INCOMING',
      body: 'Something just activated a secondary resonance channel.\n\nThe crystal fragments are now transmitting on a frequency we do not recognize.\n\nThey are not just adapting — they are coordinating.\n\nNew threat confirmed: Coordinated Swarm Tactics. Expect flanking maneuvers, synchronized attacks, and priority targeting on your sentries.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVE 8 — The Pattern ─────────────────────────────────────────────────────
  {
    triggerId: 'wave_8',
    preTrigger: false,
    scene: {
      id: 'wave_8_pattern',
      title: '[W8] THE PATTERN — EVERY EIGHTH WAVE',
      body: 'Wave 8. Every 8th wave, the pattern repeats.\n\nI have been tracking it since wave 1. The anomaly has a heartbeat, Commander.\n\nAnd wave 8 is when it beats.\n\nThe crystal fragments are synced to a central signal. Destroy one and they all react. The swarm is not led by instinct — it is led by command.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 9 — Memory Echo ────────────────────────────────────────────────────
  {
    triggerId: 'wave_9',
    preTrigger: true,
    scene: {
      id: 'wave_9_memory',
      title: '[W9] MEMORY ECHO — VISUAL DISTORTION INCOMING',
      body: 'I am picking up electromagnetic echoes from the rift.\n\nThe crystal fragments are replaying something. A signal loop. A location marker.\n\nIt is like they are remembering a place. A world we have never seen.\n\nCommander, wave 9 is when the rift remembers. Watch the edges of your screen.\n\nSomething is watching back.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
      effect: 'screen_flicker',
    },
  },

  // ── WAVE 10 — Second Boss: Shadow Moth ──────────────────────────────────────
  {
    triggerId: 'boss_shadow_moth',
    preTrigger: true,
    scene: {
      id: 'boss_2_intro',
      title: 'PHASE SHIFT — SHADOW ENTITY EMERGING',
      body: 'The anomaly has gone dark. Electromagnetic interference is off the charts.\n\nA Shadow Moth has emerged from the interference zone. It phases between dimensions — our weapons barely track it.\n\nWatch for the distortion field. That is where it re-enters reality.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      bossType: 'shadow_moth',
      autoAdvanceMs: 10000,
    },
  },

  // ── WAVE 11 — Shadow Echo ────────────────────────────────────────────────────
  {
    triggerId: 'wave_11',
    preTrigger: false,
    scene: {
      id: 'wave_11_shadow',
      title: '[W11] SHADOW ECHO — THE DOOR IS OPEN',
      body: 'The moth phase-dimension is bleeding into ours.\n\nYour sentries are reporting ghost signals — bugs that exist in two places at once.\n\nWe thought the moth was the threat. Turns out it was the door.\n\nWhatever came through it is still coming.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 12 — The Collective ─────────────────────────────────────────────────
  {
    triggerId: 'wave_12',
    preTrigger: true,
    scene: {
      id: 'wave_12_collective',
      title: '[W12] THE COLLECTIVE — LOCATION BROADCAST DETECTED',
      body: 'I have decoded part of the crystal signal.\n\nIt is not a warning. It is not a threat display.\n\nIt is a location broadcast. They are telling other worlds where we are.\n\nCommander, there may be other rifts. Other Nexus installations. Other defenders.\n\nOr other bugs, waiting for their turn.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
      effect: 'screen_flicker',
    },
  },

  // ── WAVE 13 — Fragment Analysis ─────────────────────────────────────────────
  {
    triggerId: 'wave_13',
    preTrigger: false,
    scene: {
      id: 'wave_13_fragment',
      title: '[W13] FRAGMENT ANALYSIS — SPECIES BOUNDARY BREACH',
      body: 'I managed to retrieve a crystal fragment from the moth remains.\n\nCommander, this is not silicon. This is not carbon. This is something I do not have a word for.\n\nThe lattice structure self-replicates when exposed to our atmosphere.\n\nWe are not just defending a base. We are defending a species boundary.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 14 — Warning ────────────────────────────────────────────────────────
  {
    triggerId: 'wave_14',
    preTrigger: true,
    scene: {
      id: 'wave_14_warning',
      title: '[W14] OUTPOST SIGMA — STATUS: DARK',
      body: 'Outpost Sigma just went dark.\n\nI told you about Sigma back at Wave 1. I said no survivors.\n\nI was wrong. There were survivors. And they were converted.\n\nIncoming transmission detected. But the voice on the other end speaks with a frequency that should not exist.\n\nCommander, wave 14. Corruption-class insects inbound. They look like standard bugs. They move differently. And they explode.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVE 15 — Third Boss: Crystal Stag ──────────────────────────────────────
  {
    triggerId: 'boss_crystal_stag',
    preTrigger: true,
    scene: {
      id: 'boss_3_intro',
      title: 'CRYSTAL RESONANCE SPIKE — APEX PREDATOR DETECTED',
      body: 'The crystal fragments from the beetle remains are reacting. They are forming a secondary organism.\n\nA Crystal Stag — an apex predator from wherever these things originated.\n\nIts antlers channel raw crystal energy. Destroy them first.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      bossType: 'crystal_stag',
      autoAdvanceMs: 10000,
    },
  },

  // ── WAVE 16 — Crystal Resonance ─────────────────────────────────────────────
  {
    triggerId: 'wave_16',
    preTrigger: false,
    scene: {
      id: 'wave_16_resonance',
      title: '[W16] CRYSTAL RESONANCE — THE CAVERN WAKES',
      body: 'The stag antlers channeled raw energy into the surrounding crystal formations.\n\nThe caverns around us are awake now. Crystal mushrooms. Crystal stalactites. They are not bugs — but they are not not bugs either.\n\nDr. Elara instruments are going haywire. The crystal lattice is growing toward the Nexus-Core.\n\nI think we are inside something, Commander. Something alive.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 17 — Symbiosis ─────────────────────────────────────────────────────
  {
    triggerId: 'wave_17',
    preTrigger: true,
    scene: {
      id: 'wave_17_symbiosis',
      title: '[W17] SYMBIOSIS — CRYSTAL WEB INCOMING',
      body: 'The widow web is not just physical.\n\nIt is a crystal lattice that propagates through the ground itself. Your turrets are losing targeting. Your damage output is being siphoned.\n\nCommander, the web is spreading from the stag death site. If we do not cut it off at wave 17, it reaches the Nexus-Core power supply.\n\nIf it reaches the power core, it pulls the rift wider.\n\nAnd if the rift gets wider...',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVE 18 — The Web Spreads ───────────────────────────────────────────────
  {
    triggerId: 'wave_18',
    preTrigger: false,
    scene: {
      id: 'wave_18_web',
      title: '[W18] THE WEB SPREADS — TUNNEL JUNCTION BREACH',
      body: 'The web extends further than we thought.\n\nIt has reached the tunnel junction between sectors 3 and 7. That is the chokepoint for our power conduits.\n\nDr. Elara has a plan — she can overload the crystal formations with a resonance pulse. It might destabilize the web.\n\nIt might also destabilize everything else.\n\nBut you will not get another chance. Wave 18. Stop the web.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVE 19 — Last Stand Protocol ────────────────────────────────────────────
  {
    triggerId: 'wave_19',
    preTrigger: true,
    scene: {
      id: 'wave_19_last_stand',
      title: '[W19] LAST STAND PROTOCOL — ACTIVATED',
      body: 'Commander, I am activating Last Stand Protocol.\n\nYou might see some new equipment in the turret bay. Do not ask where it came from.\n\nIt came from Outpost Sigma. Before they went dark.\n\nDr. Elara managed to recover their resonance disruptor schematics before the signal cut out. We have loaded it into your sentries.\n\nThis is it, Commander. Everything we have learned — every wave, every death, every pattern — it comes down to wave 19.\n\nThis is what Last Stand was designed for.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 10000,
      effect: 'last_stand',
    },
  },

  // ── WAVE 20 — Fourth Boss: Venom Widow ─────────────────────────────────────
  {
    triggerId: 'boss_venom_widow',
    preTrigger: true,
    scene: {
      id: 'boss_4_intro',
      title: 'THREAT CLASS: VENOM WIDOW — BIOHAZARD ALERT',
      body: 'Biohazard alert. The Stag collapse triggered a secondary emergence.\n\nThe Venom Widow spins a web of pure crystal toxin. It slows your sentries and corrupts your damage output.\n\nIf it catches you in a web strand you are dead in three seconds. Keep moving.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      bossType: 'venom_widow',
      autoAdvanceMs: 10000,
    },
  },

  // ── WAVE 21 — The Hornet Shadow ──────────────────────────────────────────
  {
    triggerId: 'wave_21',
    preTrigger: false,
    scene: {
      id: 'wave_21_hornets_shadow',
      title: '[W21] THE HORNET SHADOW — CONVERGENCE DETECTED',
      body: 'Every anomaly signature is converging on a single point.\n\nThe Stag. The Widow. The Moth. All three sources just pulled together into one massive resonance event.\n\nDr. Elara: What are we looking at?\n\nI think the hornet is not a boss, Commander. It is a convergence event. All the crystal fragments are trying to become one thing.\n\nWhatever that thing is — it has four waves left to manifest.\n\nThis is the final arc, Agent Vance. Win or lose — it ends at wave 25.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVE 22 — Countdown ─────────────────────────────────────────────────────
  {
    triggerId: 'wave_22',
    preTrigger: true,
    scene: {
      id: 'wave_22_countdown',
      title: '[W22] COUNTDOWN — FOUR WAVES REMAIN',
      body: '20 days ago, the rift opened.\n\n10 days ago, it stabilized.\n\n5 days ago, the first bugs appeared.\n\nToday, the anomaly reached critical mass.\n\nWhatever is coming in wave 25 has been waiting for this exact moment.\n\nThe crystal fragments are vibrating at a frequency I have never seen. They are synchronized. They are ready.\n\nAnd so are we. Wave 22, Commander. Four left.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
      effect: 'screen_pulse',
    },
  },

  // ── WAVE 23 — Overseer Rising ────────────────────────────────────────────────
  {
    triggerId: 'wave_23',
    preTrigger: false,
    scene: {
      id: 'wave_23_overseer',
      title: '[W23] OVERSEER RISING — VOICE DETECTED IN SIGNAL',
      body: 'I am picking up a voice in the signal. Not crystal. Not insect.\n\nSomething older. Using the crystal fragments as a broadcast medium.\n\nIt says: You were expected. One. Now many.\n\nCommander, if you are hearing this, it is because you are still alive. That means you are the one who matters.\n\nDo not let it take the Core.\n\nTwo waves left. The convergence is almost complete. And I do not think it is the hornet we should be afraid of.\n\nI think it is what has been watching through the hornet.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVE 24 — Final Preparation ─────────────────────────────────────────────
  {
    triggerId: 'wave_24',
    preTrigger: true,
    scene: {
      id: 'wave_24_prep',
      title: '[W24] FINAL PREPARATION — SUPPLY DROP INCOMING',
      body: 'Supply drop incoming, Commander.\n\nYou are going to need everything you have. Crystals doubled for this wave — last chance to upgrade.\n\nThe Hornet is not the threat. It is the distraction.\n\nWhen it spawns, every crystal fragment in the anomaly will be drawn to it. They will be focused on the convergence point.\n\nThat is our window. Not just to survive — to end this.\n\nWave 24. Use everything. Tomorrow we close the rift.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
      effect: 'crystal_bonus',
    },
  },

  // ── WAVE 25 — Fifth Boss: Thunder Hornet ────────────────────────────────────
  {
    triggerId: 'boss_thunder_hornet',
    preTrigger: true,
    scene: {
      id: 'boss_5_intro',
      title: 'CONVERGENCE MAXIMUM — FINAL BATTLE BEGINS',
      body: 'Every anomaly signature is pointing to a single origin point.\n\nThe Thunder Hornet is not just a boss. It is the swarm Queen.\n\nLightning. Swarm. Swarm-Split.\n\nThis is the final battle, Commander. End it.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      bossType: 'thunder_hornet',
      autoAdvanceMs: 10000,
    },
  },
  {
    triggerId: 'boss_thunder_hornet',
    preTrigger: false,
    scene: {
      id: 'final_victory',
      title: 'ANOMALY COLLAPSED — RIFT SEALED',
      body: 'The Hornet has been destroyed. The rift is sealing.\n\nBut Dr. Elara final log before transmission blackout suggests something troubling:\n\nThe crystal fragments are self-replicating. They have been observing our defenses. They are learning.\n\nThe war is not over. It is just begun.\n\n[LOG ENDS]',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 12000,
    },
  },

  // ── WAVE 26 — The Silence ───────────────────────────────────────────────────
  {
    triggerId: 'wave_26',
    preTrigger: true,
    scene: {
      id: 'wave_26_silence',
      title: '[W26] THE SILENCE — RIFT CLOSING',
      body: 'The rift is closing. The crystal resonance is fading. For the first time in 20 days the anomaly is quiet.\n\nDr. Elara: Commander, I am seeing something on the scanner. The crystal fragments on the ground are still glowing.\n\nThey are not dying. They are waiting.\n\nNo bugs for five waves. Just the sound of the rift closing and the hum of crystal resonance in the ground.\n\nAnd a new message in the signal: YOU WERE EXPECTED. ONE. NOW MANY.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 10000,
    },
  },

  // ── WAVES 27-29 — The Silence (atmospheric) ────────────────────────────────
  {
    triggerId: 'wave_27',
    preTrigger: true,
    scene: {
      id: 'wave_27_echo',
      title: '[W27] RESONANCE ECHO — COUNTDOWN ACTIVE',
      body: 'The crystal formations are pulsing in sequence. A pattern I have never seen before.\n\nThey are counting down, Commander. Something is building.\n\nAnd it is not just here. The other installations — if they exist — they are counting too.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 7000,
    },
  },
  {
    triggerId: 'wave_28',
    preTrigger: true,
    scene: {
      id: 'wave_28_signal',
      title: '[W28] SIGNAL COUNT — 47 FRAGMENTS REMAIN',
      body: 'I am tracking 47 crystal fragments that did not dissolve after the Hornet death.\n\nThey are forming a pattern. A shape.\n\nAgent Vance: It looks like a glyph. An address.\n\nWhatever sent those crystal fragments through the rift — it knows where we are now.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 7000,
    },
  },
  {
    triggerId: 'wave_29',
    preTrigger: true,
    scene: {
      id: 'wave_29_manifestation',
      title: '[W29] FINAL SIGNAL — FRAGMENTS MERGING INDEPENDENTLY',
      body: 'The rift is almost closed. But those fragments — they are not waiting for it.\n\nThey are merging. Independent of the rift.\n\nDr. Elara: Commander, get to the Core. Now.\n\nWhatever is coming through the fragments does not need the rift anymore. It is already here.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
      effect: 'screen_flicker',
    },
  },

  // ── WAVE 30 — The Overseer Manifests ────────────────────────────────────────
  {
    triggerId: 'boss_overseer',
    preTrigger: true,
    scene: {
      id: 'boss_6_intro',
      title: '[W30] THE OVERSEER — IT HAS ARRIVED',
      body: '[SIGNAL DISRUPTION]\n\nThe crystal fragments are not the threat. They are a message.\n\nSomeone — something — sent them through the rift. To test us. To study us. To prepare.\n\nAnd Commander... you are standing in the middle of the reply.\n\n[TRANSMISSION ENDS]\n\nThe screen goes dark for two seconds.\n\nThen a figure steps into the Nexus-Core.\n\nNot an insect. An entity that wears insect bodies like armor.\n\nCrystalline. Humanoid. Eyes like shattered glass.\n\nTHE OVERSEER.',
      speaker: 'Dr. Elara — Archive Recording',
      speakerColor: '#88ffcc',
      bossType: 'overseer',
      autoAdvanceMs: 12000,
      effect: 'overseer_manifest',
    },
  },
  {
    triggerId: 'boss_overseer',
    preTrigger: false,
    scene: {
      id: 'boss_6_defeat',
      title: 'OVERSEER DESTROYED — FIRST FORM ELIMINATED',
      body: 'The Overseer first form shatters.\n\nCrystalline shards scatter across the battlefield. The humanoid silhouette cracks, fragments, dissolves.\n\nBut the signal does not stop.\n\nThe fragments on the ground begin to vibrate. To merge. To rebuild.\n\nDr. Elara: Commander... it was not the Overseer. It was the armor.\n\nThe real swarm is coming. And it has been watching us this entire time.\n\nEvery wave. Every death. Every upgrade. It learned all of it.\n\nWaves 31-50. The invasion begins.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 10000,
    },
  },

  // ── WAVES 31-50 — Endgame ────────────────────────────────────────────────
  {
    triggerId: 'wave_31',
    preTrigger: true,
    scene: {
      id: 'wave_31_return',
      title: '[W31] THE SWARM RETURNS — CHIMERIC HYBRIDS INCOMING',
      body: 'You destroyed the Overseer first form. But it was not the Overseer — it was the armor.\n\nThe real swarm is here now. And they are not coming in classes anymore.\n\nEvery bug is a chimeric hybrid. Multiple biome effects on the same creature. They change color mid-fight.\n\nThis is no longer a test. This is an invasion.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_35',
    preTrigger: true,
    scene: {
      id: 'wave_35_adaptation',
      title: '[W35] ADAPTATION CYCLE — BUGS LEARNING FASTER',
      body: 'The bugs are learning faster than we can counter.\n\nEvery death teaches them something. Every sentry pattern gets analyzed. Every upgrade we buy — they know.\n\nDr. Elara: Commander, I need to tell you something. The Overseer is not attacking the Core.\n\nIt is attacking our data. Our patterns. Our learning curve.\n\nIt is not trying to win. It is trying to outgrow us.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_40',
    preTrigger: true,
    scene: {
      id: 'wave_40_crossfire',
      title: '[W40] CROSSFIRE — RIFT REOPENED — DUAL REALITY DETECTED',
      body: 'The rift has reopened. Wider than before.\n\nAnd Commander — there is something on the other side.\n\nAnother Nexus installation. Other defenders fighting other bugs. For the first time, we can see each other.\n\nTwo realities. One war.\n\nThis is what the crystal fragments were for. Not an invasion — a bridge.\n\nWhatever comes through next will change everything.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
    },
  },
  {
    triggerId: 'wave_41',
    preTrigger: true,
    scene: {
      id: 'wave_41_bridge',
      title: '[W41] THE BRIDGE — DUAL REALITY ACTIVE',
      body: 'The rift is stable. Two-way traffic confirmed.\n\nI am seeing something on the far side — other defenders. Other command centers. Other Dr. Elaras. Other Agent Vances.\n\nThey are fighting the same war. In a different reality. And for the first time — we are on the same side.\n\nWave 41, Commander. The Convergence Queen draws near.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_45',
    preTrigger: true,
    scene: {
      id: 'wave_45_signal_merge',
      title: '[W45] SIGNAL MERGE — CONVERGENCE QUEEN PREPARING',
      body: 'The two realities are merging at the rift point. Crystal formations from both sides are interweaving.\n\nThe Convergence Queen has been watching. Learning. Adapting.\n\nShe has every boss power. Every phase. Every mechanic. All at once.\n\nAnd she knows how we fight. She knows our patterns. She knows our upgrades.\n\nWave 45, Commander. Five waves to the end. And she has been preparing for you since wave 1.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
    },
  },
  {
    triggerId: 'boss_convergence_queen',
    preTrigger: true,
    scene: {
      id: 'boss_7_intro',
      title: '[W50] CONVERGENCE QUEEN — FINAL CONFRONTATION',
      body: 'She emerged at wave 50.\n\nAll five bosses fused. Every pattern. Every phase. Every mechanic. Lightning. Phase-shift. Crystal beams. Web toxin. Swarm split. All at once.\n\nBut you have been preparing too, Commander.\n\nEvery wave. Every death. Every upgrade. Every pattern you learned and every lesson she tried to steal.\n\nThis is the final stand. Not just for the Nexus-Core.\n\nFor the species boundary.\n\nFor the other installations. The other realities. The other defenders who are watching right now.\n\nEnd it.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      bossType: 'convergence_queen',
      autoAdvanceMs: 12000,
      effect: 'final_stand',
    },
  },
  {
    triggerId: 'boss_convergence_queen',
    preTrigger: false,
    scene: {
      id: 'boss_7_defeat',
      title: 'RIFT SEALED — NEXUS SECURED — VICTORY',
      body: 'The Convergence Queen has fallen.\n\nThe crystal formations are dissolving. The rift is collapsing. The Nexus-Core is secure.\n\nOn the other side of the bridge — other installations are watching. Other defenders are cheering.\n\nYou held the line, Commander. Not just for yourself. For every world the crystal fragments touched.\n\nThe anomaly is gone. The rift is sealed. The signal is silent.\n\nAnd for the first time in 50 waves — the Nexus-Core stands alone.\n\nYou won.\n\n[TRANSMISSION COMPLETE — NEXUS SECURED]',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 12000,
      effect: 'rift_sealed',
    },
  },

  // ── WAVES 32-34 — The Swarm Intensifies ──────────────────────────────────
  {
    triggerId: 'wave_32',
    preTrigger: true,
    scene: {
      id: 'wave_32_hybrid',
      title: '[W32] HYBRID EVOLUTION — MULTI-BIOME THREATS',
      body: 'The chimeric hybrids are evolving. Fast.\n\nI am seeing phase-shifted swarmer units. Crystal-armored scouts. Frost-ember combinations that should not be possible.\n\nDr. Elara: The Overseer was not just watching. It was teaching them.\n\nEvery boss pattern. Every attack type. Every mechanic. All fused into single organisms.\n\nThis is what 30 waves of observation bought them.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_33',
    preTrigger: true,
    scene: {
      id: 'wave_33_overload',
      title: '[W33] SENTRY OVERLOAD — ADAPTIVE COUNTERMEASURES',
      body: 'The hybrids are targeting our sentries directly now.\n\nThey have learned the firing patterns. The targeting priorities. The upgrade paths.\n\nAgent Vance: Commander, I recommend rotating sentry positions every wave. Do not let them predict.\n\nThe bugs are not just adapting to our weapons. They are adapting to our tactics.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_34',
    preTrigger: true,
    scene: {
      id: 'wave_34_pressure',
      title: '[W34] PRESSURE POINT — NEXUS CORE STRESS DETECTED',
      body: 'The Nexus-Core is under stress. The crystal resonance from the hybrids is interfering with our power systems.\n\nDr. Elara: Commander, the Core is holding. But every hybrid that reaches the center drains a little more power.\n\nWe are not just fighting for survival anymore. We are fighting for the Core itself.\n\nIf the Core goes dark, the rift stays open. Permanently.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },

  // ── WAVES 36-39 — The Convergence Builds ─────────────────────────────────
  {
    triggerId: 'wave_36',
    preTrigger: true,
    scene: {
      id: 'wave_36_convergence',
      title: '[W36] CONVERGENCE BUILDING — QUEEN SIGNAL DETECTED',
      body: 'I am picking up a new signal. Not from the bugs. From the rift itself.\n\nSomething is forming in the space between realities. A fusion of every boss pattern we have encountered.\n\nAgent Vance: Commander, the Convergence Queen is not coming. She is being built.\n\nEvery boss we defeated — their patterns are being recycled. Recombined. Perfected.\n\nShe will have everything we have faced. And she will have learned from every mistake they made.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 9000,
    },
  },
  {
    triggerId: 'wave_37',
    preTrigger: true,
    scene: {
      id: 'wave_37_queen_whisper',
      title: '[W37] THE QUEEN WHISPER — PSYCHIC INTERFERENCE',
      body: 'The signal is getting stronger. And it is not just data anymore.\n\nDr. Elara: Commander, I need to warn you. The Convergence Queen is broadcasting on a frequency that affects cognition.\n\nYou may experience disorientation. Visual anomalies. Time distortion.\n\nIt is not an attack. It is a greeting.\n\nShe knows you are here. And she has been waiting for you specifically.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
      effect: 'screen_flicker',
    },
  },
  {
    triggerId: 'wave_38',
    preTrigger: true,
    scene: {
      id: 'wave_38_reality_tear',
      title: '[W38] REALITY TEAR — DUAL NEXUS OVERLAP',
      body: 'The two realities are overlapping now. I can see the other Nexus-Core.\n\nTheir defenders are fighting the same hybrids. The same patterns. The same war.\n\nAgent Vance: Commander, the other installation just lost their east wall.\n\nIf we fall, they fall. If they fall, we fall.\n\nThis is not two battles. This is one battle in two places.\n\nHold the line. For both of us.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_39',
    preTrigger: true,
    scene: {
      id: 'wave_39_prepare',
      title: '[W39] FINAL PREPARATION — ONE WAVE TO CONVERGENCE',
      body: 'One wave until the Convergence Queen.\n\nDr. Elara: Commander, I have analyzed every boss pattern. Every phase transition. Every attack type.\n\nShe will start with the Hornet lightning. Transition to the Moth phase-shift. Channel the Stag crystal beams. Deploy the Widow web toxin. Finish with the Beetle ram.\n\nAll of it. Simultaneously.\n\nBut she has one weakness. She learned from them. Which means she inherited their patterns.\n\nAnd you have beaten every single one.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
    },
  },

  // ── WAVES 42-44 — Dual Reality Combat ────────────────────────────────────
  {
    triggerId: 'wave_42',
    preTrigger: true,
    scene: {
      id: 'wave_42_dual_war',
      title: '[W42] DUAL WAR — BOTH NEXUS CORES UNDER SIEGE',
      body: 'Both installations are under full assault now.\n\nThe hybrids are attacking from both sides of the rift simultaneously. Every kill on our side weakens their defenses. Every kill on their side weakens ours.\n\nDr. Elara: Commander, I am sharing targeting data with the other installation.\n\nWe are fighting as one force. Two realities. One command.\n\nThe Convergence Queen is using the rift as a conduit. Every bug that dies on either side feeds her power.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_43',
    preTrigger: true,
    scene: {
      id: 'wave_43_sacrifice',
      title: '[W43] THE SACRIFICE — OTHER INSTALLATION CRITICAL',
      body: 'The other installation is failing. Their Core is at 20%.\n\nAgent Vance: Commander, they are requesting we divert power from our Core to theirs.\n\nIt will weaken our defenses. But if their Core goes dark, the rift destabilizes. And if the rift destabilizes during the Convergence Queen formation...\n\nShe will not just be powerful. She will be infinite.\n\nWe have to hold both lines.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_44',
    preTrigger: true,
    scene: {
      id: 'wave_44_queen_approaches',
      title: '[W44] THE QUEEN APPROACHES — RIFT PULSE CRITICAL',
      body: 'The rift is pulsing. Once per second. Synchronized with the Convergence Queen formation.\n\nDr. Elara: Commander, she is almost ready. The crystal formations from both realities are merging.\n\nIn one wave, she will emerge. And she will not be like the other bosses.\n\nShe will remember every death. Every defeat. Every pattern.\n\nAnd she will not make the same mistakes.\n\nThis is it, Commander. One wave. Everything we have been building toward.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 9000,
      effect: 'screen_flicker',
    },
  },

  // ── WAVES 46-49 — Pre-Finale ─────────────────────────────────────────────
  {
    triggerId: 'wave_46',
    preTrigger: true,
    scene: {
      id: 'wave_46_calm',
      title: '[W46] THE CALM — EYE OF THE STORM',
      body: 'Strange. The bugs have stopped attacking.\n\nThey are just... standing there. All of them. Facing the rift.\n\nAgent Vance: Commander, every hybrid on the battlefield has stopped moving.\n\nThey are waiting. Paying respect.\n\nThe Convergence Queen is not just their leader. She is their purpose.\n\nEverything — every wave, every death, every adaptation — was building to this moment.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_47',
    preTrigger: true,
    scene: {
      id: 'wave_47_queen_broadcast',
      title: '[W47] THE QUEEN BROADCAST — DIRECT TRANSMISSION',
      body: 'She is speaking to us. Directly.\n\nNot through the crystal fragments. Not through the signal. Through the rift itself.\n\nDr. Elara: Commander... I can hear her. Not words. Feelings. Intent.\n\nShe does not hate us. She does not want to destroy us.\n\nShe wants to merge. To combine. To create something new from both species.\n\nThat is more terrifying than any attack.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_48',
    preTrigger: true,
    scene: {
      id: 'wave_48_final_upgrades',
      title: '[W48] FINAL UPGRADES — EVERYTHING WE HAVE',
      body: 'This is the last real wave before the Queen.\n\nAgent Vance: Commander, I am authorizing full upgrade access. Everything we have. Everything we have saved.\n\nSpend it all. Every crystal. Every upgrade. Every advantage.\n\nBecause in two waves, you will face something that has been learning from every single battle you have ever fought.\n\nAnd she will be perfect.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 8000,
    },
  },
  {
    triggerId: 'wave_49',
    preTrigger: true,
    scene: {
      id: 'wave_49_one_left',
      title: '[W49] ONE WAVE — THE FINAL TRANSMISSION',
      body: 'Dr. Elara: Commander, this is my final transmission.\n\nI have analyzed 50 waves of data. Every bug. Every pattern. Every crystal fragment.\n\nThe Convergence Queen is not invincible. She is a composite. And composites have seams.\n\nWhen she transitions between boss patterns — there is a gap. A fraction of a second where the old pattern ends and the new one begins.\n\nThat is your window. That is where you strike.\n\nI believe in you, Commander. I always have.\n\nEnd this.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 10000,
      effect: 'screen_flicker',
    },
  },
];

// ---------------------------------------------------------------------------
// Biome-specific lore
// ---------------------------------------------------------------------------

const BIOME_SCENES: SceneTrigger[] = [
  {
    triggerId: 'biome_glitch',
    preTrigger: true,
    scene: {
      id: 'biome_glitch_intro',
      title: 'BIOME UNLOCKED: GLITCH ZONE',
      body: 'Location: Unknown coordinate — reality here is unstable.\n\nThe Glitch Zone is where the anomaly first touched our world. Crystalline corruption is at its heaviest here.\n\nExpect visual distortions and phase-shifted enemies.',
      speaker: 'Dr. Elara — Lead Entomologist',
      speakerColor: '#88ffcc',
      autoAdvanceMs: 6000,
    },
  },
  {
    triggerId: 'biome_crystal',
    preTrigger: true,
    scene: {
      id: 'biome_crystal_intro',
      title: 'BIOME UNLOCKED: CRYSTAL CAVERNS',
      body: 'Location: Subsurface anomaly site.\n\nThe Crystal Caverns are saturated with resonance energy. Crystal multipliers are boosted 2x here.\n\nBut so are the bugs.',
      speaker: 'Agent Vance — Field Operations',
      speakerColor: '#ffaa00',
      autoAdvanceMs: 6000,
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a scene for a specific trigger + timing.
 * @param triggerId e.g. 'wave_N', 'boss_armored_beetle', 'biome_glitch'
 * @param preTrigger true = before event, false = after event
 */
export function getSceneForTrigger(triggerId: string, preTrigger = true): StoryScene | null {
  const match = [...WAVE_SCENES, ...BIOME_SCENES].find(
    s => s.triggerId === triggerId && s.preTrigger === preTrigger
  );
  return match?.scene ?? null;
}

/** Get all scenes (for debugging / coverage testing) */
export function getAllScenes(): SceneTrigger[] {
  return [...WAVE_SCENES, ...BIOME_SCENES];
}

/**
 * Get pre-wave scene for a given wave number.
 * Boss waves (5, 10, 15, 20, 25, 30) return null — handled by boss system.
 */
export function getSceneForWave(wave: number): StoryScene | null {
  if (wave > 0 && wave % 5 === 0) return null;

  const postScenes: Record<number, string> = {
    6: 'wave_6', 8: 'wave_8', 11: 'wave_11', 13: 'wave_13',
    16: 'wave_16', 18: 'wave_18', 21: 'wave_21', 23: 'wave_23',
    26: 'wave_26', 27: 'wave_27', 28: 'wave_28', 29: 'wave_29',
    31: 'wave_31', 35: 'wave_35', 40: 'wave_40',
    41: 'wave_41', 45: 'wave_45',
  };
  if (postScenes[wave]) return getSceneForTrigger(postScenes[wave], false);

  const preScenes: Record<number, string> = {
    1: 'wave_1', 2: 'wave_2', 3: 'wave_3', 4: 'wave_4',
    7: 'wave_7', 9: 'wave_9', 12: 'wave_12', 14: 'wave_14',
    17: 'wave_17', 19: 'wave_19', 22: 'wave_22', 24: 'wave_24',
    32: 'wave_32', 33: 'wave_33', 34: 'wave_34',
    36: 'wave_36', 37: 'wave_37', 38: 'wave_38', 39: 'wave_39',
    42: 'wave_42', 43: 'wave_43', 44: 'wave_44',
    46: 'wave_46', 47: 'wave_47', 48: 'wave_48', 49: 'wave_49',
  };
  if (preScenes[wave]) return getSceneForTrigger(preScenes[wave], true);

  return null;
}

/** Get boss intro scene */
export function getBossIntro(bossType: string): StoryScene | null {
  return getSceneForTrigger('boss_' + bossType, true);
}

/** Get boss defeat scene */
export function getBossDefeat(bossType: string): StoryScene | null {
  return getSceneForTrigger('boss_' + bossType, false);
}
