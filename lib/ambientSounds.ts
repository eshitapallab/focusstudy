// Ambient sound configurations for focus sessions
// Uses Web Audio API to generate sounds - no external dependencies

export interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'generated' | 'url';
  generatorType?: 'white' | 'pink' | 'brown' | 'binaural';
  url?: string;
  category: 'noise' | 'nature' | 'binaural';
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'white-noise',
    name: 'White Noise',
    emoji: '📻',
    description: 'Classic white noise for focus',
    type: 'generated',
    generatorType: 'white',
    category: 'noise',
  },
  {
    id: 'pink-noise',
    name: 'Pink Noise',
    emoji: '🌸',
    description: 'Softer, balanced noise',
    type: 'generated',
    generatorType: 'pink',
    category: 'noise',
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    emoji: '🟤',
    description: 'Deep, rumbling noise',
    type: 'generated',
    generatorType: 'brown',
    category: 'noise',
  },
  {
    id: 'binaural-focus',
    name: 'Focus Beats',
    emoji: '🧠',
    description: '40Hz gamma for concentration',
    type: 'generated',
    generatorType: 'binaural',
    category: 'binaural',
  },
];

export const SOUND_CATEGORIES = [
  { id: 'noise', name: 'Noise', emoji: '🔊' },
  { id: 'binaural', name: 'Binaural', emoji: '🧠' },
];

// Web Audio API sound generator
class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private oscillatorNodes: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private currentType: string | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private createWhiteNoise(): AudioBuffer {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createPinkNoise(): AudioBuffer {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createBrownNoise(): AudioBuffer {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    return buffer;
  }

  playNoise(type: 'white' | 'pink' | 'brown', volume: number) {
    this.stop();
    
    const ctx = this.getAudioContext();
    
    // Resume context if suspended (for autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let buffer: AudioBuffer;
    switch (type) {
      case 'pink':
        buffer = this.createPinkNoise();
        break;
      case 'brown':
        buffer = this.createBrownNoise();
        break;
      default:
        buffer = this.createWhiteNoise();
    }

    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume;

    this.noiseNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    this.noiseNode.start();
    this.isPlaying = true;
    this.currentType = type;
  }

  playBinaural(volume: number) {
    this.stop();
    
    const ctx = this.getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3; // Binaural should be quieter

    // Create two oscillators with slightly different frequencies
    // 40Hz difference for gamma waves (focus/concentration)
    const baseFreq = 200;
    const beatFreq = 40;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    
    oscLeft.frequency.value = baseFreq;
    oscRight.frequency.value = baseFreq + beatFreq;
    
    oscLeft.type = 'sine';
    oscRight.type = 'sine';

    // Create stereo panner for each oscillator
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

    this.oscillatorNodes = [oscLeft, oscRight];
    this.isPlaying = true;
    this.currentType = 'binaural';
  }

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }

    this.oscillatorNodes.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
      osc.disconnect();
    });
    this.oscillatorNodes = [];

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
    this.currentType = null;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      const adjustedVolume = this.currentType === 'binaural' ? volume * 0.3 : volume;
      this.gainNode.gain.value = adjustedVolume;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentType(): string | null {
    return this.currentType;
  }
}

// Audio manager class for handling playback
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

    // Stop current audio
    this.stop();

    this.currentSoundId = soundId;

    if (sound.type === 'generated' && sound.generatorType) {
      if (sound.generatorType === 'binaural') {
        this.soundGenerator.playBinaural(this.volume);
      } else {
        this.soundGenerator.playNoise(sound.generatorType, this.volume);
      }
      this.isPlaying = true;
      this.saveSettings();
    }
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
