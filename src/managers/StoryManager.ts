import { StoryScene } from '@/types'

export class StoryManager {
  private scenes: StoryScene[] = [
    // ACT I - Initial Threat
    { id: 'wave_0', wave: 0, title: 'Commander Briefing', body: 'The crystal swarm approaches. Your defensive turrets are online. Each wave will be more intense than the last.', speaker: 'elara' },
    
    // ACT II - Escalation
    { id: 'wave_5', wave: 5, title: 'First Boss Approaching', body: 'Our sensors detect an armored beetle approaching. This is no ordinary bug - it has crystalline plating.', speaker: 'vance', effect: 'screen_flicker' },
    
    // ACT III - Convergence
    { id: 'wave_10', wave: 10, title: 'Warlord Detected', body: 'A Warlord-class bug is forming at the convergence point. This is the endgame, Commander.', speaker: 'elara', effect: 'overseer_manifest' },
    { id: 'wave_15', wave: 15, title: 'Signal Intercepted', body: 'I am picking up a voice in the signal. Not crystal. Not insect. Something older. Using the crystal fragments as a broadcast medium.', speaker: 'elara', effect: 'last_stand' },
    
    // ACT IV - Revelation
    { id: 'wave_20', wave: 20, title: 'Hybrid Threat', body: 'Every bug is a chimeric hybrid. Multiple biome effects on the same creature. They change color mid-fight.', speaker: 'vance', effect: 'crystal_bonus' },
    { id: 'wave_25', wave: 25, title: 'Core Under Stress', body: 'The Nexus-Core is under stress. The crystal resonance from the hybrids is interfering with our power systems.', speaker: 'elara' },
    
    // ACT V - The Overseer
    { id: 'wave_30', wave: 30, title: 'Overseer Manifest', body: 'The signal is getting stronger. And it is not just data anymore. Dr. Elara: Commander, the Convergence Queen is broadcasting directly.', speaker: 'elara', effect: 'overseer_manifest' },
    { id: 'wave_35', wave: 35, title: 'Cognitive Attack', body: 'You may experience disorientation. Visual anomalies. Time distortion. It is not an attack. It is a greeting.', speaker: 'elara' },
    { id: 'wave_40', wave: 40, title: 'The Greeting', body: 'She is speaking to us. Directly. Not through the crystal fragments. Not through the signal. Through the rift itself.', speaker: 'elara' },
    
    // ACT VI - Finale
    { id: 'wave_45', wave: 45, title: 'Merge Protocol', body: 'She does not hate us. She does not want to destroy us. She wants to merge. To combine. To create something new.', speaker: 'vance' },
    { id: 'wave_50', wave: 50, title: 'Final Choice', body: 'That is more terrifying than any attack. The rift is almost closed... or is it opening? Choose wisely, Commander.', speaker: 'elara', effect: 'rift_sealed' }
  ]

  public getSceneForWave(wave: number): StoryScene | null {
    const scene = this.scenes.find(s => s.wave === wave)
    return scene || null
  }

  public getPreWaveScene(wave: number): StoryScene | null {
    return this.getSceneForWave(wave)
  }

  public getPostWaveScene(_wave: number): StoryScene | null {
    return null
  }
}