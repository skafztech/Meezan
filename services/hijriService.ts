
export interface HijriDateParts {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

// Fallback: Kuwaiti Algorithm
// This approximates the Hijri date mathematically without relying on the browser's Intl API
function getKuwaitiHijriDate(date: Date) {
  const today = new Date(date);
  const adjust = 0; // Adjustment value if needed
  
  today.setDate(today.getDate() + adjust);
  
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  
  let m = month + 1;
  let y = year;
  
  if (m < 3) {
      y -= 1;
      m += 12;
  }
  
  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  
  if (y < 1583) b = 0;
  if (y === 1582) {
      if (m > 10)  b = -10;
      if (m === 10) {
          b = 0;
          if (day > 4) b = -10;
      }
  }
  
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  
  const b_calc = 0;
  const jd_calc = jd + 0.5;
  const z = Math.floor(jd_calc);
  const f = jd_calc - z;
  const a_calc = z;
  let alpha = 0;
  
  let result_a = a_calc;
  
  if (z >= 2299161) {
      alpha = Math.floor((z - 1867216.25) / 36524.25);
      result_a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const result_b = result_a + 1524;
  const result_c = Math.floor((result_b - 122.1) / 365.25);
  const result_d = Math.floor(365.25 * result_c);
  const result_e = Math.floor((result_b - result_d) / 30.6001);
  
  const day_final = result_b - result_d - Math.floor(30.6001 * result_e) + f;
  const month_final = result_e < 14 ? result_e - 1 : result_e - 13;
  const year_final = month_final > 2 ? result_c - 4716 : result_c - 4715;
  
  return {
    day: Math.floor(day_final),
    month: month_final - 1, // 0-11 index
    year: year_final
  };
}

export const getHijriDateParts = (date: Date): HijriDateParts => {
  try {
    // Attempt to use modern Intl API with Islamic Calendar
    // We try 'islamic-uma' (Umm al-Qura) which is standard for KSA
    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-uma', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const parts = hijriFormatter.formatToParts(date);
    
    let day = 0;
    let month = 0;
    let year = 0;

    parts.forEach(part => {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'year') year = parseInt(part.value, 10);
    });

    // Validations:
    // 1. If year > 2000, it likely fell back to Gregorian (Hijri year is ~1445)
    // 2. If any part is NaN or 0, calculation failed
    if (year > 2000 || !day || !month || !year) {
      throw new Error("Intl API fallback detected (Gregorian Year)");
    }

    // Attempt to get the month name via Intl
    const hijriMonthFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-uma', {
      month: 'long',
    });
    const monthName = hijriMonthFormatter.format(date);
    
    // Check if month name is Gregorian (e.g. contains "January")
    if (monthName.match(/January|February|March|April|May|June|July|August|September|October|November|December/i)) {
         throw new Error("Intl API fallback detected (Gregorian Month Name)");
    }

    return { day, month, year, monthName };

  } catch (error) {
    // Fallback to manual calculation algorithm
    const k = getKuwaitiHijriDate(date);
    return {
        day: k.day,
        month: k.month + 1, // Return 1-12 for compatibility
        year: k.year,
        monthName: HIJRI_MONTHS[k.month]
    };
  }
};
