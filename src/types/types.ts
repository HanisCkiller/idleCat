export type PetState = 'idle' | 'focus' | 'remind' | 'rest';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface PetPosition {
  x: number;
  y: number;
}

export interface AppSettings {
  timerDuration: number;
  showTimer: boolean;
  soundEnabled: boolean;
  petSize: number;
  opacity: number;
  isDarkMode: boolean;
  weather: WeatherType;
  useRealWeather: boolean;
}

export interface RealWeatherState {
  status: 'idle' | 'loading' | 'success' | 'error';
  city?: string;
  description?: string;
  error?: string;
  lastFetched?: number;
}

export interface DailyStats {
  focusMinutes: number;
  restCount: number;
  completedTasks: number;
  skipCount: number;
  consecutiveSkipCount: number;
  maxContinuousWork: number;
  lastUpdated: string;
}
