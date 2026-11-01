import { DialogueSegment } from '../types';

export const INITIAL_SCRIPT_SEGMENTS: DialogueSegment[] = [
  {
    id: 1,
    startTime: 0.0,
    endTime: 7.0,
    dialogue: "First time in Korea? Here are 3 reasons why you should use public transportation in Korea.",
    subtitleLines: [
      "First time in Korea? Here are 3 reasons",
      "why you should use public transportation in Korea."
    ],
    sceneTitle: "Welcome to Korea",
    sceneTag: "TRANSIT ESSENTIALS",
    imagePath: "/src/assets/images/scene1_korea_intro_1793534516033.jpg",
    sfxName: "introChime",
    sfxLabel: "Seoul Metro Melodic Intro Chime",
    highlights: ["Ranked #1 World Transit", "Clean & Punctual", "Easy English Signage"],
    koreanKeywords: [
      { hangul: "대중교통", romanized: "Daejung Gyotong", english: "Public Transit" },
      { hangul: "지하철", romanized: "Jihacheol", english: "Subway" }
    ]
  },
  {
    id: 2,
    startTime: 7.0,
    endTime: 14.0,
    dialogue: "First, high-speed trains like KTX and SRT let you reach anywhere in the country in just a few hours.",
    subtitleLines: [
      "First, high-speed trains like KTX and SRT",
      "let you reach anywhere in the country in just a few hours."
    ],
    sceneTitle: "KTX & SRT Bullet Trains",
    sceneTag: "REASON 1: BULLET SPEED",
    imagePath: "/src/assets/images/scene2_ktx_train_1793534515621.jpg",
    sfxName: "ktxWhoosh",
    sfxLabel: "305 km/h High-Speed Train Flyby",
    highlights: ["Speed: 305 km/h", "Seoul ➔ Busan: 2h 15m", "Punctuality: 99.8%"],
    koreanKeywords: [
      { hangul: "고속철도", romanized: "Gosok Cheoldo", english: "High-Speed Rail" },
      { hangul: "KTX / SRT", romanized: "K-T-X / S-R-T", english: "Bullet Express" }
    ]
  },
  {
    id: 3,
    startTime: 14.0,
    endTime: 20.0,
    dialogue: "Second, transfers between buses and subways are seamless and very affordable.",
    subtitleLines: [
      "Second, transfers between buses and subways",
      "are seamless and very affordable."
    ],
    sceneTitle: "Seamless Bus & Subway Transfers",
    sceneTag: "REASON 2: FREE TRANSFERS",
    imagePath: "/src/assets/images/scene3_transit_card_1793534517121.jpg",
    sfxName: "tmoneyBeep",
    sfxLabel: "T-Money Card Reader 'Pee-Bik!'",
    highlights: ["₩0 Transfer Discount", "Tag within 30 mins", "Base fare ~$1.10"],
    koreanKeywords: [
      { hangul: "환승할인", romanized: "Hwanseung Harin", english: "Transfer Discount" },
      { hangul: "티머니", romanized: "T-Money", english: "Transit Card" }
    ]
  },
  {
    id: 4,
    startTime: 20.0,
    endTime: 25.0,
    dialogue: "Third, climate control and free public Wi-Fi make every ride comfortable.",
    subtitleLines: [
      "Third, climate control and free public Wi-Fi",
      "make every ride comfortable."
    ],
    sceneTitle: "Heated Seats & Free 5G Wi-Fi",
    sceneTag: "REASON 3: SUPREME COMFORT",
    imagePath: "/src/assets/images/scene4_subway_interior_1793534516828.jpg",
    sfxName: "climateComfort",
    sfxLabel: "Subway AC Air & Door Chime",
    highlights: ["Winter Heated Seats (38°C)", "Cool Summer AC (24°C)", "Free 5G Public Wi-Fi"],
    koreanKeywords: [
      { hangul: "온열의자", romanized: "Onyeol Uija", english: "Heated Seats" },
      { hangul: "공공와이파이", romanized: "Gong-gong WiFi", english: "Free Public Wi-Fi" }
    ]
  },
  {
    id: 5,
    startTime: 25.0,
    endTime: 30.0,
    dialogue: "Enjoy your trip from Korea with convenient public transportation",
    subtitleLines: [
      "Enjoy your trip from Korea",
      "with convenient public transportation!"
    ],
    sceneTitle: "Enjoy Your Korea Journey!",
    sceneTag: "SAFE TRAVELS IN KOREA",
    imagePath: "/src/assets/images/scene5_korea_welcome_1793534518115.jpg",
    sfxName: "arrivalFanfare",
    sfxLabel: "Upbeat Korean Transit Arrival Fanfare",
    highlights: ["Get T-Money at Incheon", "Download Naver/Kakao Map", "Safe 24/7 Connectivity"],
    koreanKeywords: [
      { hangul: "즐거운 여행", romanized: "Jeulgeoun Yeohaeng", english: "Enjoy Your Trip" },
      { hangul: "환영합니다", romanized: "Hwanyeonghamnida", english: "Welcome!" }
    ]
  }
];

export const TOTAL_VIDEO_DURATION = 30.0; // exact 30.0 seconds
