import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Volume2, Maximize2, SunMoon, Trash2, CloudSun, MapPin, RefreshCw, Bug, Zap } from 'lucide-react';
import { PetState } from '../types/types';
import { speedTestRef, triggerMiniAnimRef } from './Pet';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Speed presets: label, multiplier, description
const SPEED_PRESETS = [
  { label: '1×', mult: 1,    desc: 'Normal (5min / 1hr)' },
  { label: '30×', mult: 30,  desc: '~10s / ~2min' },
  { label: '300×', mult: 300, desc: '~1s / ~12s' },
] as const;

export const Settings = () => {
  const { settings, updateSettings, resetStats, syncRealWeather, realWeather, setPetState, setIsActive, addFocusTime } = useStore();
  const intervalRef = useRef<any>(null);
  const [speedMult, setSpeedMult] = useState(1);

  // Auto-refresh real weather every 30 min when enabled
  useEffect(() => {
    if (settings.useRealWeather) {
      syncRealWeather();
      intervalRef.current = setInterval(syncRealWeather, REFRESH_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.useRealWeather]);

  return (
    <div className="space-y-8">
      <h2 className="text-base font-black flex items-center gap-2 uppercase tracking-tighter">
        <SettingsIcon className="w-4 h-4" /> Preferences
      </h2>

      <div className="space-y-6">
        {/* Timer Duration Setting */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Timer Duration</Label>
            <span className="text-xs font-black">{settings.timerDuration}m</span>
          </div>
          <Slider
            value={[settings.timerDuration]}
            min={1}
            max={120}
            step={1}
            onValueChange={([val]) => updateSettings({ timerDuration: val })}
            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          />
        </div>

        <div className="pt-2 space-y-4">
          {/* Timer Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-zinc-400" />
              <Label className="text-xs font-bold">Show Timer</Label>
            </div>
            <Switch
              checked={settings.showTimer}
              onCheckedChange={(checked) => updateSettings({ showTimer: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <Label className="text-xs font-bold">Sound Feedback</Label>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-zinc-400" />
              <Label className="text-xs font-bold">Cat Scale</Label>
            </div>
            <div className="w-32">
              <Slider
                value={[settings.petSize]}
                min={0.5}
                max={1.5}
                step={0.1}
                onValueChange={([val]) => updateSettings({ petSize: val })}
              />
            </div>
          </div>

          {/* Real Weather Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <Label className="text-xs font-bold">Live Weather</Label>
            </div>
            <Switch
              checked={settings.useRealWeather}
              onCheckedChange={(checked) => updateSettings({ useRealWeather: checked })}
            />
          </div>

          {/* Real weather status feedback */}
          {settings.useRealWeather && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-300">
              {realWeather.status === 'loading' && (
                <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-[10px] font-bold uppercase">Fetching your local weather...</span>
                </div>
              )}
              {realWeather.status === 'success' && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                      {realWeather.city ? `${realWeather.city} · ` : ''}{realWeather.description}
                    </span>
                  </div>
                  <button onClick={() => syncRealWeather()} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}
              {realWeather.status === 'error' && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-red-500 leading-tight break-all">
                    {realWeather.error ?? 'Unknown error'}
                  </span>
                  <button onClick={() => syncRealWeather()} className="text-zinc-400 shrink-0">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual weather selector — only shown when live weather is off */}
          {!settings.useRealWeather && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-zinc-400" />
                <Label className="text-xs font-bold">Weather Vibe</Label>
              </div>
              <Select 
                value={settings.weather} 
                onValueChange={(val: any) => updateSettings({ weather: val })}
              >
                <SelectTrigger className="w-24 h-8 text-[10px] font-bold uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="snowy">Snowy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunMoon className="w-4 h-4 text-zinc-400" />
              <Label className="text-xs font-bold">Dark Protocol</Label>
            </div>
            <Switch
              checked={settings.isDarkMode}
              onCheckedChange={(checked) => {
                updateSettings({ isDarkMode: checked });
                if (checked) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 text-[10px] font-black uppercase tracking-widest h-10 border-zinc-200 dark:border-zinc-800"
          onClick={() => {
            if (confirm('Erase all session data for today?')) {
              resetStats();
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Reset Session
        </Button>
      </div>

      {/* Debug Panel */}
      <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Bug className="w-3 h-3" /> Debug Poses
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['idle', 'focus', 'remind', 'rest'] as PetState[]).map((state) => (
            <button
              key={state}
              onClick={() => {
                setIsActive(state === 'focus');
                setPetState(state);
              }}
              className="py-1.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {state === 'idle' && '🐱 Idle'}
              {state === 'focus' && '🟢 Focus'}
              {state === 'remind' && '⏰ Remind'}
              {state === 'rest' && '😴 Rest'}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-400 leading-tight">Force cat into a specific state for testing. Focus also starts the timer.</p>

        {/* Mini-animation test buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {(['headshake', 'groom', 'playball'] as const).map((anim) => (
            <button
              key={anim}
              onClick={() => {
                setPetState('idle');
                triggerMiniAnimRef.current?.(anim);
              }}
              className="py-1.5 px-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {anim === 'headshake' && '🙃 Shake'}
              {anim === 'groom' && '🐾 Groom'}
              {anim === 'playball' && '🔴 Ball'}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-400 leading-tight">Trigger a mini-animation instantly (forces idle state).</p>

        <button
          onClick={() => addFocusTime(10)}
          className="w-full py-1.5 px-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          ＋10min to Today's Usage (test)
        </button>

        {/* Speed Test */}
        <div className="space-y-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Timer Speed
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {SPEED_PRESETS.map(({ label, mult, desc }) => (
              <button
                key={mult}
                onClick={() => {
                  speedTestRef.current = mult;
                  setSpeedMult(mult);
                  window.dispatchEvent(new Event('idlecat-speed-change'));
                }}
                title={desc}
                className={`py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-colors ${
                  speedMult === mult
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-zinc-400 leading-tight">
            {SPEED_PRESETS.find(p => p.mult === speedMult)?.desc}
            {speedMult > 1 && ' — resets to 1× on app restart'}
          </p>
        </div>
      </div>
    </div>
  );
};
