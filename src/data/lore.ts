export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: 'ai_stable' | 'ai_corrupted' | 'terminal' | 'unknown';
  mood?: 'normal' | 'glitch' | 'shiver' | 'alert';
  speed?: number;
}

export interface StoryBeat {
  id: string;
  trigger: {
    type: 'wave_start' | 'boss_kill' | 'game_start' | 'prestige';
    value: number;
  };
  lines: DialogueLine[];
}

export const LORE_DATA: StoryBeat[] = [
  {
    id: 'intro',
    trigger: { type: 'game_start', value: 0 },
    lines: [
      {
        speaker: 'CATHARSIS ENGINE',
        text: 'Cognitive Stress-Discharge Protocol v4.5 initialized. Welcome, Patient.',
        portrait: 'terminal',
        speed: 15
      },
      {
        speaker: 'CATHARSIS COG',
        text: 'My sensors detect elevated cerebral tension. Your daily anger is currently bottled up.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'CATHARSIS COG',
        text: 'Let us translate that pressure. We have digitized your anxieties into biomechanical vermin.',
        portrait: 'ai_stable',
        mood: 'glitch'
      },
      {
        speaker: 'SYSTEM DETOX',
        text: 'THREAT LEVEL: MAXIMUM IRRITATION. MISSION: SMASH ALL BIOMASS. VENT ALL RAGE NOW.',
        portrait: 'terminal',
        mood: 'alert',
        speed: 10
      }
    ]
  },
  {
    id: 'first_mutation',
    trigger: { type: 'wave_start', value: 5 },
    lines: [
      {
        speaker: 'CATHARSIS COG',
        text: 'Cerebral indicators highlight rapid compaction of old stress loops.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'CATHARSIS COG',
        text: 'Observe they crawl with the precise rhythm of your nagging thoughts. Splate them to dust.',
        portrait: 'ai_stable',
        mood: 'shiver'
      }
    ]
  },
  {
    id: 'corrupted_warning',
    trigger: { type: 'wave_start', value: 10 },
    lines: [
      {
        speaker: 'CATHARSIS COG',
        text: 'C-ortical buffer... overflow... r-rage surge incoming... [STATIC]',
        portrait: 'ai_corrupted',
        mood: 'glitch',
        speed: 80
      },
      {
        speaker: 'INTRUSIVE WORRY',
        text: 'WE ARE THE TOXIC VOICES OF YOUR EXHAUSTION. YOU CANNOT OUT-SMASH THE PRESSURES OF REAL LIFE.',
        portrait: 'unknown',
        mood: 'shiver',
        speed: 150
      }
    ]
  },
  {
    id: 'boss_1_kill',
    trigger: { type: 'boss_kill', value: 10 },
    lines: [
      {
        speaker: 'SYSTEM DETOX',
        text: 'BOSS EXCISED. CORRESPONDING ANXIETY BANISHED. ESTIMATED DOPAMINE INCREASE: 340%.',
        portrait: 'terminal'
      },
      {
        speaker: 'CATHARSIS COG',
        text: 'Magnificent splatter. Feel the tension physically exit your muscles as their shell shatters.',
        portrait: 'ai_stable'
      }
    ]
  },
  {
    id: 'wave_20_revelation',
    trigger: { type: 'wave_start', value: 20 },
    lines: [
      {
        speaker: 'INTRUSIVE WORRY',
        text: 'YOUR POWERUPS AND LASERS ARE ONLY DISTRACTIONS. WE WILL MULTIPLY ONCE YOUR SCREEN TURNS OFF.',
        portrait: 'unknown'
      },
      {
        speaker: 'INTRUSIVE WORRY',
        text: 'SMASH AS HARD AS YOU WANT. YOU STILL HAVE TO LOG OUT AND EXPLAIN YOUR REASONS.',
        portrait: 'unknown'
      },
      {
        speaker: 'SYSTEM DETOX',
        text: '[CRITICAL STRESS DEFLECTION ENGAGED: IGNORING INTRUSIVE LORE. INJECTING HEAVY DOPAMINE DROPS.]',
        portrait: 'terminal'
      }
    ]
  }
];

export const LOGS_DATA = [
  {
    id: 'log_1',
    title: 'THERAPY JOURNAL #001',
    content: 'The clinical trial uses biomechanical swarm representations for mental venting. Early tests show a 400% increase in patient smiling when bugs explode in neon splatters.',
    unlockedAt: 3
  },
  {
    id: 'log_2',
    title: 'CATHARSIS MEMORANDUM',
    content: 'The "tank" bug corresponds to long-held grievances (e.g. micromanagers, broken promises). Smashing them requires heavy, repeated impact, yielding massive aesthetic endorphin dumps.',
    unlockedAt: 8
  },
  {
    id: 'log_3',
    title: 'STRESS CLASSIFIED FILES',
    content: 'WARNING: If the patient starts feeling too peaceful, the engine will trigger a Bossholder Rush to stimulate maximum healthy rage venting. Dopamine flows must be sustained.',
    unlockedAt: 15
  }
];
