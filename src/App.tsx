import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_SCRIPT_SEGMENTS, TOTAL_VIDEO_DURATION } from './data/videoScript';
import { DialogueSegment, SubtitleStyle, AudioSettings } from './types';
import { lofiAudio } from './audio/lofiRhodesEngine';
import { speechEngine } from './audio/speechEngine';
import { VerticalVideoCanvas } from './components/VerticalVideoCanvas';
import { VideoStudioControls } from './components/VideoStudioControls';
import { TravelerTransitGuide } from './components/TravelerTransitGuide';
import {
  Train,
  Download,
  Play,
  RotateCcw,
  Sparkles,
  Compass,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [segments, setSegments] = useState<DialogueSegment[]>(INITIAL_SCRIPT_SEGMENTS);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [lastSfxTriggered, setLastSfxTriggered] = useState<string | null>(null);

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    id: 'reels-white',
    name: 'Reels Bold White',
    fontClass: 'font-display font-bold',
    textClass: 'text-white',
    bgClass: 'bg-black/65',
    showKaraoke: false
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 0.9,
    voiceVolume: 1.0,
    musicVolume: 0.65,
    sfxVolume: 0.9,
    isMuted: false,
    selectedVoice: null,
    speechRate: 1.0
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const lastSpokenSegmentId = useRef<number | null>(null);
  const lastTriggeredSfxId = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Keep audio engine volumes synced
  useEffect(() => {
    lofiAudio.setVolumes({
      master: audioSettings.masterVolume,
      music: audioSettings.musicVolume,
      sfx: audioSettings.sfxVolume,
      voice: audioSettings.voiceVolume,
      muted: audioSettings.isMuted
    });
  }, [audioSettings]);

  // Connect word boundary callback
  useEffect(() => {
    speechEngine.onWordBoundary((idx) => {
      setActiveWordIndex(idx);
    });
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      lofiAudio.stopAll();
      speechEngine.stop();
    } else {
      // If at end, wrap around
      if (currentTime >= TOTAL_VIDEO_DURATION - 0.1) {
        setCurrentTime(0);
        lastSpokenSegmentId.current = null;
        lastTriggeredSfxId.current = null;
      }
      setIsPlaying(true);
      lastTimestampRef.current = performance.now();
      lofiAudio.scheduleSoundtrack(currentTime);
    }
  }, [isPlaying, currentTime]);

  // Seek to specific timestamp
  const handleSeek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_VIDEO_DURATION, time));
    setCurrentTime(clamped);
    lastSpokenSegmentId.current = null;
    lastTriggeredSfxId.current = null;
    speechEngine.stop();
    if (isPlaying) {
      lofiAudio.stopAll();
      lofiAudio.scheduleSoundtrack(clamped);
    }
  }, [isPlaying]);

  // Main playback animation & scheduling loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = now;
      const deltaSec = (now - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = now;

      setCurrentTime(prev => {
        const next = prev + deltaSec;

        // Check if finished 30.0s
        if (next >= TOTAL_VIDEO_DURATION) {
          setIsPlaying(false);
          lofiAudio.stopAll();
          speechEngine.stop();
          return TOTAL_VIDEO_DURATION;
        }

        // Check active segment
        const currentSeg = segments.find(s => next >= s.startTime && next < s.endTime);
        if (currentSeg) {
          // Trigger voiceover when entering segment
          if (lastSpokenSegmentId.current !== currentSeg.id) {
            lastSpokenSegmentId.current = currentSeg.id;
            const segDuration = currentSeg.endTime - currentSeg.startTime;
            if (!audioSettings.isMuted && audioSettings.voiceVolume > 0.05) {
              speechEngine.speakSegment(
                currentSeg.dialogue,
                segDuration,
                audioSettings.voiceVolume,
                audioSettings.speechRate
              );
            }
          }

          // Trigger authentic Korean transit sound effect when entering segment
          if (lastTriggeredSfxId.current !== currentSeg.id) {
            lastTriggeredSfxId.current = currentSeg.id;
            if (!audioSettings.isMuted && audioSettings.sfxVolume > 0.05) {
              lofiAudio.triggerSfxByName(currentSeg.sfxName);
              setLastSfxTriggered(currentSeg.sfxLabel);
              // Clear SFX toast after 2.8s
              setTimeout(() => {
                setLastSfxTriggered(null);
              }, 2800);
            }
          }
        }

        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, segments, audioSettings]);

  // Export full 30s 9:16 Video (WebM / MP4) with rendered graphics and mixed audio
  const handleExportVideo = async () => {
    if (isExporting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setIsPlaying(false);
      lofiAudio.stopAll();
      speechEngine.stop();

      // Reset to 0s
      setCurrentTime(0);
      lastSpokenSegmentId.current = null;
      lastTriggeredSfxId.current = null;

      // 1. Capture canvas stream at 30 fps
      const canvasStream = canvas.captureStream(30);

      // 2. Mix Web Audio destination stream
      const audioStream = lofiAudio.getMediaStream();
      const combinedTracks: MediaStreamTrack[] = [
        ...canvasStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : [])
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // Check supported MIME types
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3500000 // 3.5 Mbps high quality
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'Korean_Public_Transportation_Explained_30s.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExporting(false);
          setExportProgress(100);
        }, 300);
      };

      recorder.start();
      setIsPlaying(true);
      lastTimestampRef.current = performance.now();
      lofiAudio.scheduleSoundtrack(0);

      // Progress interval for 30s export
      const progressTimer = setInterval(() => {
        setCurrentTime(t => {
          const pct = Math.min(99, Math.round((t / TOTAL_VIDEO_DURATION) * 100));
          setExportProgress(pct);
          if (t >= TOTAL_VIDEO_DURATION - 0.2) {
            clearInterval(progressTimer);
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
          return t;
        });
      }, 250);

    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar strictly conforming to the 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
            <Train className="w-4 h-4 fill-current" />
          </span>
          <span>Korea Transit Explained</span>
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#video-player" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            30s Video
          </a>
          <a href="#studio-controls" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Audio & Script Tuner
          </a>
          <a href="#traveler-guide" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Traveler Handbook
          </a>
          <a href="#authentic-sfx" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Transit Soundboard
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 rounded-lg shadow-lg hover:shadow-rose-500/25 transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? `Exporting ${exportProgress}%` : 'Export 9:16 Video'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-10">
        {/* Hero Introduction & Quick Overview */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>9:16 Vertical Short-Form Video</span>
              <span aria-hidden="true">·</span>
              <span>30.0 Seconds</span>
              <span aria-hidden="true">·</span>
              <span>English Narration</span>
              <span aria-hidden="true">·</span>
              <span>Lo-Fi Rhodes + Authentic Transit SFX</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-display tracking-tight text-balance">
              Korean Public Transportation Explained for First-Time Visitors
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              3 reasons why South Korea has the world's best transit: 305 km/h KTX bullet trains, seamless free bus-to-subway transfers, heated seats, and free 5G public Wi-Fi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg hover:shadow-cyan-500/20"
            >
              {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play 30s Video'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: 9:16 Video Frame & Interactive Studio Console */}
        <div id="video-player" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 9:16 Vertical Video Screen */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
            <VerticalVideoCanvas
              segments={segments}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              subtitleStyle={subtitleStyle}
              activeWordIndex={activeWordIndex}
              lastSfxTriggered={lastSfxTriggered}
              canvasRef={canvasRef}
              isRecording={isExporting}
            />
          </div>

          {/* Right Column: Studio Controls, Audio Mixer, Script Editor */}
          <div id="studio-controls" className="lg:col-span-7 flex flex-col gap-6">
            <VideoStudioControls
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              segments={segments}
              onUpdateSegments={setSegments}
              subtitleStyle={subtitleStyle}
              onUpdateSubtitleStyle={setSubtitleStyle}
              audioSettings={audioSettings}
              onUpdateAudioSettings={st => setAudioSettings(prev => ({ ...prev, ...st }))}
              onExportVideo={handleExportVideo}
              isExporting={isExporting}
              exportProgress={exportProgress}
            />

            {/* Quick Dialogue & Script Breakdown Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Active Script Dialogue (30.0s Total)
              </h3>
              <div className="space-y-2 text-xs">
                {segments.map((s, idx) => {
                  const isActive = currentTime >= s.startTime && currentTime < s.endTime;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSeek(s.startTime)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-cyan-950/50 border-cyan-500/60 text-white'
                          : 'bg-slate-950/40 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold">
                          ({s.startTime.toFixed(0).padStart(2, '0')}:00 ~ {s.endTime.toFixed(0).padStart(2, '0')}:00)
                        </span>
                        <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          "{s.dialogue}"
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 shrink-0">
                        {s.sfxLabel.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Traveler Transit Handbook */}
        <section id="traveler-guide" className="w-full pt-4">
          <TravelerTransitGuide />
        </section>
      </main>

      {/* Footer conforming to Section 1.B & 1.C */}
      <footer className="border-t border-slate-800/80 py-6 px-6 mt-12 bg-slate-950 text-slate-400 text-xs text-center flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>Korean Public Transportation Explained</span>
          <span aria-hidden="true">·</span>
          <span>9:16 Short-Form Video Explainer</span>
          <span aria-hidden="true">·</span>
          <span>Produced for First-Time Travelers</span>
        </div>
        <div>
          <span>Audio synthesized with Web Audio API (Copyright-Free Lo-Fi Rhodes)</span>
        </div>
      </footer>
    </div>
  );
}
