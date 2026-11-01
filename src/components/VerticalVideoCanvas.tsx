import React, { useRef, useEffect, useState } from 'react';
import { DialogueSegment, SubtitleStyle } from '../types';
import { TOTAL_VIDEO_DURATION } from '../data/videoScript';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Wifi,
  Flame,
  Zap,
  CreditCard,
  MapPin,
  CheckCircle2,
  Train
} from 'lucide-react';

interface Props {
  segments: DialogueSegment[];
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  subtitleStyle: SubtitleStyle;
  activeWordIndex: number;
  lastSfxTriggered: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isRecording?: boolean;
}

export const VerticalVideoCanvas: React.FC<Props> = ({
  segments,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  subtitleStyle,
  activeWordIndex,
  lastSfxTriggered,
  canvasRef,
  isRecording = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});

  // Find active segment
  const activeSegmentIndex = Math.max(
    0,
    segments.findIndex(s => currentTime >= s.startTime && currentTime < s.endTime)
  );
  const activeSegment = segments[activeSegmentIndex] || segments[0];

  // Preload all 5 images for seamless canvas drawing
  useEffect(() => {
    const loaded: Record<string, HTMLImageElement> = {};
    segments.forEach(seg => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = seg.imagePath;
      img.onload = () => {
        loaded[seg.imagePath] = img;
        setImageElements(prev => ({ ...prev, [seg.imagePath]: img }));
      };
    });
  }, [segments]);

  // Canvas render loop for high-res 9:16 video frames (720 x 1280)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas resolution: 720 x 1280 (True 9:16 vertical video)
    const W = 720;
    const H = 1280;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // 1. Draw Active Scene Background Image with Ken Burns Zoom & Subtle Pan
    const currentImg = imageElements[activeSegment.imagePath];
    if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
      const segProgress = (currentTime - activeSegment.startTime) / (activeSegment.endTime - activeSegment.startTime);
      // Subtle cinematic zoom from 1.0 to 1.08
      const zoom = 1.0 + Math.sin(segProgress * Math.PI) * 0.08;
      const panY = Math.sin(segProgress * Math.PI * 0.5) * 20;

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);

      // Cover image math
      const imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
      const canvasRatio = W / H;
      let drawW = W;
      let drawH = H;
      let drawX = 0;
      let drawY = -panY;

      if (imgRatio > canvasRatio) {
        drawW = H * imgRatio;
        drawX = (W - drawW) / 2;
      } else {
        drawH = W / imgRatio;
        drawY = (H - drawH) / 2 - panY;
      }

      ctx.drawImage(currentImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      // Fallback gradient while loading
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Cinematic Vignette & Bottom Scrim for Subtitle Contrast
    // Top vignette (for badges)
    const topGrad = ctx.createLinearGradient(0, 0, 0, 240);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
    topGrad.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 240);

    // Bottom subtitle contrast scrim
    const bottomGrad = ctx.createLinearGradient(0, H - 420, 0, H);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(0.35, 'rgba(0,0,0,0.65)');
    bottomGrad.addColorStop(0.7, 'rgba(0,0,0,0.88)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - 420, W, 420);

    // 3. Draw Subtitles onto Canvas (burned-in for exported video)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const subY = H - 150;
    const lines = activeSegment.subtitleLines;
    const line1 = lines[0] || '';
    const line2 = lines[1] || '';

    // Choose font & colors according to style
    ctx.font = 'bold 34px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    // Subtitle Background Capsule Pill / Box
    const textMeasure1 = ctx.measureText(line1).width;
    const textMeasure2 = line2 ? ctx.measureText(line2).width : 0;
    const maxTextWidth = Math.max(textMeasure1, textMeasure2);
    const boxPadX = 36;
    const boxPadY = 16;
    const boxHeight = line2 ? 110 : 64;
    const boxY = line2 ? subY - 48 : subY - 32;

    if (subtitleStyle.id === 'cinema-backdrop') {
      ctx.fillStyle = 'rgba(10, 15, 29, 0.82)';
      ctx.beginPath();
      ctx.roundRect((W - maxTextWidth) / 2 - boxPadX, boxY, maxTextWidth + boxPadX * 2, boxHeight, 18);
      ctx.fill();
    } else if (subtitleStyle.id === 'reels-white') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect((W - maxTextWidth) / 2 - boxPadX, boxY, maxTextWidth + boxPadX * 2, boxHeight, 14);
      ctx.fill();
    }

    // High-contrast white subtitles with yellow highlights
    if (subtitleStyle.id === 'karaoke-yellow') {
      ctx.fillStyle = '#fde047';
    } else {
      ctx.fillStyle = '#ffffff';
    }

    if (line2) {
      ctx.fillText(line1, W / 2, subY - 20);
      ctx.fillText(line2, W / 2, subY + 28);
    } else {
      ctx.fillText(line1, W / 2, subY);
    }

    ctx.restore();

    // 4. Draw Header Segment Timeline (Top 5-segment bars)
    const barTop = 32;
    const barHeight = 5;
    const barMargin = 24;
    const barGap = 6;
    const totalBarWidth = W - barMargin * 2;
    const segmentBarWidth = (totalBarWidth - barGap * (segments.length - 1)) / segments.length;

    segments.forEach((seg, i) => {
      const segX = barMargin + i * (segmentBarWidth + barGap);
      // Background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.roundRect(segX, barTop, segmentBarWidth, barHeight, 3);
      ctx.fill();

      // Filled progress bar
      if (currentTime >= seg.endTime) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(segX, barTop, segmentBarWidth, barHeight, 3);
        ctx.fill();
      } else if (currentTime > seg.startTime && currentTime < seg.endTime) {
        const segRatio = (currentTime - seg.startTime) / (seg.endTime - seg.startTime);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(segX, barTop, segmentBarWidth * segRatio, barHeight, 3);
        ctx.fill();
      }
    });

  }, [currentTime, activeSegment, subtitleStyle, imageElements, segments, canvasRef]);

  // Calculate high-speed train speedometer simulation for Scene 2
  const speedProgress = Math.min(1, Math.max(0, (currentTime - 7) / 7));
  const currentKtxSpeed = Math.round(140 + speedProgress * 165); // 140 -> 305 km/h

  // Calculate animated card tap flash for Scene 3
  const isCardTapped = currentTime >= 14.3 && currentTime <= 17.5;

  return (
    <div className="flex flex-col items-center w-full">
      {/* 9:16 Vertical Video Frame */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[380px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-950 select-none group"
      >
        {/* Hidden/Hardware-accelerated rendering Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dynamic HTML Motion Graphic Overlays (Interactive HUD) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
          {/* Top Bar Overlay: Timeline Progress & Station Badge */}
          <div className="w-full flex flex-col gap-3 pt-3">
            {/* Top 5-Scene Segment Bar */}
            <div className="flex items-center gap-1.5 w-full">
              {segments.map((seg, idx) => {
                const isPassed = currentTime >= seg.endTime;
                const isCurrent = currentTime >= seg.startTime && currentTime < seg.endTime;
                const ratio = isCurrent ? (currentTime - seg.startTime) / (seg.endTime - seg.startTime) : isPassed ? 1 : 0;

                return (
                  <div
                    key={seg.id}
                    className="h-1.5 flex-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm cursor-pointer pointer-events-auto"
                    onClick={() => onSeek(seg.startTime)}
                    title={`Jump to Scene ${idx + 1}: ${seg.sceneTitle}`}
                  >
                    <div
                      className="h-full bg-cyan-400 transition-all duration-75"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Header Transit Tag & Timer */}
            <div className="flex items-center justify-between text-xs font-semibold text-white/90">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="tracking-wider uppercase text-[11px] font-bold text-rose-300 drop-shadow">
                  {activeSegment.sceneTag}
                </span>
              </div>
              <div className="font-mono text-[11px] tabular-nums bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-cyan-300">
                {currentTime.toFixed(1)}s / {TOTAL_VIDEO_DURATION.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Center Dynamic Visual Infographics Per Scene */}
          <div className="flex flex-col items-center justify-center my-auto w-full">
            {/* Scene 1 (0-7s): Seoul Transit Map Icons */}
            {activeSegmentIndex === 0 && (
              <div className="flex flex-col items-center gap-3 animate-fade-in text-center">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl">
                  <div className="text-xs font-semibold text-cyan-300 tracking-wider uppercase mb-1">
                    Seoul Public Transit 101
                  </div>
                  <div className="text-xl font-bold font-display text-white">
                    3 Reasons You Must Ride
                  </div>
                </div>

                {/* Metro Line Badges (Line 1 Navy, Line 2 Green, Line 3 Orange, Line 5 Purple, Line 9 Gold) */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-6 h-6 rounded-full bg-blue-700 text-[11px] font-bold text-white flex items-center justify-center shadow">1</span>
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-[11px] font-bold text-white flex items-center justify-center shadow">2</span>
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-[11px] font-bold text-white flex items-center justify-center shadow">3</span>
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-[11px] font-bold text-white flex items-center justify-center shadow">5</span>
                  <span className="w-6 h-6 rounded-full bg-yellow-600 text-[11px] font-bold text-white flex items-center justify-center shadow">9</span>
                  <span className="text-[11px] font-medium text-slate-300 ml-1 bg-black/40 px-2 py-0.5 rounded-full">
                    99.9% Punctual
                  </span>
                </div>
              </div>
            )}

            {/* Scene 2 (7-14s): KTX & SRT Speedometer */}
            {activeSegmentIndex === 1 && (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <div className="bg-slate-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-cyan-500/30 shadow-2xl flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">
                      KTX Express Cruising Speed
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold font-mono text-cyan-300 tabular-nums">
                        {currentKtxSpeed}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">km/h</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] text-white">
                  <Train className="w-3.5 h-3.5 text-blue-400" />
                  <span>Seoul ➔ Busan in only <strong>2h 15m</strong></span>
                </div>
              </div>
            )}

            {/* Scene 3 (14-20s): Seamless Transfer & T-Money Card Flash */}
            {activeSegmentIndex === 2 && (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <div className={`transition-all duration-300 bg-slate-900/85 backdrop-blur-md px-5 py-3 rounded-2xl border ${isCardTapped ? 'border-emerald-400 shadow-emerald-500/30' : 'border-white/20'} shadow-2xl flex items-center gap-3.5`}>
                  <div className={`p-2.5 rounded-xl ${isCardTapped ? 'bg-emerald-500 text-white' : 'bg-rose-500/20 text-rose-400'}`}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[11px] uppercase tracking-wider text-slate-300 font-medium">
                      Bus ⇄ Subway Transfer
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-emerald-400 font-mono">
                        ₩0 FREE
                      </span>
                      <span className="text-[11px] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                        Save up to 70%
                      </span>
                    </div>
                  </div>
                </div>

                {isCardTapped && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fare Approved (승인 완료) · Tagged!</span>
                  </div>
                )}
              </div>
            )}

            {/* Scene 4 (20-25s): Heated Seats & Free 5G Wi-Fi */}
            {activeSegmentIndex === 3 && (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                  <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 flex flex-col items-center text-center">
                    <Flame className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-xs font-bold text-white">Heated Seats</span>
                    <span className="text-[10px] text-amber-300 font-mono">38°C in Winter</span>
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 flex flex-col items-center text-center">
                    <Wifi className="w-5 h-5 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-white">Free Public Wi-Fi</span>
                    <span className="text-[10px] text-cyan-300 font-mono">High-Speed 5G</span>
                  </div>
                </div>

                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-slate-300 border border-white/10">
                  Cool Air AC in Summer · Pristine Cleanliness
                </div>
              </div>
            )}

            {/* Scene 5 (25-30s): Enjoy Your Korea Trip Conclusion */}
            {activeSegmentIndex === 4 && (
              <div className="flex flex-col items-center gap-2.5 animate-fade-in text-center">
                <div className="bg-black/75 backdrop-blur-md px-5 py-3 rounded-2xl border border-rose-500/30 shadow-2xl">
                  <div className="text-xs uppercase tracking-wider text-rose-300 font-semibold mb-0.5">
                    Welcome to South Korea
                  </div>
                  <div className="text-xl font-bold font-display text-white">
                    Have an Amazing Trip! 🇰🇷
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Grab your T-Money at Incheon Airport & explore!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sound Effect Toast notification */}
          {lastSfxTriggered && (
            <div className="self-center bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 text-xs font-medium px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg animate-pulse flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lastSfxTriggered}</span>
            </div>
          )}

          {/* Bottom High-Contrast Subtitle (HTML backup / Interactive display) */}
          <div className="w-full flex flex-col items-center pb-3">
            <div className={`text-center px-4 py-2.5 rounded-xl backdrop-blur-md transition-all duration-150 ${
              subtitleStyle.id === 'cinema-backdrop'
                ? 'bg-black/85 border border-white/10 shadow-2xl'
                : subtitleStyle.id === 'reels-white'
                ? 'bg-black/65 shadow-lg'
                : 'bg-transparent'
            }`}>
              {/* Line 1 */}
              <div className={`font-display font-bold text-lg md:text-xl leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
                subtitleStyle.id === 'karaoke-yellow' ? 'text-yellow-300' : 'text-white'
              }`}>
                {activeSegment.subtitleLines[0]}
              </div>

              {/* Line 2 (Maximum 2 lines as specified in prompt) */}
              {activeSegment.subtitleLines[1] && (
                <div className={`font-display font-bold text-lg md:text-xl leading-tight mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
                  subtitleStyle.id === 'karaoke-yellow' ? 'text-yellow-300' : 'text-white'
                }`}>
                  {activeSegment.subtitleLines[1]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tap screen overlay to Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 backdrop-blur-[2px]"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <div className="w-16 h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </div>
        </button>

        {/* Recording active badge */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse z-30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>REC 30s</span>
          </div>
        )}
      </div>

      {/* Mini Controls Bar under the 9:16 phone */}
      <div className="flex items-center justify-between w-full max-w-[380px] mt-4 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => onSeek(0)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300 ml-1">
            {currentTime.toFixed(1)}s / 30.0s
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-400">Scene {activeSegmentIndex + 1} of 5</span>
        </div>
      </div>
    </div>
  );
};
