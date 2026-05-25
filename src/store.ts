import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PetState, PetPosition, AppSettings, DailyStats, WeatherType, RealWeatherState } from './types/types';
import { fetchRealWeather } from './services/weatherService';

interface AppState {
  petState: PetState;
  petPosition: PetPosition;
  settings: AppSettings;
  stats: DailyStats;
  realWeather: RealWeatherState;
  
  // Timer State
  timeLeft: number;
  isActive: boolean;
  isRestMode: boolean;
  
  // UI State
  isStatsOpen: boolean;
  isSettingsOpen: boolean;
  
  setPetState: (state: PetState) => void;
  setPetPosition: (position: PetPosition) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addFocusTime: (minutes: number) => void;
  incrementRest: () => void;
  incrementSkip: () => void;
  completeTask: () => void;
  resetStats: () => void;
  syncRealWeather: () => Promise<void>;
  
  // Timer Actions
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  setIsRestMode: (rest: boolean) => void;
  resetTimer: () => void;

  // UI Actions
  setStatsOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      petState: 'idle',
      petPosition: { x: window.innerWidth - 150, y: window.innerHeight - 150 },
      settings: {
        timerDuration: 40,
        showTimer: false,
        soundEnabled: true,
        petSize: 1,
        opacity: 1,
        isDarkMode: false,
        weather: 'sunny',
        useRealWeather: false,
      },
      realWeather: {
        status: 'idle',
      },
      stats: {
        focusMinutes: 0,
        restCount: 0,
        completedTasks: 0,
        skipCount: 0,
        consecutiveSkipCount: 0,
        maxContinuousWork: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      
      // Timer Initial State
      timeLeft: 40 * 60,
      isActive: false,
      isRestMode: false,

      // UI Initial State
      isStatsOpen: false,
      isSettingsOpen: false,

      syncRealWeather: async () => {
        set({ realWeather: { status: 'loading' } });
        try {
          const result = await fetchRealWeather();
          set((state) => ({
            settings: { ...state.settings, weather: result.weather },
            realWeather: {
              status: 'success',
              city: result.city,
              description: result.description,
              lastFetched: Date.now(),
            },
          }));
        } catch (err: any) {
          set({
            realWeather: {
              status: 'error',
              error: err?.message ?? 'Failed to fetch weather',
            },
          });
        }
      },

      setPetState: (state) => set({ petState: state }),
      setPetPosition: (position) => set({ petPosition: position }),
      updateSettings: (newSettings) => {
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        }));
        
        const { settings, isActive } = get();
        if (!isActive) {
          set({ timeLeft: settings.timerDuration * 60 });
        }
      },
      
      setTimeLeft: (time) => set({ timeLeft: time }),
      setIsActive: (active) => set({ isActive: active }),
      setIsRestMode: (rest) => set({ isRestMode: rest }),
      resetTimer: () => set((state) => ({
        isActive: false,
        isRestMode: false,
        timeLeft: state.settings.timerDuration * 60,
        petState: 'idle'
      })),

      setStatsOpen: (open) => set({ isStatsOpen: open }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),

      addFocusTime: (minutes) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = state.stats.lastUpdated !== today;
        const baseStats = isNewDay ? { focusMinutes: 0, restCount: 0, completedTasks: 0, skipCount: 0, consecutiveSkipCount: 0, maxContinuousWork: 0, lastUpdated: today } : state.stats;
        
        return {
          stats: {
            ...baseStats,
            focusMinutes: baseStats.focusMinutes + minutes,
            maxContinuousWork: Math.max(baseStats.maxContinuousWork, minutes),
          }
        };
      }),
      incrementRest: () => set((state) => ({
        stats: { 
          ...state.stats, 
          restCount: state.stats.restCount + 1,
          completedTasks: state.stats.completedTasks + 1,
          consecutiveSkipCount: 0 
        }
      })),
      incrementSkip: () => set((state) => ({
        stats: {
          ...state.stats,
          skipCount: state.stats.skipCount + 1,
          consecutiveSkipCount: state.stats.consecutiveSkipCount + 1
        }
      })),
      completeTask: () => set((state) => ({
        stats: { 
          ...state.stats, 
          completedTasks: state.stats.completedTasks + 1,
          restCount: state.stats.restCount + 1,
          consecutiveSkipCount: 0 
        }
      })),
      resetStats: () => set((state) => ({
        stats: {
          focusMinutes: 0,
          restCount: 0,
          completedTasks: 0,
          skipCount: 0,
          consecutiveSkipCount: 0,
          maxContinuousWork: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
        }
      })),
    }),
    {
      name: 'idle-cat-storage',
      partialize: (state) => ({
        petPosition: state.petPosition,
        settings: state.settings,
        stats: state.stats,
      }),
    }
  )
);
