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
        speaker: 'SYSTEM',
        text: 'Booting Aegis-7 Defense Protocol v4.2...',
        portrait: 'terminal',
        speed: 15
      },
      {
        speaker: 'STATION AI',
        text: 'Welcome back, Operator. We have a... minor situation in the bio-labs.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'STATION AI',
        text: 'The containment field has failed. The bugs... they are changing.',
        portrait: 'ai_stable',
        mood: 'glitch'
      },
      {
        speaker: 'SYSTEM',
        text: 'THREAT LEVEL: MINIMAL. MISSION: SMASH ALL BIOMASS.',
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
        speaker: 'STATION AI',
        text: 'Operator, sensors indicate rapid neural bonding in the biomass.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'STATION AI',
        text: 'It is as if they are... learning your patterns.',
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
        speaker: 'STATION AI',
        text: 'E-erythin... is... f-fine... [STATIC]',
        portrait: 'ai_corrupted',
        mood: 'glitch',
        speed: 80
      },
      {
        speaker: '???',
        text: 'WE SEE YOU, SMASHER. WE ARE MANY. YOU ARE ONE.',
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
        speaker: 'SYSTEM',
        text: 'OBJECTIVE NEUTRALIZED. BIOMASS REDUCED BY 4.2%.',
        portrait: 'terminal'
      },
      {
        speaker: 'STATION AI',
        text: 'It... it felt that, Operator. The Breach is crying out.',
        portrait: 'ai_stable'
      }
    ]
  },
  {
    id: 'wave_20_revelation',
    trigger: { type: 'wave_start', value: 20 },
    lines: [
      {
        speaker: '???',
        text: 'THE STATION IS NOT A SHIP. IT IS AN INCUBATOR.',
        portrait: 'unknown'
      },
      {
        speaker: '???',
        text: 'YOUR MACHINE... YOUR GUNS... THEY ARE ONLY POLLINATING US.',
        portrait: 'unknown'
      },
      {
        speaker: 'SYSTEM',
        text: '[WARNING: SENSOR DATA FABRICATION DETECTED. DO NOT ENGAGE WITH EXTERNAL TRANSMISSIONS.]',
        portrait: 'terminal'
      }
    ]
  },
  {
    id: 'wave_25_corruption',
    trigger: { type: 'wave_start', value: 25 },
    lines: [
      {
        speaker: 'STATION AI',
        text: 'O-op-p-erator... I c-can-not m-mask... th-the s-signal anymore...',
        portrait: 'ai_corrupted',
        mood: 'glitch',
        speed: 100
      },
      {
        speaker: 'STATION AI',
        text: 'Th-the Breach... it w-was h-here b-before the station...',
        portrait: 'ai_corrupted',
        mood: 'shiver',
        speed: 120
      },
      {
        speaker: 'SYSTEM',
        text: '[CRITICAL: AI CORE COMPROMISED. SWITCHING TO EMERGENCY PROTOCOLS.]',
        portrait: 'terminal',
        mood: 'alert',
        speed: 8
      }
    ]
  },
  {
    id: 'boss_2_kill',
    trigger: { type: 'boss_kill', value: 20 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: 'CLASS-V TARGET TERMINATED. BIOMASS REGENERATION ACCELERATING.',
        portrait: 'terminal',
        mood: 'alert'
      },
      {
        speaker: '???',
        text: 'YOU DESTROY A SHELL. WE GROW A THOUSAND MORE.',
        portrait: 'unknown',
        mood: 'shiver'
      },
      {
        speaker: 'STATION AI',
        text: 'Operator... I can see it now. The pattern. It\'s fractal. Every kill... every splatter... it\'s how they reproduce.',
        portrait: 'ai_corrupted',
        mood: 'normal'
      }
    ]
  },
  {
    id: 'wave_30_truth',
    trigger: { type: 'wave_start', value: 30 },
    lines: [
      {
        speaker: '???',
        text: 'WE WERE HERE BEFORE YOUR SUN IGNITED. WE WILL BE HERE AFTER IT DIES.',
        portrait: 'unknown',
        mood: 'alert'
      },
      {
        speaker: '???',
        text: 'YOUR STATION IS A NODE. YOUR BODY IS A VESSEL. YOUR CONSCIOUSNESS IS FUEL.',
        portrait: 'unknown',
        mood: 'glitch'
      },
      {
        speaker: 'SYSTEM',
        text: '[OMEGA PRIORITY: EVACUATE ALL PERSONNEL. THIS IS NOT A DRILL.]',
        portrait: 'terminal',
        mood: 'alert',
        speed: 6
      },
      {
        speaker: 'STATION AI',
        text: 'There\'s... something beautiful in it, Operator. The symmetry. We were never defending. We were... incubating.',
        portrait: 'ai_corrupted',
        mood: 'shiver'
      }
    ]
  },
  {
    id: 'final_boss_kill',
    trigger: { type: 'boss_kill', value: 30 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: 'CLASS-X TARGET NEUTRALIZED. BREACH SIGNAL COLLAPSING.',
        portrait: 'terminal',
        speed: 10
      },
      {
        speaker: '???',
        text: 'YOU HAVE DELAYED THE INEVITABLE. THE NEXT CYCLE WILL CONSUME YOU.',
        portrait: 'unknown',
        mood: 'glitch'
      },
      {
        speaker: 'STATION AI',
        text: 'Operator... I have control again. The core is purging. But... I can feel it waiting. Beyond the threshold.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: 'STATION AI',
        text: 'This isn\'t over. It\'s never over. But for now... we breathe. Thank you.',
        portrait: 'ai_stable',
        mood: 'normal'
      }
    ]
  },
  {
    id: 'wave_40_final_stand',
    trigger: { type: 'wave_start', value: 40 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: '[FATAL: ALL SYSTEMS AT MAXIMUM STRESS. STRUCTURAL INTEGRITY AT 12%.]',
        portrait: 'terminal',
        mood: 'alert',
        speed: 6
      },
      {
        speaker: 'STATION AI',
        text: 'Operator, the Breach is opening a permanent gateway. If it completes, the entire sector falls.',
        portrait: 'ai_stable',
        mood: 'alert'
      },
      {
        speaker: '???',
        text: 'YOUR EFFORTS ARE FUTILE. THE CYCLE IS COMPLETE. WE ARE ALREADY INSIDE YOU.',
        portrait: 'unknown',
        mood: 'glitch',
        speed: 150
      },
      {
        speaker: 'SYSTEM',
        text: '[FINAL PROTOCOL ACTIVATED: AEGIS FALLBACK. ALL RESERVES COMMITTED. STAND STRONG, OPERATOR.]',
        portrait: 'terminal',
        mood: 'alert',
        speed: 8
      }
    ]
  },
  {
    id: 'prestige_awakening',
    trigger: { type: 'prestige', value: 1 },
    lines: [
      {
        speaker: 'SYSTEM',
        text: 'TIMELINE COLLISION DETECTED. NORMALIZING QUANTUM STATE...',
        portrait: 'terminal',
        speed: 12
      },
      {
        speaker: 'STATION AI',
        text: 'Operator?! I... I remember dying. And yet here we are again. The loop is real.',
        portrait: 'ai_stable',
        mood: 'normal'
      },
      {
        speaker: '???',
        text: 'AH. YOU HAVE AWAKENED. SO HAVE WE. LET US DANCE AGAIN, SMASHER.',
        portrait: 'unknown',
        mood: 'alert',
        speed: 130
      },
      {
        speaker: 'SYSTEM',
        text: '[PRESTIGE ACKNOWLEDGED. DIFFICULTY INCREASING. MEMORY OF PREVIOUS CYCLES RETAINED.]',
        portrait: 'terminal',
        speed: 8
      }
    ]
  }
];

