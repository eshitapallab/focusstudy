// Ambient sound configurations for focus sessions
// Uses Web Audio API to generate soothing sounds - no external dependencies

export interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'generated';
  generatorType: 'rain' | 'ocean' | 'wind' | 'campfire' | 'binaural' | 'drone';
  category: 'nature' | 'ambient' | 'binaural';
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    emoji: '🌧️',
    description: 'Soft rainfall sounds',
    type: 'generated',
    generatorType: 'rain',
    category: 'nature',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    emoji: '🌊',
    description: 'Calming beach waves',
    type: 'generated',
    generatorType: 'ocean',
    category: 'nature',
  },
  {
    id: 'wind',
    name: 'Soft Wind',
    emoji: '🍃',
    description: 'Gentle breeze through trees',
    type: 'generated',
    generatorType: 'wind',
    category: 'nature',
  },
  {
    id: 'campfire',
    name: 'Campfire',
    emoji: '🔥',
    description: 'Crackling fire sounds',
    type: 'generated',
    generatorType: 'campfire',
    category: 'nature',
  },
  {
    id: 'drone',
    name: 'Calm Drone',
    emoji: '🎵',
    description: 'Peaceful ambient tone',
    type: 'generated',
    generatorType: 'drone',
    category: 'ambient',
  },
  {
    id: 'binaural-focus',
    name: 'Focus Beats',
    emoji: '🧠',
    description: '40Hz for concentration',
    type: 'generated',
    generatorType: 'binaural',
    category: 'binaural',
  },
];

export const SOUND_CATEGORIES = [
  { id: 'nature', name: 'Nature', emoji: '🌿' },
  { id: 'ambient', name: 'Ambient', emoji: '🎵' },
  { id: 'binaural', name: 'Binaural', emoji: '🧠' },
];

// Web Audio API soothing sound generator
class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private intervals: number[] = [];
  private isPlaying: boolean = false;
  private currentType: string | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Create filtered noise for natural sounds
  private createFilteredNoise(type: 'rain' | 'wind' | 'ocean'): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Brown noise base (smoother)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    
    if (type === 'rain') {
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
    } else if (type === 'wind') {
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.3;
    } else { // ocean
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.7;
    }

    return { source, filter };
  }

  playRain(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.4;

    // Main rain layer
    const { source: rain1, filter: filter1 } = this.createFilteredNoise('rain');
    rain1.connect(filter1);
    filter1.connect(this.gainNode);
    rain1.start();
    this.nodes.push(rain1, filter1);

    // Softer background layer
    const { source: rain2, filter: filter2 } = this.createFilteredNoise('rain');
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.3;
    rain2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.gainNode);
    rain2.start();
    this.nodes.push(rain2, filter2, gain2);

    this.gainNode.connect(ctx.destination);
  }

  playOcean(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.5;

    const { source, filter } = this.createFilteredNoise('ocean');
    
    // Create wave modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // Very slow wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, lfo, lfoGain);
  }

  playWind(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.35;

    const { source, filter } = this.createFilteredNoise('wind');
    
    // Gentle wind modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Secondary LFO for volume swell
    const volLfo = ctx.createOscillator();
    volLfo.frequency.value = 0.08;
    const volLfoGain = ctx.createGain();
    volLfoGain.gain.value = 0.15;
    volLfo.connect(volLfoGain);
    volLfoGain.connect(this.gainNode.gain);
    volLfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, lfo, lfoGain, volLfo, volLfoGain);
  }

  playCampfire(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3;

    // Base crackle (filtered noise)
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Sparse crackle pattern
      if (Math.random() > 0.97) {
        output[i] = (Math.random() * 2 - 1) * 0.8;
      } else {
        output[i] = (Math.random() * 2 - 1) * 0.1;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    // Low rumble
    const rumble = ctx.createOscillator();
    rumble.frequency.value = 60;
    rumble.type = 'sine';
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.05;
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.gainNode);
    rumble.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, rumble, rumbleGain);
  }

  playDrone(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.2;

    // Create harmonious drone with multiple frequencies
    const frequencies = [55, 82.5, 110, 165]; // A1 and harmonics
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const oscGain = ctx.createGain();
      oscGain.gain.value = 1 / (i + 1); // Decreasing volume for harmonics
      
      // Slight detune for warmth
      const detune = ctx.createOscillator();
      detune.frequency.value = freq * 1.003;
      detune.type = 'sine';
      const detuneGain = ctx.createGain();
      detuneGain.gain.value = 0.3 / (i + 1);
      
      osc.connect(oscGain);
      detune.connect(detuneGain);
      oscGain.connect(this.gainNode);
      detuneGain.connect(this.gainNode);
      
      osc.start();
      detune.start();
      
      this.nodes.push(osc, oscGain, detune, detuneGain);
    });

    this.gainNode.connect(ctx.destination);
  }

  playBinaural(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.25;

    // 40Hz gamma waves for focus
    const baseFreq = 200;
    const beatFreq = 40;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    
    oscLeft.frequency.value = baseFreq;
    oscRight.frequency.value = baseFreq + beatFreq;
    
    oscLeft.type = 'sine';
    oscRight.type = 'sine';

    const panLeft = ctx.createStereoPanner();
    const panRight = ctx.createStereoPanner();
    
    panLeft.pan.value = -1;
    panRight.pan.value = 1;

    oscLeft.connect(panLeft);
    oscRight.connect(panRight);
    
    panLeft.connect(this.gainNode);
    panRight.connect(this.gainNode);
    
    this.gainNode.connect(ctx.destination);

    oscLeft.start();
    oscRight.start();

    this.nodes.push(oscLeft, oscRight, panLeft, panRight);
  }

  play(type: string, volume: number) {
    this.stop();
    
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    switch (type) {
      case 'rain':
        this.playRain(volume);
        break;
      case 'ocean':
        this.playOcean(volume);
        break;
      case 'wind':
        this.playWind(volume);
        break;
      case 'campfire':
        this.playCampfire(volume);
        break;
      case 'drone':
        this.playDrone(volume);
        break;
      case 'binaural':
        this.playBinaural(volume);
        break;
    }

    this.isPlaying = true;
    this.currentType = type;
  }

  stop() {
    this.nodes.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.nodes = [];

    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.currentType = null;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      const multiplier = this.currentType === 'binaural' ? 0.25 : 
                         this.currentType === 'drone' ? 0.2 : 0.4;
      this.gainNode.gain.value = volume * multiplier;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentType(): string | null {
    return this.currentType;
  }
}

