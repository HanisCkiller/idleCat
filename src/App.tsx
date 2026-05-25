import { Pet } from './components/Pet';
import { Stats } from './components/Stats';
import { Settings } from './components/Settings';
import { useStore } from './store';
import { useEffect, useCallback, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function App() {
  const [petVisible, setPetVisible] = useState(true);

  const {
    settings,
    isStatsOpen, setStatsOpen,
    isSettingsOpen, setSettingsOpen,
    timeLeft, setTimeLeft,
    isActive, setIsActive,
    isRestMode,
    petState, setPetState,
    addFocusTime,
    syncRealWeather,
  } = useStore();

  // ── Screen usage tracking ────────────────────────────────────────────────
  // isUserActive: true = user is at screen; false = idle/locked/sleeping
  const isUserActiveRef = useRef(true); // assume active on start
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.onUserActivity((active) => {
      isUserActiveRef.current = active;
    });
  }, []);

  // Every 60s, if user is active → add 1 minute to today's usage
  useEffect(() => {
    const tick = setInterval(() => {
      if (isUserActiveRef.current) {
        addFocusTime(1);
      }
    }, 60_000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dark mode
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  // Sync real weather on startup
  useEffect(() => {
    if (settings.useRealWeather) {
      syncRealWeather();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global timer logic
  const handlePhaseEnd = useCallback(() => {
    setIsActive(false);
    setPetState('remind');

    // Native browser notification (works in Electron)
    if (Notification.permission === 'granted') {
      new Notification('IdleCat 提醒你 🐱', {
        body: '计时结束啦！起来动一动，喝杯水吧喵～',
        silent: false,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('IdleCat 提醒你 🐱', {
            body: '计时结束啦！起来动一动，喝杯水吧喵～',
          });
        }
      });
    }
  }, [setPetState, setIsActive]);

  // Sync petState with timer active/inactive
  useEffect(() => {
    if (isActive && petState === 'idle') {
      setPetState('focus');
    } else if (!isActive && petState === 'focus') {
      setPetState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handlePhaseEnd();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, setTimeLeft, handlePhaseEnd]);

  // Listen for tray commands to show/hide/toggle the cat
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    api.onSetPetVisible((visible) => setPetVisible(visible));
    api.onTogglePetVisible(() => setPetVisible((v) => !v));
  }, []);

  // Tell Electron main process to pass through mouse events on transparent areas
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      // If hovering over root background (transparent), pass through
      const isTransparent = !el || el.id === 'root' || el.tagName === 'BODY' || el.tagName === 'HTML';
      api.setIgnoreMouseEvents(isTransparent);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: 'transparent' }}>
      {/* The Desktop Pet — always rendered, visibility toggled via opacity */}
      <div
        className="pointer-events-auto transition-opacity duration-500"
        style={{ opacity: petVisible ? 1 : 0, pointerEvents: petVisible ? 'auto' : 'none' }}
      >
        <Pet />
      </div>

      {/* Stats Modal */}
      <div className="pointer-events-auto">
        <Dialog open={isStatsOpen} onOpenChange={setStatsOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-[32px]">
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <Stats />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Settings Modal */}
      <div className="pointer-events-auto">
        <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-[32px]">
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <Settings />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
