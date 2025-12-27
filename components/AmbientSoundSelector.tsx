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
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full mb-2 right-0 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Ambient Sounds</h3>
                  {isPlaying && (
                    <button
                      onClick={handleStop}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Stop
                    </button>
                  )}
                </div>

                {/* Category filter */}
                <div className="flex gap-1 mb-3 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
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
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/30 text-cyan-300'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Sound grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {filteredSounds.map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound.id)}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        currentSound === sound.id
                          ? 'bg-cyan-500/20 ring-2 ring-cyan-500/50'
                          : 'bg-slate-800/50 hover:bg-slate-700/50'
                      }`}
                      title={sound.description}
                    >
                      <span className="text-2xl mb-1">{sound.emoji}</span>
                      <span className="text-[10px] text-slate-400 truncate w-full text-center">
                        {sound.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:hover:bg-cyan-300 [&::-webkit-slider-thumb]:transition-colors"
                  />
                  <span className="text-slate-400">🔊</span>
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
        {filteredSounds.map(sound => (
          <button
            key={sound.id}
            onClick={() => handleSoundSelect(sound.id)}
            className={`flex flex-col items-center p-3 rounded-xl transition-all ${
              currentSound === sound.id
                ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-2 ring-cyan-500/50 scale-105'
                : 'bg-slate-800/50 hover:bg-slate-700/50 hover:scale-105'
            }`}
            title={sound.description}
          >
            <span className="text-3xl mb-2">{sound.emoji}</span>
            <span className="text-xs text-slate-300 font-medium">{sound.name}</span>
            {currentSound === sound.id && isPlaying && (
              <span className="flex gap-0.5 mt-1">
                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
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
