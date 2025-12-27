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

  // Compact mode - just a button
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all min-h-[44px] ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'
          }`}
          title="Ambient Sounds"
        >
          <span className="text-lg">{currentSoundData?.emoji || '🎧'}</span>
          {isPlaying && (
            <span className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[70] bg-black/20 sm:bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            {/* Mobile: Bottom sheet, Desktop: Dropdown */}
            <div className="fixed sm:absolute bottom-0 sm:bottom-full left-0 right-0 sm:left-auto sm:right-0 sm:mb-2 w-full sm:w-80 bg-slate-900 sm:rounded-xl rounded-t-3xl border-t sm:border border-slate-700 shadow-2xl z-[80] overflow-hidden safe-area-pb max-h-[70vh] sm:max-h-none">
              {/* Mobile handle */}
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto my-3 sm:hidden" />
              
              <div className="p-4 overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-base">🎵 Ambient Sounds</h3>
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <button
                        onClick={handleStop}
                        className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors min-h-[32px]"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="sm:hidden text-slate-400 p-2 -mr-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Category filter - horizontal scroll on mobile */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap min-h-[32px] ${
                      !selectedCategory
                        ? 'bg-cyan-500/30 text-cyan-300'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {SOUND_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap min-h-[32px] ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/30 text-cyan-300'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Sound grid - 3 columns on mobile, responsive */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {filteredSounds.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound.id)}
                      className={`flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all min-h-[72px] active:scale-95 ${
                        currentSound === sound.id && isPlaying
                          ? 'bg-cyan-500/20 ring-2 ring-cyan-500/50'
                          : 'bg-slate-800/50 hover:bg-slate-700/50'
                      }`}
                      title={sound.description}
                    >
                      <span className="text-2xl sm:text-3xl mb-1">{sound.emoji}</span>
                      <span className="text-[10px] sm:text-xs text-slate-300 truncate w-full text-center font-medium">
                        {sound.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Volume slider - larger touch target */}
                <div className="flex items-center gap-3 py-2">
                  <span className="text-slate-400 text-lg">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:hover:bg-cyan-300 [&::-webkit-slider-thumb]:transition-colors
                      [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <span className="text-slate-400 text-lg">🔊</span>
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
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>🎧</span> Ambient Sounds
        </h3>
        {isPlaying && currentSoundData && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Now playing: {currentSoundData.emoji} {currentSoundData.name}
            </span>
            <button
              onClick={togglePlayPause}
              className="p-1.5 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
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
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
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
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
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
                ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-2 ring-cyan-500/50 scale-105'
                : 'bg-slate-800/50 hover:bg-slate-700/50 hover:scale-105'
            }`}
            title={sound.description}
          >
            <span className="text-3xl mb-2">{sound.emoji}</span>
            <span className="text-xs text-slate-300 font-medium">{sound.name}</span>
            {currentSound === sound.id && isPlaying && (
              <span className="flex gap-0.5 mt-2">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-4 bg-slate-800/30 rounded-lg p-3">
        <span className="text-xl">🔈</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-purple-400
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />
        <span className="text-xl">🔊</span>
        <span className="text-sm text-slate-400 w-12 text-right">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
