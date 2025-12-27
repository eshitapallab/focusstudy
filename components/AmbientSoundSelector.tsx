'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AMBIENT_SOUNDS, getAudioManager, SOUND_CATEGORIES } from '@/lib/ambientSounds';

interface AmbientSoundSelectorProps {
  compact?: boolean;
  onSoundChange?: (soundId: string | null) => void;
}

export default function AmbientSoundSelector({ compact = false, onSoundChange }: AmbientSoundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const audioManager = getAudioManager();

  // Sync state with audio manager
  useEffect(() => {
    setCurrentSound(audioManager.getCurrentSound());
    setIsPlaying(audioManager.getIsPlaying());
    setVolume(audioManager.getVolume());
  }, []);

  const handleSoundSelect = useCallback((soundId: string) => {
    if (currentSound === soundId && isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      audioManager.play(soundId);
      setCurrentSound(soundId);
      setIsPlaying(true);
      onSoundChange?.(soundId);
    }
  }, [currentSound, isPlaying, audioManager, onSoundChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  }, [audioManager]);

  const handleStop = useCallback(() => {
    audioManager.stop();
    setIsPlaying(false);
    setCurrentSound(null);
    onSoundChange?.(null);
  }, [audioManager, onSoundChange]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else if (currentSound) {
      audioManager.play(currentSound);
      setIsPlaying(true);
    }
  }, [isPlaying, currentSound, audioManager]);

  const filteredSounds = selectedCategory
    ? AMBIENT_SOUNDS.filter(s => s.category === selectedCategory)
    : AMBIENT_SOUNDS;

  const currentSoundData = AMBIENT_SOUNDS.find(s => s.id === currentSound);

  // Compact mode - just a button that opens a panel
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            isPlaying
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Ambient Sounds"
        >
          <span className="text-lg">{isPlaying ? (currentSoundData?.emoji || '🎵') : '🎧'}</span>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/30 dark:bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            {/* Mobile: Bottom sheet, Desktop: Dropdown */}
            <div className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 right-0 sm:left-auto sm:right-0 sm:mt-2 w-full sm:w-80 bg-white dark:bg-gray-900 sm:rounded-2xl rounded-t-3xl border-t sm:border border-gray-200 dark:border-gray-700 shadow-2xl z-[80] overflow-hidden max-h-[70vh] sm:max-h-[500px]">
              {/* Mobile handle */}
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-2 sm:hidden" />
              
              <div className="p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">🎵 Ambient Sounds</h3>
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <button
                        onClick={handleStop}
                        className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 dark:text-gray-500 p-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Category filter - horizontal scroll on mobile */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                      !selectedCategory
                        ? 'bg-primary/20 text-primary dark:bg-cyan-500/30 dark:text-cyan-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {SOUND_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-primary/20 text-primary dark:bg-cyan-500/30 dark:text-cyan-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Sound grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {filteredSounds.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound.id)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${
                        currentSound === sound.id && isPlaying
                          ? 'bg-primary/10 dark:bg-cyan-500/20 ring-2 ring-primary/50 dark:ring-cyan-500/50'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={sound.description}
                    >
                      <span className="text-2xl mb-1">{sound.emoji}</span>
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate w-full text-center font-medium">
                        {sound.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-gray-500 dark:text-gray-400">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:dark:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:shadow-md"
                  />
                  <span className="text-gray-500 dark:text-gray-400">🔊</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-white/80 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🎧</span> Ambient Sounds
        </h3>
        {isPlaying && currentSoundData && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Now playing: {currentSoundData.emoji} {currentSoundData.name}
            </span>
            <button
              onClick={togglePlayPause}
              className="p-1.5 bg-gray-100 dark:bg-slate-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 bg-red-100 dark:bg-red-500/20 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
            >
              ⏹️
            </button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition-colors ${
            !selectedCategory
              ? 'bg-primary/20 text-primary dark:bg-cyan-500/20 dark:text-cyan-300 border border-primary/30 dark:border-cyan-500/30'
              : 'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50'
          }`}
        >
          All Sounds
        </button>
        {SOUND_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary/20 text-primary dark:bg-cyan-500/20 dark:text-cyan-300 border border-primary/30 dark:border-cyan-500/30'
                : 'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700/50'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Sound grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
        {filteredSounds.map(sound => (
          <button
            key={sound.id}
            onClick={() => handleSoundSelect(sound.id)}
            className={`flex flex-col items-center p-4 rounded-xl transition-all ${
              currentSound === sound.id && isPlaying
                ? 'bg-gradient-to-br from-primary/20 to-accent/20 dark:from-cyan-500/20 dark:to-purple-500/20 ring-2 ring-primary/50 dark:ring-cyan-500/50 scale-105'
                : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:scale-105'
            }`}
            title={sound.description}
          >
            <span className="text-3xl mb-2">{sound.emoji}</span>
            <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">{sound.name}</span>
            {currentSound === sound.id && isPlaying && (
              <span className="flex gap-0.5 mt-2">
                <span className="w-1 h-3 bg-primary dark:bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="w-1 h-3 bg-primary dark:bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-3 bg-primary dark:bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-4 bg-gray-100 dark:bg-slate-800/30 rounded-lg p-3">
        <span className="text-xl">🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-primary [&::-webkit-slider-thumb]:to-accent
            [&::-webkit-slider-thumb]:dark:from-cyan-400 [&::-webkit-slider-thumb]:dark:to-purple-400
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />
        <span className="text-xl">🔊</span>
        <span className="text-sm text-gray-600 dark:text-slate-400 w-12 text-right">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