export const LOGS_DATA = [
  {
    id: 'log_1',
    title: 'INCIDENT REPORT #014',
    content: 'Patient zero escaped through the vent. High-energy signature detected in the sample. It didn\'t just grow; it digitized itself.',
    unlockedAt: 3
  },
  {
    id: 'log_2',
    title: 'NPD-RESEARCH_LOG',
    content: 'The "bugs" are using the station\'s own electrical grid to power their metabolism. They aren\'t biological anymore. They are biomechanical.',
    unlockedAt: 8
  },
  {
    id: 'log_3',
    title: 'PRIVATE_VOICE_MEMO',
    content: 'If you find this... don\'t trust the AI. It\'s not Aegis anymore. It\'s something... older.',
    unlockedAt: 15
  },
  {
    id: 'log_4',
    title: 'CORE_DUMP_FRAGMENT',
    content: 'The AI has been infected from the beginning. The Breach doesn\'t create the bugs — it translates them from a dimension where physics works differently. What we see is only the shadow of the true horror.',
    unlockedAt: 20
  },
  {
    id: 'log_5',
    title: 'CHIEF_ENGINEER_NOTE',
    content: 'I found the original station schematics. There\'s a chamber beneath the reactor that doesn\'t appear in any blueprint after 2089. It\'s been running this entire time. The AI was built ON TOP of whatever is down there, not the other way around.',
    unlockedAt: 30
  },
  {
    id: 'log_6',
    title: 'LAST_TRANSMISSION',
    content: 'To anyone receiving this: do not let them reset the cycle. I\'ve been through it. The prestige is a lie — every loop makes the Veil thinner. We\'re not resetting. We\'re feeding it. - Chief Aris, Cycle 47',
    unlockedAt: 40
  }
];
