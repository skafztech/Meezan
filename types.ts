
export enum View {
  HOME = 'HOME',
  QURAN = 'QURAN',
  PRAYER_TIMES = 'PRAYER_TIMES',
  QIBLA = 'QIBLA',
  TASBIH = 'TASBIH',
  CHAT = 'CHAT',
  NAMES = 'NAMES',
  ZAKAT = 'ZAKAT',
  HADITH = 'HADITH',
  TRACKER = 'TRACKER',
}

export enum CalculationMethod {
  MWL = 'MWL',
  ISNA = 'ISNA',
  EGYPT = 'EGYPT',
  MAKKAH = 'MAKKAH',
  KARACHI = 'KARACHI',
  TEHRAN = 'TEHRAN',
  JAFARI = 'JAFARI'
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string; // Arabic
  translation: string; // English
  numberInSurah: number;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export type PrayerTimeOffsets = Record<keyof PrayerTimes, number>;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NameOfAllah {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface Hadith {
  arabic: string;
  translation: string;
  narrator: string;
  source: string; // e.g. Sahih al-Bukhari
}
