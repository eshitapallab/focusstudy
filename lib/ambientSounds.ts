// Ambient sound configurations for focus sessions
// Uses Web Audio API to generate soothing sounds - no external dependencies

export interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'generated';
  generatorType: 'rain' | 'ocean' | 'wind' | 'campfire' | 'binaural' | 'drone' | 'thunder' | 'coffeeshop' | 'whitenoise' | 'brownnoise' | 'birds' | 'forest' | 'stream' | 'night';
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
    id: 'thunder',
    name: 'Thunderstorm',
    emoji: '⛈️',
    description: 'Rain with distant thunder',
    type: 'generated',
    generatorType: 'thunder',
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
    id: 'stream',
    name: 'Flowing Stream',
    emoji: '💧',
    description: 'Gentle water stream',
    type: 'generated',
    generatorType: 'stream',
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
    id: 'forest',
    name: 'Forest Ambience',
    emoji: '🌲',
    description: 'Wind and rustling leaves',
    type: 'generated',
    generatorType: 'forest',
    category: 'nature',
  },
  {
    id: 'birds',
    name: 'Morning Birds',
    emoji: '🐦',
    description: 'Peaceful bird chirping',
    type: 'generated',
    generatorType: 'birds',
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
    id: 'night',
    name: 'Night Crickets',
    emoji: '🌙',
    description: 'Peaceful night sounds',
    type: 'generated',
    generatorType: 'night',
    category: 'nature',
  },
  {
    id: 'coffeeshop',
    name: 'Coffee Shop',
    emoji: '☕',
    description: 'Ambient cafe chatter',
    type: 'generated',
    generatorType: 'coffeeshop',
    category: 'ambient',
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    emoji: '⚪',
    description: 'Pure white noise',
    type: 'generated',
    generatorType: 'whitenoise',
    category: 'ambient',
  },
  {
    id: 'brownnoise',
    name: 'Brown Noise',
    emoji: '🟤',
    description: 'Deep brown noise',
    type: 'generated',
    generatorType: 'brownnoise',
    category: 'ambient',
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
      oscGain.connect(this.gainNode!);
      detuneGain.connect(this.gainNode!);
      
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

  playThunder(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.4;

    // Base rain
    const { source: rain, filter: rainFilter } = this.createFilteredNoise('rain');
    rain.connect(rainFilter);
    rainFilter.connect(this.gainNode);
    rain.start();
    this.nodes.push(rain, rainFilter);

    // Thunder rumbles at random intervals
    const createThunder = () => {
      const thunder = ctx.createOscillator();
      const thunderGain = ctx.createGain();
      const thunderFilter = ctx.createBiquadFilter();
      
      thunder.frequency.value = 40 + Math.random() * 20;
      thunder.type = 'sine';
      thunderFilter.type = 'lowpass';
      thunderFilter.frequency.value = 200;
      
      thunderGain.gain.value = 0;
      thunderGain.gain.setValueAtTime(0, ctx.currentTime);
      thunderGain.gain.linearRampToValueAtTime(0.3 + Math.random() * 0.2, ctx.currentTime + 0.2);
      thunderGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2 + Math.random() * 2);
      
      thunder.connect(thunderFilter);
      thunderFilter.connect(thunderGain);
      thunderGain.connect(this.gainNode!);
      thunder.start(ctx.currentTime);
      thunder.stop(ctx.currentTime + 4);
    };

    // Random thunder every 10-30 seconds
    const scheduleThunder = () => {
      createThunder();
      const nextDelay = 10000 + Math.random() * 20000;
      const id = window.setTimeout(scheduleThunder, nextDelay);
      this.intervals.push(id);
    };
    scheduleThunder();

    this.gainNode.connect(ctx.destination);
  }

  playStream(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.35;

    // Higher frequency water noise
    const { source, filter } = this.createFilteredNoise('ocean');
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;

    // Faster modulation for bubbling
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, lfo, lfoGain);
  }

  playForest(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3;

    // Wind through trees
    const { source: wind, filter: windFilter } = this.createFilteredNoise('wind');
    wind.connect(windFilter);
    windFilter.connect(this.gainNode);
    wind.start();
    this.nodes.push(wind, windFilter);

    // Rustling leaves (higher frequency)
    const { source: leaves, filter: leavesFilter } = this.createFilteredNoise('wind');
    leavesFilter.frequency.value = 800;
    const leavesGain = ctx.createGain();
    leavesGain.gain.value = 0.2;
    leaves.connect(leavesFilter);
    leavesFilter.connect(leavesGain);
    leavesGain.connect(this.gainNode);
    leaves.start();
    this.nodes.push(leaves, leavesFilter, leavesGain);

    this.gainNode.connect(ctx.destination);
  }

  playBirds(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3;

    // Background ambience
    const { source: ambient, filter: ambientFilter } = this.createFilteredNoise('wind');
    ambientFilter.frequency.value = 600;
    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.1;
    ambient.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(this.gainNode);
    ambient.start();
    this.nodes.push(ambient, ambientFilter, ambientGain);

    // Bird chirps at random intervals
    const createChirp = () => {
      const chirp = ctx.createOscillator();
      const chirpGain = ctx.createGain();
      const chirpFilter = ctx.createBiquadFilter();
      
      const baseFreq = 1500 + Math.random() * 1500;
      chirp.frequency.value = baseFreq;
      chirp.type = 'sine';
      
      chirpFilter.type = 'bandpass';
      chirpFilter.frequency.value = baseFreq;
      chirpFilter.Q.value = 2;
      
      chirpGain.gain.value = 0;
      const now = ctx.currentTime;
      chirpGain.gain.setValueAtTime(0, now);
      chirpGain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      chirpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15 + Math.random() * 0.1);
      
      chirp.connect(chirpFilter);
      chirpFilter.connect(chirpGain);
      chirpGain.connect(this.gainNode!);
      chirp.start(now);
      chirp.stop(now + 0.3);
    };

    const scheduleChirp = () => {
      createChirp();
      const nextDelay = 1000 + Math.random() * 4000;
      const id = window.setTimeout(scheduleChirp, nextDelay);
      this.intervals.push(id);
    };
    scheduleChirp();

    this.gainNode.connect(ctx.destination);
  }

  playNight(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.25;

    // Base night ambience
    const { source: ambient, filter: ambientFilter } = this.createFilteredNoise('wind');
    ambientFilter.frequency.value = 400;
    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.05;
    ambient.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(this.gainNode);
    ambient.start();
    this.nodes.push(ambient, ambientFilter, ambientGain);

    // Cricket chirps
    const createCricket = () => {
      const cricket = ctx.createOscillator();
      const cricketGain = ctx.createGain();
      
      cricket.frequency.value = 3000 + Math.random() * 1000;
      cricket.type = 'square';
      
      cricketGain.gain.value = 0;
      const now = ctx.currentTime;
      const duration = 0.05 + Math.random() * 0.1;
      
      cricketGain.gain.setValueAtTime(0, now);
      cricketGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      cricketGain.gain.setValueAtTime(0.08, now + duration - 0.01);
      cricketGain.gain.linearRampToValueAtTime(0, now + duration);
      
      cricket.connect(cricketGain);
      cricketGain.connect(this.gainNode!);
      cricket.start(now);
      cricket.stop(now + duration);
    };

    const scheduleCricket = () => {
      createCricket();
      const nextDelay = 200 + Math.random() * 800;
      const id = window.setTimeout(scheduleCricket, nextDelay);
      this.intervals.push(id);
    };
    scheduleCricket();

    this.gainNode.connect(ctx.destination);
  }

  playCoffeeShop(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3;

    // Base chatter (filtered pink noise)
    const { source: chatter, filter: chatterFilter } = this.createFilteredNoise('wind');
    chatterFilter.type = 'bandpass';
    chatterFilter.frequency.value = 600;
    chatterFilter.Q.value = 0.4;
    
    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.4;
    
    chatter.connect(chatterFilter);
    chatterFilter.connect(chatterGain);
    chatterGain.connect(this.gainNode);
    chatter.start();
    this.nodes.push(chatter, chatterFilter, chatterGain);

    // Low rumble (espresso machine)
    const rumble = ctx.createOscillator();
    rumble.frequency.value = 100;
    rumble.type = 'sawtooth';
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.03;
    rumble.connect(rumbleGain);
    rumbleGain.connect(this.gainNode);
    rumble.start();
    this.nodes.push(rumble, rumbleGain);

    this.gainNode.connect(ctx.destination);
  }

  playWhiteNoise(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.3;

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source);
  }

  playBrownNoise(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume * 0.4;

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

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source);
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
      case 'thunder':
        this.playThunder(volume);
        break;
      case 'ocean':
        this.playOcean(volume);
        break;
      case 'stream':
        this.playStream(volume);
        break;
      case 'wind':
        this.playWind(volume);
        break;
      case 'forest':
        this.playForest(volume);
        break;
      case 'birds':
        this.playBirds(volume);
        break;
      case 'campfire':
        this.playCampfire(volume);
        break;
      case 'night':
        this.playNight(volume);
        break;
      case 'coffeeshop':
        this.playCoffeeShop(volume);
        break;
      case 'whitenoise':
        this.playWhiteNoise(volume);
        break;
      case 'brownnoise':
        this.playBrownNoise(volume);
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
