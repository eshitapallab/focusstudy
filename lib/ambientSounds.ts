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

  private rampGain(param: AudioParam, target: number, timeSeconds = 0.25) {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(target, now + timeSeconds);
    } catch {
      param.value = target;
    }
  }

  private createWhiteNoiseSource(): AudioBufferSourceNode {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  private createBrownNoiseSource(): AudioBufferSourceNode {
    const ctx = this.getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      // Keep this conservative to avoid harsh clipping on phone speakers
      output[i] *= 1.6;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
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
      // Slightly lower cut to reduce harsh hiss
      filter.frequency.value = 750;
      filter.Q.value = 0.4;
    } else if (type === 'wind') {
      filter.type = 'bandpass';
      // Softer band and lower Q for a smoother wind
      filter.frequency.value = 320;
      filter.Q.value = 0.25;
    } else { // ocean
      filter.type = 'lowpass';
      filter.frequency.value = 450;
      filter.Q.value = 0.55;
    }

    return { source, filter };
  }

  playRain(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Main rain layer
    const { source: rain1, filter: filter1 } = this.createFilteredNoise('rain');
    // Gentle roll-off to avoid harsh highs
    const topFilter = ctx.createBiquadFilter();
    topFilter.type = 'lowpass';
    topFilter.frequency.value = 9000;
    topFilter.Q.value = 0.7;
    rain1.connect(filter1);
    filter1.connect(topFilter);
    topFilter.connect(this.gainNode);
    rain1.start();
    this.nodes.push(rain1, filter1, topFilter);

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
    this.rampGain(this.gainNode.gain, volume * 0.35, 0.35);
  }

  playOcean(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    const { source, filter } = this.createFilteredNoise('ocean');
    
    // Create wave modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1; // Very slow wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, lfo, lfoGain);
    this.rampGain(this.gainNode.gain, volume * 0.42, 0.4);
  }

  playWind(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    const { source, filter } = this.createFilteredNoise('wind');
    
    // Gentle wind modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Secondary LFO for volume swell
    const volLfo = ctx.createOscillator();
    volLfo.frequency.value = 0.08;
    const volLfoGain = ctx.createGain();
    volLfoGain.gain.value = 0.12;
    volLfo.connect(volLfoGain);
    volLfoGain.connect(this.gainNode.gain);
    volLfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, lfo, lfoGain, volLfo, volLfoGain);
    this.rampGain(this.gainNode.gain, volume * 0.28, 0.35);
  }

  playCampfire(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

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

    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 6000;
    soften.Q.value = 0.7;

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
    filter.connect(soften);
    soften.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, filter, soften, rumble, rumbleGain);
    this.rampGain(this.gainNode.gain, volume * 0.24, 0.35);
  }

  playDrone(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

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
    this.rampGain(this.gainNode.gain, volume * 0.18, 0.5);
  }

  playBinaural(volume: number) {
    const ctx = this.getAudioContext();
    
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

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

    this.rampGain(this.gainNode.gain, volume * 0.18, 0.6);
  }

  playThunder(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Base rain (soft)
    const { source: rain, filter: rainFilter } = this.createFilteredNoise('rain');
    const topFilter = ctx.createBiquadFilter();
    topFilter.type = 'lowpass';
    topFilter.frequency.value = 8500;
    topFilter.Q.value = 0.7;
    rain.connect(rainFilter);
    rainFilter.connect(topFilter);
    topFilter.connect(this.gainNode);
    rain.start();
    this.nodes.push(rain, rainFilter, topFilter);

    const createThunder = () => {
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      const rumbleFilter = ctx.createBiquadFilter();

      rumble.type = 'sine';
      rumble.frequency.value = 35 + Math.random() * 18;
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 180;
      rumbleFilter.Q.value = 0.8;

      const now = ctx.currentTime;
      rumbleGain.gain.setValueAtTime(0.0001, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.12 + Math.random() * 0.08, now + 0.25);
      rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + Math.random() * 2.0);

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.gainNode!);

      rumble.start(now);
      rumble.stop(now + 5);

      this.nodes.push(rumble, rumbleFilter, rumbleGain);
    };

    const scheduleThunder = () => {
      createThunder();
      const nextDelay = 18000 + Math.random() * 25000;
      const id = window.setTimeout(scheduleThunder, nextDelay);
      this.intervals.push(id);
    };

    // Wait a bit before first thunder
    const firstId = window.setTimeout(scheduleThunder, 6000 + Math.random() * 7000);
    this.intervals.push(firstId);

    this.gainNode.connect(ctx.destination);
    this.rampGain(this.gainNode.gain, volume * 0.32, 0.45);
  }

  playStream(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Use noise but make it smooth and watery
    const source = this.createBrownNoiseSource();

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900;
    band.Q.value = 0.6;

    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 6500;
    soften.Q.value = 0.7;

    // Gentle modulation for bubbling
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(band.frequency);
    lfo.start();

    source.connect(band);
    band.connect(soften);
    soften.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, band, soften, lfo, lfoGain);
    this.rampGain(this.gainNode.gain, volume * 0.26, 0.4);
  }

  playForest(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Wind through trees
    const { source: wind, filter: windFilter } = this.createFilteredNoise('wind');
    const windSoft = ctx.createBiquadFilter();
    windSoft.type = 'lowpass';
    windSoft.frequency.value = 7000;
    windSoft.Q.value = 0.7;

    // Slow modulation for natural variation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();

    wind.connect(windFilter);
    windFilter.connect(windSoft);
    windSoft.connect(this.gainNode);
    wind.start();

    // Rustling leaves (higher band, low level)
    const leaves = this.createBrownNoiseSource();
    const leavesBand = ctx.createBiquadFilter();
    leavesBand.type = 'bandpass';
    leavesBand.frequency.value = 1200;
    leavesBand.Q.value = 0.4;
    const leavesGain = ctx.createGain();
    leavesGain.gain.value = 0.07;
    leaves.connect(leavesBand);
    leavesBand.connect(leavesGain);
    leavesGain.connect(this.gainNode);
    leaves.start();

    this.gainNode.connect(ctx.destination);
    this.nodes.push(wind, windFilter, windSoft, lfo, lfoGain, leaves, leavesBand, leavesGain);
    this.rampGain(this.gainNode.gain, volume * 0.22, 0.45);
  }

  playBirds(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Soft background air
    const { source: ambient, filter: ambientFilter } = this.createFilteredNoise('wind');
    ambientFilter.frequency.value = 520;
    const ambientSoft = ctx.createBiquadFilter();
    ambientSoft.type = 'lowpass';
    ambientSoft.frequency.value = 6500;
    ambientSoft.Q.value = 0.7;

    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.05;
    ambient.connect(ambientFilter);
    ambientFilter.connect(ambientSoft);
    ambientSoft.connect(ambientGain);
    ambientGain.connect(this.gainNode);
    ambient.start();

    const createChirp = () => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const base = 1400 + Math.random() * 1600;
      const now = ctx.currentTime;
      const dur = 0.18 + Math.random() * 0.12;

      // Quick upward sweep for a more natural chirp
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * (1.12 + Math.random() * 0.08), now + dur * 0.35);
      osc.frequency.exponentialRampToValueAtTime(base * (0.92 + Math.random() * 0.05), now + dur);

      filter.type = 'bandpass';
      filter.frequency.value = base;
      filter.Q.value = 3.5;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode!);

      osc.start(now);
      osc.stop(now + dur + 0.05);

      this.nodes.push(osc, filter, gain);
    };

    const scheduleChirp = () => {
      // Sometimes do 0-2 chirps per "moment" to feel natural
      const count = Math.random() < 0.55 ? 1 : Math.random() < 0.25 ? 2 : 0;
      for (let i = 0; i < count; i++) {
        window.setTimeout(() => createChirp(), i * (180 + Math.random() * 200));
      }
      const nextDelay = 4500 + Math.random() * 9000;
      const id = window.setTimeout(scheduleChirp, nextDelay);
      this.intervals.push(id);
    };

    const firstId = window.setTimeout(scheduleChirp, 2500 + Math.random() * 3500);
    this.intervals.push(firstId);

    this.gainNode.connect(ctx.destination);
    this.nodes.push(ambient, ambientFilter, ambientSoft, ambientGain);
    this.rampGain(this.gainNode.gain, volume * 0.22, 0.5);
  }

  playNight(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Base ambience
    const { source: ambient, filter: ambientFilter } = this.createFilteredNoise('wind');
    ambientFilter.frequency.value = 360;
    const ambientSoft = ctx.createBiquadFilter();
    ambientSoft.type = 'lowpass';
    ambientSoft.frequency.value = 5200;
    ambientSoft.Q.value = 0.7;
    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.035;
    ambient.connect(ambientFilter);
    ambientFilter.connect(ambientSoft);
    ambientSoft.connect(ambientGain);
    ambientGain.connect(this.gainNode);
    ambient.start();

    const createCricket = () => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const base = 2600 + Math.random() * 1200;
      const now = ctx.currentTime;
      const dur = 0.06 + Math.random() * 0.09;

      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * (0.88 + Math.random() * 0.06), now + dur);

      filter.type = 'bandpass';
      filter.frequency.value = base;
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode!);

      osc.start(now);
      osc.stop(now + dur + 0.03);

      this.nodes.push(osc, filter, gain);
    };

    const scheduleCricket = () => {
      if (Math.random() < 0.7) createCricket();
      const nextDelay = 1200 + Math.random() * 3200;
      const id = window.setTimeout(scheduleCricket, nextDelay);
      this.intervals.push(id);
    };

    const firstId = window.setTimeout(scheduleCricket, 1000 + Math.random() * 2500);
    this.intervals.push(firstId);

    this.gainNode.connect(ctx.destination);
    this.nodes.push(ambient, ambientFilter, ambientSoft, ambientGain);
    this.rampGain(this.gainNode.gain, volume * 0.18, 0.55);
  }

  playCoffeeShop(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    // Base chatter: filtered noise with slow movement (feels like distant crowd)
    const chatter = this.createBrownNoiseSource();
    const chatterBand = ctx.createBiquadFilter();
    chatterBand.type = 'bandpass';
    chatterBand.frequency.value = 750;
    chatterBand.Q.value = 0.35;
    const chatterSoft = ctx.createBiquadFilter();
    chatterSoft.type = 'lowpass';
    chatterSoft.frequency.value = 5200;
    chatterSoft.Q.value = 0.7;
    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.18;

    // Gentle movement in the crowd tone
    const chatterLfo = ctx.createOscillator();
    chatterLfo.type = 'sine';
    chatterLfo.frequency.value = 0.06;
    const chatterLfoGain = ctx.createGain();
    chatterLfoGain.gain.value = 140;
    chatterLfo.connect(chatterLfoGain);
    chatterLfoGain.connect(chatterBand.frequency);
    chatterLfo.start();

    chatter.connect(chatterBand);
    chatterBand.connect(chatterSoft);
    chatterSoft.connect(chatterGain);
    chatterGain.connect(this.gainNode);
    chatter.start();

    // Soft espresso / HVAC hum
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 90;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.02;
    hum.connect(humGain);
    humGain.connect(this.gainNode);
    hum.start();

    // Occasional subtle clink (very quiet, not distracting)
    const createClink = () => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const now = ctx.currentTime;
      const freq = 1400 + Math.random() * 1200;
      osc.frequency.value = freq;
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 6;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode!);

      osc.start(now);
      osc.stop(now + 0.12);

      this.nodes.push(osc, filter, gain);
    };

    const scheduleClink = () => {
      if (Math.random() < 0.35) createClink();
      const nextDelay = 12000 + Math.random() * 22000;
      const id = window.setTimeout(scheduleClink, nextDelay);
      this.intervals.push(id);
    };
    const clinkId = window.setTimeout(scheduleClink, 9000 + Math.random() * 12000);
    this.intervals.push(clinkId);

    this.gainNode.connect(ctx.destination);
    this.nodes.push(
      chatter,
      chatterBand,
      chatterSoft,
      chatterGain,
      chatterLfo,
      chatterLfoGain,
      hum,
      humGain
    );
    this.rampGain(this.gainNode.gain, volume * 0.22, 0.55);
  }

  playWhiteNoise(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    const source = this.createWhiteNoiseSource();
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 12000;
    soften.Q.value = 0.7;

    // Slight highpass to remove rumble
    const clean = ctx.createBiquadFilter();
    clean.type = 'highpass';
    clean.frequency.value = 120;
    clean.Q.value = 0.7;

    source.connect(clean);
    clean.connect(soften);
    soften.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, clean, soften);
    this.rampGain(this.gainNode.gain, volume * 0.20, 0.5);
  }

  playBrownNoise(volume: number) {
    const ctx = this.getAudioContext();

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    const source = this.createBrownNoiseSource();
    const soften = ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 5000;
    soften.Q.value = 0.7;

    // Gentle highpass to prevent speaker rumble
    const clean = ctx.createBiquadFilter();
    clean.type = 'highpass';
    clean.frequency.value = 60;
    clean.Q.value = 0.7;

    source.connect(clean);
    clean.connect(soften);
    soften.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();

    this.nodes.push(source, clean, soften);
    this.rampGain(this.gainNode.gain, volume * 0.18, 0.55);
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
      const multipliers: Record<string, number> = {
        rain: 0.35,
        thunder: 0.32,
        ocean: 0.42,
        stream: 0.26,
        wind: 0.28,
        forest: 0.22,
        birds: 0.22,
        campfire: 0.24,
        night: 0.18,
        coffeeshop: 0.22,
        whitenoise: 0.20,
        brownnoise: 0.18,
        drone: 0.18,
        binaural: 0.18,
      };
      const multiplier = this.currentType ? (multipliers[this.currentType] ?? 0.25) : 0.25;
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
