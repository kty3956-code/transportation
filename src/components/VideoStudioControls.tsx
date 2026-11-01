import React, { useState, useEffect } from 'react';
import { DialogueSegment, SubtitleStyle, AudioSettings } from '../types';
import { TOTAL_VIDEO_DURATION } from '../data/videoScript';
import { lofiAudio } from '../audio/lofiRhodesEngine';
import { speechEngine, SpeechVoiceOption } from '../audio/speechEngine';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Type,
  Clock,
  Download,
  Music,
  Mic,
  Radio,
  CheckCircle,
  AlertCircle,
  Flame,
  Zap,
  Info
} from 'lucide-react';

interface Props {
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  segments: DialogueSegment[];
  onUpdateSegments: (newSegments: DialogueSegment[]) => void;
  subtitleStyle: SubtitleStyle;
  onUpdateSubtitleStyle: (style: SubtitleStyle) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: Partial<AudioSettings>) => void;
  onExportVideo: () => void;
  isExporting: boolean;
  exportProgress: number;
}

export const VideoStudioControls: React.FC<Props> = ({
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  segments,
  onUpdateSegments,
  subtitleStyle,
  onUpdateSubtitleStyle,
  audioSettings,
  onUpdateAudioSettings,
  onExportVideo,
  isExporting,
  exportProgress
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'audio' | 'script' | 'subtitles'>('timeline');
  const [availableVoices, setAvailableVoices] = useState<SpeechVoiceOption[]>([]);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);

  useEffect(() => {
    // Load voices
    const voices = speechEngine.getAvailableVoices();
    setAvailableVoices(voices);
  }, []);

  const subtitleStyles: SubtitleStyle[] = [
    {
      id: 'reels-white',
      name: 'Reels Bold White',
      fontClass: 'font-display font-bold',
      textClass: 'text-white',
      bgClass: 'bg-black/65',
      showKaraoke: false
    },
    {
      id: 'karaoke-yellow',
      name: 'High-Contrast Yellow',
      fontClass: 'font-display font-extrabold',
      textClass: 'text-yellow-300',
      bgClass: 'bg-black/75',
      showKaraoke: true
    },
    {
      id: 'cinema-backdrop',
      name: 'Cinema Black Box',
      fontClass: 'font-display font-bold',
      textClass: 'text-white',
      bgClass: 'bg-black/85',
      showKaraoke: false
    },
    {
      id: 'minimal-clean',
      name: 'Clean Drop Shadow',
      fontClass: 'font-display font-bold',
      textClass: 'text-white',
      bgClass: 'bg-transparent',
      showKaraoke: false
    }
  ];

  const handleSegmentChange = (id: number, field: 'startTime' | 'endTime' | 'dialogue', val: string | number) => {
    const updated = segments.map(seg => {
      if (seg.id !== id) return seg;
      if (field === 'dialogue') {
        const text = String(val);
        // split into max 2 lines intelligently
        const words = text.trim().split(/\s+/);
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        return {
          ...seg,
          dialogue: text,
          subtitleLines: [line1, line2 ? line2 : undefined] as [string, string?]
        };
      }
      return {
        ...seg,
        [field]: Number(val)
      };
    });
    onUpdateSegments(updated);
  };

  const handleTestSfx = (sfx: 'introChime' | 'ktxWhoosh' | 'tmoneyBeep' | 'climateComfort' | 'arrivalFanfare') => {
    lofiAudio.triggerSfxByName(sfx);
  };

  return (
    <div className="flex flex-col gap-5 w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Top Playback & Scrubber Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg hover:shadow-cyan-500/25"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(0)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Restart 30s Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {currentTime.toFixed(2)}s
                <span className="text-slate-500 text-sm font-normal"> / 30.00s</span>
              </span>
              <span className="text-xs text-slate-400">
                9:16 Vertical · Short-Form Explainer
              </span>
            </div>
          </div>

          {/* Export Video Button */}
          <button
            onClick={onExportVideo}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg ${
              isExporting
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-wait'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/25'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? `Exporting (${exportProgress}%)` : 'Export 30s Video'}</span>
          </button>
        </div>

        {/* Master Timeline Scrubber with Scene Breakpoints */}
        <div className="flex flex-col gap-1.5 pt-1">
          <input
            type="range"
            min={0}
            max={TOTAL_VIDEO_DURATION}
            step={0.05}
            value={currentTime}
            onChange={e => onSeek(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Scene Timing Markers */}
          <div className="grid grid-cols-5 gap-1 text-[10px] text-slate-400 pt-0.5">
            {segments.map((seg, idx) => (
              <button
                key={seg.id}
                onClick={() => onSeek(seg.startTime)}
                className={`text-left p-1 rounded hover:bg-slate-800/80 transition-colors truncate ${
                  currentTime >= seg.startTime && currentTime < seg.endTime
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                <span className="font-mono">{seg.startTime.toFixed(0)}s:</span> {seg.sceneTitle.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'timeline'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline & Scenes</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'audio'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Audio Mixer & SFX</span>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'script'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Timing & Cutoff Tuner</span>
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            activeTab === 'subtitles'
              ? 'bg-slate-800 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Subtitles</span>
        </button>
      </div>

      {/* TAB 1: Timeline & Scene Highlights */}
      {activeTab === 'timeline' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>5 Video Scenes (30.0s Total)</span>
            <span>Click any scene to jump</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {segments.map((seg, idx) => {
              const isCurrent = currentTime >= seg.startTime && currentTime < seg.endTime;
              return (
                <div
                  key={seg.id}
                  onClick={() => onSeek(seg.startTime)}
                  className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between h-full ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-cyan-400">
                        {seg.startTime.toFixed(0)}s–{seg.endTime.toFixed(0)}s
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(seg.endTime - seg.startTime).toFixed(0)}s
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-white leading-snug line-clamp-2">
                      {seg.sceneTitle}
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      "{seg.dialogue}"
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-rose-400 font-medium truncate max-w-[100px]">
                      {seg.sfxLabel.split(' ')[0]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSfx(seg.sfxName);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-[10px]"
                    >
                      Test SFX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Audio Mixer & Authentic Korean Transit Soundboard */}
      {activeTab === 'audio' && (
        <div className="flex flex-col gap-5">
          {/* Volume Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            {/* 1. English Voice-Over */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  English Voice-Over
                </span>
                <span className="font-mono text-cyan-300 text-[11px]">
                  {Math.round(audioSettings.voiceVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.voiceVolume}
                onChange={e => onUpdateAudioSettings({ voiceVolume: parseFloat(e.target.value) })}
                className="h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              {/* Voice selector */}
              {availableVoices.length > 0 && (
                <div className="mt-1">
                  <label className="text-[10px] text-slate-400 block mb-1">Narration Accent/Voice:</label>
                  <select
                    value={audioSettings.selectedVoice || ''}
                    onChange={e => {
                      const uri = e.target.value;
                      onUpdateAudioSettings({ selectedVoice: uri });
                      speechEngine.setVoice(uri);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                  >
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Warm Lo-Fi Rhodes Soundtrack */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  Lo-Fi Rhodes Piano
                </span>
                <span className="font-mono text-amber-300 text-[11px]">
                  {Math.round(audioSettings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.musicVolume}
                onChange={e => onUpdateAudioSettings({ musicVolume: parseFloat(e.target.value) })}
                className="h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[11px] text-slate-400 leading-tight">
                Original royalty-free chillhop progression (Dmaj9, F#m7, Bm9, Gmaj7)
              </span>
            </div>

            {/* 3. Authentic Korean Transit Sound Effects */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Authentic Korean SFX
                </span>
                <span className="font-mono text-rose-300 text-[11px]">
                  {Math.round(audioSettings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.sfxVolume}
                onChange={e => onUpdateAudioSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />
              <span className="text-[11px] text-slate-400 leading-tight">
                Authentic Seoul metro chimes, KTX flyby, and T-money reader beeps
              </span>
            </div>
          </div>

          {/* Interactive Soundboard for Authentic Korean Transit Sounds */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Interactive Korean Transit Soundboard (Click to test each effect):
            </span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                onClick={() => handleTestSfx('introChime')}
                className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Seoul Metro Chime
                </span>
                <span className="text-[10px] text-slate-400">
                  Melodic gayageum intro
                </span>
              </button>

              <button
                onClick={() => handleTestSfx('ktxWhoosh')}
                className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  KTX 305 km/h Flyby
                </span>
                <span className="text-[10px] text-slate-400">
                  High-speed train whoosh
                </span>
              </button>

              <button
                onClick={() => handleTestSfx('tmoneyBeep')}
                className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  T-Money "Pee-Bik!"
                </span>
                <span className="text-[10px] text-slate-400">
                  Card reader confirmation
                </span>
              </button>

              <button
                onClick={() => handleTestSfx('climateComfort')}
                className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-colors"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Subway AC & Chime
                </span>
                <span className="text-[10px] text-slate-400">
                  Door chime & air breeze
                </span>
              </button>

              <button
                onClick={() => handleTestSfx('arrivalFanfare')}
                className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-left transition-colors"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Korean Arrival Chime
                </span>
                <span className="text-[10px] text-slate-400">
                  Cheerful exit fanfare
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Script & Dialogue Cutoff Timing Tuner */}
      {activeTab === 'script' && (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Timing & Speech Cutoff Protection:</strong> The speech engine dynamically adjusts reading rate based on the words per segment. If dialogue cuts off, adjust the start/end seconds or trim sentences below.
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {segments.map((seg, idx) => {
              const duration = seg.endTime - seg.startTime;
              const words = seg.dialogue.trim().split(/\s+/).length;
              const wordsPerSec = (words / duration).toFixed(1);
              const isComfortable = parseFloat(wordsPerSec) <= 3.2;

              return (
                <div
                  key={seg.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        Scene {idx + 1}: {seg.sceneTitle}
                      </span>
                      <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        {seg.startTime.toFixed(1)}s ~ {seg.endTime.toFixed(1)}s ({duration.toFixed(1)}s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        isComfortable ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      }`}>
                        {words} words · {wordsPerSec} w/s {isComfortable ? '✓ Balanced' : '⚠️ Fast'}
                      </span>
                    </div>
                  </div>

                  {/* Editable Dialogue Field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">English Voice-Over & Subtitles:</label>
                    <textarea
                      rows={2}
                      value={seg.dialogue}
                      onChange={e => handleSegmentChange(seg.id, 'dialogue', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  {/* Timing adjustments */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Start Time (sec):</span>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={seg.endTime - 1}
                        value={seg.startTime}
                        onChange={e => handleSegmentChange(seg.id, 'startTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">End Time (sec):</span>
                      <input
                        type="number"
                        step={0.5}
                        min={seg.startTime + 1}
                        max={TOTAL_VIDEO_DURATION}
                        value={seg.endTime}
                        onChange={e => handleSegmentChange(seg.id, 'endTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Subtitles Style & Karaoke Highlights */}
      {activeTab === 'subtitles' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-slate-300">
            Choose high-contrast subtitle presentation (Bottom-aligned, 2 lines max):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subtitleStyles.map(st => (
              <button
                key={st.id}
                onClick={() => onUpdateSubtitleStyle(st)}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                  subtitleStyle.id === st.id
                    ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500/40 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{st.name}</span>
                  {subtitleStyle.id === st.id && (
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div className={`p-2 rounded text-center text-xs ${st.bgClass} ${st.textClass} font-bold drop-shadow mt-1`}>
                  "transfers between buses and subways are seamless"
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
