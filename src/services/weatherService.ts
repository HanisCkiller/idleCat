import { WeatherType } from '../types/types';

// WMO Weather interpretation codes → WeatherType mapping
// https://open-meteo.com/en/docs#weathervariables
function mapWmoCodeToWeather(code: number): WeatherType {
  if (code === 0 || code === 1) return 'sunny';        // Clear sky, mainly clear
  if (code === 2 || code === 3) return 'cloudy';       // Partly cloudy, overcast
  if (code >= 51 && code <= 67) return 'rainy';        // Drizzle, rain, freezing rain
  if (code >= 71 && code <= 77) return 'snowy';        // Snow fall, snow grains
  if (code >= 80 && code <= 82) return 'rainy';        // Rain showers
  if (code >= 85 && code <= 86) return 'snowy';        // Snow showers
  if (code >= 95 && code <= 99) return 'rainy';        // Thunderstorm
  if (code >= 45 && code <= 48) return 'cloudy';       // Fog, depositing rime fog
  return 'sunny';
}

export interface WeatherResult {
  weather: WeatherType;
  description: string;
  city?: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data?.address?.city || data?.address?.town || data?.address?.village;
  } catch {
    return undefined;
  }
}

function getGeolocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 3000, enableHighAccuracy: false }
    );
  });
}

/** Fallback: use ip-api.com to get approximate location from IP — no permission needed */
async function getLocationByIP(): Promise<{ latitude: number; longitude: number; city?: string }> {
  const res = await fetch('http://ip-api.com/json/?fields=lat,lon,city,status');
  const data = await res.json();
  if (data.status !== 'success') throw new Error('IP location failed');
  return { latitude: data.lat, longitude: data.lon, city: data.city };
}

export async function fetchRealWeather(): Promise<WeatherResult> {
  console.log('[weather] starting fetch...');

  // Try browser geolocation first; fall back to IP-based location
  let latitude: number;
  let longitude: number;
  let ipCity: string | undefined;

  try {
    const coords = await getGeolocation();
    latitude = coords.latitude;
    longitude = coords.longitude;
    console.log('[weather] geolocation ok:', latitude, longitude);
  } catch (geoErr: any) {
    console.warn('[weather] geolocation failed, trying IP fallback:', geoErr?.message);
    try {
      const ipLoc = await getLocationByIP();
      latitude = ipLoc.latitude;
      longitude = ipLoc.longitude;
      ipCity = ipLoc.city;
      console.log('[weather] IP location ok:', latitude, longitude, ipCity);
    } catch (ipErr: any) {
      console.error('[weather] IP location also failed:', ipErr?.message);
      throw new Error(`Location unavailable: ${geoErr?.message ?? 'denied'}`);
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  console.log('[weather] fetching weather from', url);

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e: any) {
    console.error('[weather] network error:', e?.message ?? e);
    throw new Error(`Network error: ${e?.message ?? 'failed'}`);
  }

  if (!res.ok) {
    console.error('[weather] bad status:', res.status);
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log('[weather] response:', data);
  const code: number = data.current_weather.weathercode;
  const weather = mapWmoCodeToWeather(code);

  // Use IP city as fallback if Nominatim reverse-geocode fails
  const city = (await reverseGeocode(latitude, longitude)) ?? ipCity;

  const descriptions: Record<WeatherType, string> = {
    sunny: 'Clear & Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    snowy: 'Snowy',
  };

  return { weather, description: descriptions[weather], city };
}
