
import { PrayerTimes, Coordinates, CalculationMethod } from '../types';

export const CALCULATION_METHODS = [
  { id: CalculationMethod.MWL, name: "Muslim World League" },
  { id: CalculationMethod.ISNA, name: "Islamic Society of North America" },
  { id: CalculationMethod.EGYPT, name: "Egyptian General Authority of Survey" },
  { id: CalculationMethod.MAKKAH, name: "Umm Al-Qura University, Makkah" },
  { id: CalculationMethod.KARACHI, name: "Univ. of Islamic Sciences, Karachi" },
  { id: CalculationMethod.TEHRAN, name: "Institute of Geophysics, Univ. of Tehran" },
  { id: CalculationMethod.JAFARI, name: "Shia Ithna-Ashari (Jafari)" }
];

// Offsets representing the difference in hours relative to sunrise/sunset based on solar angle calculation approximations.
// 15 degrees is approx 1 hour.
const METHOD_OFFSETS: Record<CalculationMethod, { fajr: number, isha: number, maghrib?: number }> = {
  [CalculationMethod.MWL]: { fajr: 1.2, isha: 1.13 }, // 18°, 17°
  [CalculationMethod.ISNA]: { fajr: 1.0, isha: 1.0 }, // 15°, 15°
  [CalculationMethod.EGYPT]: { fajr: 1.3, isha: 1.16 }, // 19.5°, 17.5°
  [CalculationMethod.MAKKAH]: { fajr: 1.23, isha: 1.5 }, // 18.5°, 90 min fixed
  [CalculationMethod.KARACHI]: { fajr: 1.2, isha: 1.2 }, // 18°, 18°
  [CalculationMethod.TEHRAN]: { fajr: 1.18, isha: 0.93, maghrib: 0.2 }, // 17.7°, 14°, Maghrib 4.5° after sunset
  [CalculationMethod.JAFARI]: { fajr: 1.06, isha: 0.93, maghrib: 0.26 } // 16°, 14°, Maghrib 4° after sunset
};

export const calculatePrayerTimes = (date: Date, coords: Coordinates, method: CalculationMethod = CalculationMethod.MWL): PrayerTimes => {
  // This calculates plausible times based on solar movement approximations.
  // In a production app, this would use the 'adhan' JS library or similar.
  
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const declination = 23.45 * Math.sin(Math.PI / 180 * (360 / 365 * (dayOfYear - 81)));
  
  // Base mock Sunrise/Sunset
  const baseSunrise = 6.0; 
  const baseSunset = 18.0; 
  
  // Seasonal shift based on latitude
  const seasonalShift = -Math.tan(coords.latitude * Math.PI / 180) * Math.tan(declination * Math.PI / 180);
  
  let sunriseHour = baseSunrise - seasonalShift;
  let sunsetHour = baseSunset + seasonalShift;

  // Apply Longitude correction (approx 4 min per degree from central meridian, here simplified)
  // We'll skip complex timezone/longitude adjustments for this simulation to keep it stable but realistic locally.

  const offsets = METHOD_OFFSETS[method];

  const fajrTime = sunriseHour - offsets.fajr;
  const maghribTime = sunsetHour + (offsets.maghrib || 0);
  const ishaTime = sunsetHour + offsets.isha;
  
  // Dhuhr is roughly solar noon
  const dhuhrTime = 12.2 + (seasonalShift * 0.1);
  
  // Asr (Standard/Hanafi diff typically) - here we use standard
  const asrTime = sunsetHour - 2.5; 

  const formatTime = (decimalTime: number): string => {
    let hours = Math.floor(decimalTime);
    const minutes = Math.floor((decimalTime - hours) * 60);
    
    // Handle wrap around 24h
    if (hours < 0) hours += 24;
    if (hours >= 24) hours -= 24;

    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return {
    fajr: formatTime(fajrTime),
    sunrise: formatTime(sunriseHour),
    dhuhr: formatTime(dhuhrTime),
    asr: formatTime(asrTime),
    maghrib: formatTime(maghribTime),
    isha: formatTime(ishaTime),
  };
};

export const calculateQiblaDirection = (coords: Coordinates): number => {
  const KAABA_COORDS = { latitude: 21.4225, longitude: 39.8262 };
  
  const phiK = KAABA_COORDS.latitude * Math.PI / 180.0;
  const lambdaK = KAABA_COORDS.longitude * Math.PI / 180.0;
  const phi = coords.latitude * Math.PI / 180.0;
  const lambda = coords.longitude * Math.PI / 180.0;

  const psi = 180.0 / Math.PI * Math.atan2(
    Math.sin(lambdaK - lambda),
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
  );

  return Math.round(psi < 0 ? psi + 360 : psi);
};
