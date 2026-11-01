/**
 * Copyright-Free Warm Lo-Fi Rhodes Soundtrack & Authentic Korean Transit Sound Effects
 * Built with the Web Audio API for zero-latency, royalty-free audio generation.
 */

class LofiRhodesAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private destNode: MediaStreamAudioDestinationNode | null = null;

  private isPlaying = false;
  private activeScheduledNodes: Array<{ stop: (time?: number) => void }> = [];
  private loopTimer: number | null = null;

  // Master volumes (0 to 1)
  private masterVol = 0.85;
  private musicVol = 0.65;
  private sfxVol = 0.9;
  private voiceVol = 1.0;
  private isMuted = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Separate channel gains
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.voiceVol, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      // Recording stream destination
      this.destNode = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.destNode);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMediaStream(): MediaStream | null {
    this.initContext();
    return this.destNode?.stream || null;
  }

  public setVolumes(settings: { master?: number; music?: number; sfx?: number; voice?: number; muted?: boolean }) {
    if (settings.master !== undefined) this.masterVol = settings.master;
    if (settings.music !== undefined) this.musicVol = settings.music;
    if (settings.sfx !== undefined) this.sfxVol = settings.sfx;
    if (settings.voice !== undefined) this.voiceVol = settings.voice;
    if (settings.muted !== undefined) this.isMuted = settings.muted;

    if (this.ctx && this.masterGain && this.musicGain && this.sfxGain && this.voiceGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, now);
      this.musicGain.gain.setValueAtTime(this.musicVol, now);
      this.sfxGain.gain.setValueAtTime(this.sfxVol, now);
      this.voiceGain.gain.setValueAtTime(this.voiceVol, now);
    }
  }

  // -------------------------------------------------------------
  // LO-FI RHODES SYNTHESIS ENGINE
  // -------------------------------------------------------------
  private playRhodesNote(freq: number, startTime: number, duration: number, velocity: number = 0.7) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Fundamental Rhodes Sine
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // 2. Rhodes Tine (Bell-like metallic overtone at 4x harmonic)
    const tineOsc = this.ctx.createOscillator();
    tineOsc.type = 'sine';
    tineOsc.frequency.setValueAtTime(freq * 4.0, startTime);

    // 3. Body warmth (Triangle slightly detuned)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(freq * 0.998, startTime);

    // Envelopes
    const fundamentalGain = this.ctx.createGain();
    const tineGain = this.ctx.createGain();
    const bodyGain = this.ctx.createGain();
    const noteMasterGain = this.ctx.createGain();

    // Fundamental ADSR: gentle attack, warm sustain, soft release
    fundamentalGain.gain.setValueAtTime(0.0001, startTime);
    fundamentalGain.gain.linearRampToValueAtTime(0.45 * velocity, startTime + 0.015);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.18 * velocity, startTime + 0.8);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Tine Envelope: sharp metallic pluck, rapid decay
    tineGain.gain.setValueAtTime(0.0001, startTime);
    tineGain.gain.linearRampToValueAtTime(0.18 * velocity, startTime + 0.004);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    // Body warmth envelope
    bodyGain.gain.setValueAtTime(0.0001, startTime);
    bodyGain.gain.linearRampToValueAtTime(0.2 * velocity, startTime + 0.02);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.85);

    // Filter for Lo-Fi warmth (mellow low pass)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1250, startTime);
    filter.frequency.exponentialRampToValueAtTime(750, startTime + duration);
    filter.Q.setValueAtTime(1.2, startTime);

    // Connect oscillators
    osc1.connect(fundamentalGain);
    tineOsc.connect(tineGain);
    bodyOsc.connect(bodyGain);

    fundamentalGain.connect(filter);
    tineGain.connect(filter);
    bodyGain.connect(filter);

    filter.connect(noteMasterGain);
    noteMasterGain.connect(this.musicGain);

    osc1.start(startTime);
    tineOsc.start(startTime);
    bodyOsc.start(startTime);

    osc1.stop(startTime + duration + 0.1);
    tineOsc.stop(startTime + 0.3);
    bodyOsc.stop(startTime + duration + 0.1);

    this.activeScheduledNodes.push({
      stop: () => {
        try {
          osc1.stop();
          tineOsc.stop();
          bodyOsc.stop();
        } catch {
          // ignore
        }
      }
    });
  }

  private playRhodesChord(notes: number[], startTime: number, duration: number, velocity: number = 0.6) {
    // Gentle humanized strum effect (10-25ms offset per note)
    notes.forEach((freq, idx) => {
      const strumOffset = idx * 0.022;
      this.playRhodesNote(freq, startTime + strumOffset, duration - strumOffset, velocity * (1 - idx * 0.04));
    });
  }

  // Lo-Fi Sub Kick & Brush Rim
  private playLofiKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private playLofiRim(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.Q.setValueAtTime(2.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
  }

  // Play full 30-second Lo-Fi Rhodes progression aligned with video scenes
  public scheduleSoundtrack(fromSecond: number = 0) {
    this.initContext();
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;
    const t0 = now - fromSecond; // Virtual origin for video time 0.0s

    // Chord definitions (frequencies in Hz)
    // Dmaj9: D3 (146.83), A3 (220.0), C#4 (277.18), F#4 (369.99), E4 (329.63)
    const Dmaj9 = [146.83, 220.0, 277.18, 329.63, 369.99];
    // F#m7: F#3 (185.0), A3 (220.0), C#4 (277.18), E4 (329.63)
    const FsharpM7 = [185.0, 220.0, 277.18, 329.63];
    // A/B: B2 (123.47), F#3 (185.0), A3 (220.0), C#4 (277.18), E4 (329.63)
    const A_over_B = [123.47, 185.0, 220.0, 277.18, 329.63];
    // Bm9: B2 (123.47), F#3 (185.0), A3 (220.0), C#4 (277.18), D4 (293.66)
    const Bm9 = [123.47, 185.0, 220.0, 277.18, 293.66];
    // Em9: E3 (164.81), G3 (196.0), B3 (246.94), D4 (293.66), F#4 (369.99)
    const Em9 = [164.81, 196.0, 246.94, 293.66, 369.99];
    // Gmaj9: G2 (98.0), D3 (146.83), F#3 (185.0), A3 (220.0), B3 (246.94)
    const Gmaj9 = [98.0, 146.83, 185.0, 220.0, 246.94];
    // A13sus: A2 (110.0), G3 (196.0), B3 (246.94), D4 (293.66), F#4 (369.99)
    const A13sus = [110.0, 196.0, 246.94, 293.66, 369.99];

    // Scheduled chord events across the 30.0s video:
    const chordTimeline = [
      { t: 0.2, chord: Dmaj9, dur: 3.4 },
      { t: 3.8, chord: Dmaj9, dur: 3.0 },
      { t: 7.0, chord: FsharpM7, dur: 3.4 },
      { t: 10.5, chord: A_over_B, dur: 3.2 },
      { t: 14.0, chord: Bm9, dur: 2.8 },
      { t: 17.0, chord: Em9, dur: 2.8 },
      { t: 20.0, chord: Gmaj9, dur: 2.4 },
      { t: 22.6, chord: A13sus, dur: 2.2 },
      { t: 25.0, chord: Dmaj9, dur: 4.8 }
    ];

    chordTimeline.forEach(({ t, chord, dur }) => {
      const targetTime = t0 + t;
      if (targetTime >= now - 0.05 && targetTime < t0 + 30.2) {
        this.playRhodesChord(chord, Math.max(targetTime, now), dur);
      }
    });

    // Mellow lo-fi beat events (every 1.8 seconds)
    for (let beat = 0.5; beat < 29.5; beat += 1.8) {
      const kickTime = t0 + beat;
      const rimTime = t0 + beat + 0.9;
      if (kickTime >= now) this.playLofiKick(kickTime);
      if (rimTime >= now) this.playLofiRim(rimTime);
    }
  }

  // -------------------------------------------------------------
  // AUTHENTIC KOREAN TRANSIT SOUND EFFECTS
  // -------------------------------------------------------------

  /**
   * 1. Seoul Subway Melodic Intro Chime (Traditional Eolssigu flute / Gayageum pentatonic chime)
   * Heard when entering major Seoul Metro stations (Line 1-9)
   */
  public playSubwayIntroChime(delay: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;

    // Traditional Korean pentatonic chime melody: Sol (G4) -> Do (C5) -> Re (D5) -> Mi (E5) -> Sol (G5)
    const notes = [
      { freq: 392.0, t: 0.0, dur: 0.4 },  // G4
      { freq: 523.25, t: 0.22, dur: 0.45 }, // C5
      { freq: 587.33, t: 0.44, dur: 0.45 }, // D5
      { freq: 659.25, t: 0.66, dur: 0.55 }, // E5
      { freq: 783.99, t: 0.92, dur: 1.1 }  // G5
    ];

    notes.forEach(({ freq, t, dur }) => {
      const osc = this.ctx!.createOscillator();
      const overtone = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + t);

      // Bell chime harmonic
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2.76, now + t);

      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.linearRampToValueAtTime(0.24, now + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + t);
      overtone.start(now + t);
      osc.stop(now + t + dur + 0.05);
      overtone.stop(now + t + dur * 0.5);
    });
  }

  /**
   * 2. KTX 305 km/h Bullet Train Whoosh (High-speed rail pass)
   * Stereo Doppler effect with deep rail rumble and rushing air
   */
  public playKtxWhoosh(delay: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;
    const duration = 2.4;

    // 1. Air rush noise with swept bandpass filter (Doppler effect)
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Frequency rises then drops as train speeds past
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(320, now + duration);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.38, now + 0.85);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Stereo Panner (zooms from right to left)
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(0.7, now);
    panner.pan.linearRampToValueAtTime(-0.8, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(panner);
    panner.connect(this.sfxGain);

    // 2. Heavy High-Speed Train Low Rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(75, now);
    rumble.frequency.linearRampToValueAtTime(60, now + duration);

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, now);

    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);

    noise.start(now);
    rumble.start(now);
    noise.stop(now + duration + 0.05);
    rumble.stop(now + duration + 0.05);
  }

  /**
   * 3. Authentic Korean T-Money Card Reader "Pee-Bik!" (승인 완료 / Fare Approved)
   * The distinct high two-tone chirp heard at every Korean bus and metro turnstile
   */
  public playTmoneyBeep(delay: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;

    // Distinct Korean transit card reader dual chirp:
    // Chirp 1: 2093 Hz (C7) for 45ms
    // Chirp 2: 2489 Hz (D#7) for 75ms
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2093, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.055);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2489, now + 0.055);
    gain2.gain.setValueAtTime(0.001, now + 0.055);
    gain2.gain.linearRampToValueAtTime(0.42, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.055);
    osc2.stop(now + 0.15);

    // Subtle cash register approval chime harmonic
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(1318.5, now + 0.12); // E6
    bellGain.gain.setValueAtTime(0.001, now + 0.12);
    bellGain.gain.linearRampToValueAtTime(0.15, now + 0.13);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    bell.connect(bellGain);
    bellGain.connect(this.sfxGain);
    bell.start(now + 0.12);
    bell.stop(now + 0.5);
  }

  /**
   * 4. Subway Climate Control Breeze & Modern Door Chime
   * Smooth pneumatic air conditioning whisper + gentle station notification chime
   */
  public playClimateComfort(delay: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;

    // Friendly 2-tone door warning chime: E5 -> B4
    [
      { f: 659.25, t: 0.0, d: 0.35 },
      { f: 493.88, t: 0.2, d: 0.45 }
    ].forEach(({ f, t, d }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.2, now + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + t);
      osc.stop(now + t + d);
    });

    // Gentle AC soothing breeze
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 1.5), this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 1.5);
  }

  /**
   * 5. Joyful Korean Arrival Fanfare (Celebration chime)
   */
  public playArrivalFanfare(delay: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;

    // Upbeat welcoming chime: C5 -> E5 -> G5 -> C6
    const fanfare = [
      { f: 523.25, t: 0.0, d: 0.25 },
      { f: 659.25, t: 0.16, d: 0.25 },
      { f: 783.99, t: 0.32, d: 0.35 },
      { f: 1046.5, t: 0.52, d: 0.95 }
    ];

    fanfare.forEach(({ f, t, d }) => {
      const osc = this.ctx!.createOscillator();
      const overtone = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(f * 2.0, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.22, now + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + t);
      overtone.start(now + t);
      osc.stop(now + t + d + 0.05);
      overtone.stop(now + t + d * 0.6);
    });
  }

  /**
   * Triggers the appropriate SFX based on current timestamp
   */
  public triggerSfxByName(name: 'introChime' | 'ktxWhoosh' | 'tmoneyBeep' | 'climateComfort' | 'arrivalFanfare') {
    switch (name) {
      case 'introChime':
        this.playSubwayIntroChime();
        break;
      case 'ktxWhoosh':
        this.playKtxWhoosh();
        break;
      case 'tmoneyBeep':
        this.playTmoneyBeep();
        break;
      case 'climateComfort':
        this.playClimateComfort();
        break;
      case 'arrivalFanfare':
        this.playArrivalFanfare();
        break;
    }
  }

  public stopAll() {
    this.activeScheduledNodes.forEach(n => {
      try {
        n.stop();
      } catch {
        // ignore
      }
    });
    this.activeScheduledNodes = [];
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.isPlaying = false;
  }
}

export const lofiAudio = new LofiRhodesAudioEngine();
