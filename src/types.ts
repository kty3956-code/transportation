export interface DialogueSegment {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  dialogue: string;
  subtitleLines: [string, string?];
  sceneTitle: string;
  sceneTag: string;
  imagePath: string;
  sfxName: 'introChime' | 'ktxWhoosh' | 'tmoneyBeep' | 'climateComfort' | 'arrivalFanfare';
  sfxLabel: string;
  highlights: string[];
  koreanKeywords?: { hangul: string; romanized: string; english: string }[];
}

export interface SubtitleStyle {
  id: 'reels-white' | 'karaoke-yellow' | 'cinema-backdrop' | 'minimal-clean';
  name: string;
  fontClass: string;
  textClass: string;
  bgClass: string;
  showKaraoke: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  selectedVoice: string | null;
  speechRate: number; // 0.9 - 1.2
}