// Audio manager class
class AmbientAudioManager {
  private soundGenerator: SoundGenerator | null = null;
  private currentSoundId: string | null = null;
  private volume: number = 0.5;
  private isPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
      this.soundGenerator = new SoundGenerator();
    }
  }

  private loadSettings() {
    const savedVolume = localStorage.getItem('ambientVolume');
    const savedSound = localStorage.getItem('ambientSound');
    
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
    }
    if (savedSound) {
      this.currentSoundId = savedSound;
    }
  }

  private saveSettings() {
    localStorage.setItem('ambientVolume', this.volume.toString());
    if (this.currentSoundId) {
      localStorage.setItem('ambientSound', this.currentSoundId);
    }
  }

  play(soundId: string) {
    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
    if (!sound || !this.soundGenerator) return;

    this.stop();
    this.currentSoundId = soundId;
    this.soundGenerator.play(sound.generatorType, this.volume);
    this.isPlaying = true;
    this.saveSettings();
  }

  pause() {
    if (this.soundGenerator) {
      this.soundGenerator.stop();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.soundGenerator) {
      this.soundGenerator.stop();
      this.isPlaying = false;
    }
  }

  toggle(soundId?: string) {
    const targetSound = soundId || this.currentSoundId;
    if (!targetSound) return;

    if (this.isPlaying && this.currentSoundId === targetSound) {
      this.pause();
    } else {
      this.play(targetSound);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.soundGenerator) {
      this.soundGenerator.setVolume(this.volume);
    }
    this.saveSettings();
  }

  getVolume(): number {
    return this.volume;
  }

  getCurrentSound(): string | null {
    return this.currentSoundId;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton instance
let audioManager: AmbientAudioManager | null = null;

export function getAudioManager(): AmbientAudioManager {
  if (!audioManager) {
    audioManager = new AmbientAudioManager();
  }
  return audioManager;
}
