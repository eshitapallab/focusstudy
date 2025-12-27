// Ambient sound configurations for focus sessions
// Uses free, royalty-free audio sources

export interface AmbientSound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Using URLs from free sound libraries
  url: string;
  category: 'nature' | 'urban' | 'white-noise' | 'music';
}

// Note: These are placeholder URLs - in production, you'd host these files
// or use a service like Freesound API
export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    description: 'Gentle rain sounds',
    url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112844d.mp3',
    category: 'nature',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    description: 'Birds and rustling leaves',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3',
    category: 'nature',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    emoji: '🌊',
    description: 'Calming ocean waves',
    url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3',
    category: 'nature',
  },
  {
    id: 'fire',
    name: 'Fireplace',
    emoji: '🔥',
    description: 'Crackling fireplace',
    url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_0917c60a93.mp3',
    category: 'nature',
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    emoji: '☕',
    description: 'Ambient cafe chatter',
    url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_db2dc5e4a9.mp3',
    category: 'urban',
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    emoji: '📻',
    description: 'Classic white noise',
    url: 'https://cdn.pixabay.com/audio/2022/03/12/audio_b4f7e5a4c8.mp3',
    category: 'white-noise',
  },
  {
    id: 'thunder',
    name: 'Thunderstorm',
    emoji: '⛈️',
    description: 'Rain with thunder',
    url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_2138c65554.mp3',
    category: 'nature',
  },
  {
    id: 'wind',
    name: 'Wind',
    emoji: '💨',
    description: 'Gentle wind sounds',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1bac.mp3',
    category: 'nature',
  },
];

export const SOUND_CATEGORIES = [
  { id: 'nature', name: 'Nature', emoji: '🌿' },
  { id: 'urban', name: 'Urban', emoji: '🏙️' },
  { id: 'white-noise', name: 'White Noise', emoji: '📻' },
  { id: 'music', name: 'Music', emoji: '🎵' },
];

// Audio manager class for handling playback
class AmbientAudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private currentSoundId: string | null = null;
  private volume: number = 0.5;
  private isPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
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
    if (!sound) return;

    // If same sound, just resume
    if (this.audioElement && this.currentSoundId === soundId) {
      this.audioElement.play();
      this.isPlaying = true;
      return;
    }

    // Stop current audio
    this.stop();

    // Create new audio element
    this.audioElement = new Audio(sound.url);
    this.audioElement.loop = true;
    this.audioElement.volume = this.volume;
    this.currentSoundId = soundId;
    
    // Handle errors gracefully
    this.audioElement.onerror = () => {
      console.warn(`Failed to load ambient sound: ${sound.name}`);
      this.isPlaying = false;
    };

    this.audioElement.play().then(() => {
      this.isPlaying = true;
      this.saveSettings();
    }).catch(err => {
      console.warn('Autoplay prevented:', err);
      this.isPlaying = false;
    });
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
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
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
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
