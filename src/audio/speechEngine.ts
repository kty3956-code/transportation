/**
 * English Voice-Over Engine using Web Speech API & Real-Time Word Highlighting
 */

export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
}

class EnglishSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoiceURI: string | null = null;
  private onWordHighlightCallback: ((wordIndex: number, word: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const allVoices = this.synth.getVoices();
    // Prioritize English voices
    this.voices = allVoices.filter(v => v.lang.startsWith('en'));
    if (this.voices.length === 0) {
      this.voices = allVoices;
    }

    // Auto-select best natural voice if not already picked
    if (!this.selectedVoiceURI && this.voices.length > 0) {
      const preferred = this.voices.find(v =>
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel') ||
        v.name.includes('Oliver') ||
        v.name.includes('Ava')
      );
      this.selectedVoiceURI = preferred ? preferred.voiceURI : this.voices[0].voiceURI;
    }
  }

  public getAvailableVoices(): SpeechVoiceOption[] {
    this.loadVoices();
    return this.voices.map(v => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isDefault: v.default || v.voiceURI === this.selectedVoiceURI
    }));
  }

  public setVoice(voiceURI: string) {
    this.selectedVoiceURI = voiceURI;
  }

  public onWordBoundary(cb: (wordIndex: number, word: string) => void) {
    this.onWordHighlightCallback = cb;
  }

  public onEnd(cb: () => void) {
    this.onEndCallback = cb;
  }

  /**
   * Speak a dialogue segment with rate tuned to allocated duration to prevent cutoff
   */
  public speakSegment(
    text: string,
    durationSeconds: number,
    volume: number = 1.0,
    baseRate: number = 1.0
  ) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Determine voice
    if (this.selectedVoiceURI) {
      const v = this.voices.find(voice => voice.voiceURI === this.selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    // Word count calculation to prevent cutoff
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    // Comfortable average is 2.5 - 3 words/second
    const naturalDuration = wordCount / 2.7;
    // Calculate required rate so speech cleanly finishes before durationSeconds - 0.4s
    const targetTime = Math.max(durationSeconds - 0.4, 2.0);
    let calculatedRate = (naturalDuration / targetTime) * baseRate;
    // Keep rate in natural listening bracket [0.95, 1.25]
    calculatedRate = Math.min(Math.max(calculatedRate, 0.92), 1.25);

    utterance.rate = calculatedRate;
    utterance.pitch = 1.0;
    utterance.volume = Math.max(0, Math.min(1, volume));

    let currentWordIdx = 0;
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        // Approximate current word index
        const spokenTextSoFar = text.substring(0, charIdx + 1);
        const count = spokenTextSoFar.trim().split(/\s+/).length - 1;
        currentWordIdx = Math.max(0, count);
        const currentWord = words[currentWordIdx] || '';
        if (this.onWordHighlightCallback) {
          this.onWordHighlightCallback(currentWordIdx, currentWord);
        }
      }
    };

    utterance.onend = () => {
      if (this.onEndCallback) this.onEndCallback();
    };

    utterance.onerror = () => {
      // ignore cancelled errors
    };

    try {
      this.synth.speak(utterance);
    } catch {
      // fallback
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }
}

export const speechEngine = new EnglishSpeechEngine();
