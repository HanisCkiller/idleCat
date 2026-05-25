import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { PetState } from '../types/types';
import { cn } from '@/lib/utils';
import { WeatherEffect } from './WeatherEffect';
import { Settings2, Activity, Play, Pause, RotateCcw } from 'lucide-react';

// Speed-test multiplier — 1 = normal, 300 = 5min becomes 1s, 3600 = 1hr becomes 1s
export const speedTestRef = { current: 1 };

// Debug: call this from Settings to instantly trigger a mini-animation
export const triggerMiniAnimRef: { current: ((anim: 'headshake' | 'groom' | 'playball') => void) | null } = { current: null };

const DEVELOPER_QUOTES = [
  "正在把 Bug 转化成特性喵...",
  "咖啡因检测中：电平过低喵。",
  "刚才那个 commit 好像把生产环境搞挂了喵？",
  "别看了，我也看不懂这段代码喵。",
  "休息一下喵，强行编译是没有未来的。",
  "建议先把这段代码给 GPT 看看喵。",
  "这个需求我三分钟就能搞定喵（指三天）。",
  "只要逻辑够乱，Bug 就找不到我喵。",
];

// Daytime mini-animation types
type MiniAnim = 'none' | 'headshake' | 'groom' | 'playball';

// Night pose
type NightPose = 'sit' | 'lie';

// ─── SVG Poses ────────────────────────────────────────────────────────────────

const fill = (dark: boolean) => dark ? '#e4e4e7' : '#18181b';
const inv  = (dark: boolean) => dark ? '#18181b' : '#ffffff';

/** Default sitting cat — full body with wagging tail */
const CatSitting = ({ dark, anim, animKey }: { dark: boolean; anim: MiniAnim; animKey: number }) => {
  const f = fill(dark);
  const i = inv(dark);
  return (
    <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="50" cy="100" rx="22" ry="26" fill={f} />
      {/* Front legs */}
      <rect x="32" y="115" width="10" height="14" rx="5" fill={f} />
      <rect x="58" y="115" width="10" height="14" rx="5" fill={f} />
      {/* Tail — animated */}
      <path
        d="M72,118 Q90,100 85,80 Q80,62 70,70"
        fill="none" stroke={f} strokeWidth="7" strokeLinecap="round"
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'bottom left',
          animation: anim === 'none' ? 'tail 1.6s ease-in-out infinite' : undefined,
        }}
      />
      {/* Neck */}
      <rect x="42" y="74" width="16" height="12" rx="4" fill={f} />
      {/* Head — shake when miniAnim=headshake */}
      <g
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center bottom',
          animation: anim === 'headshake' ? 'headshake 1.4s ease-in-out' : undefined,
        }}
      >
        {/* Ears */}
        <path d="M30,42 L38,22 L46,42 Z" fill={f} />
        <path d="M70,42 L62,22 L54,42 Z" fill={f} />
        {/* Inner ears */}
        <path d="M33,40 L38,26 L44,40 Z" fill={i} opacity="0.4" />
        <path d="M67,40 L62,26 L56,40 Z" fill={i} opacity="0.4" />
        {/* Head */}
        <circle cx="50" cy="55" r="22" fill={f} />
        {/* Eyes — squint when grooming */}
        <circle cx="42" cy="52" r="4" fill={i} />
        <circle cx="58" cy="52" r="4" fill={i} />
        {/* Pupils */}
        <circle cx="42" cy="53" r="2" fill={f} />
        <circle cx="58" cy="53" r="2" fill={f} />
        {/* Nose */}
        <ellipse cx="50" cy="60" rx="3" ry="2" fill={i} />
        {/* Mouth */}
        <path d="M47,62 Q50,65 53,62" fill="none" stroke={i} strokeWidth="1.2" strokeLinecap="round" />
        {/* Whiskers */}
        <line x1="18" y1="56" x2="38" y2="58" stroke={i} strokeWidth="1" opacity="0.7" />
        <line x1="18" y1="61" x2="38" y2="61" stroke={i} strokeWidth="1" opacity="0.7" />
        <line x1="62" y1="58" x2="82" y2="56" stroke={i} strokeWidth="1" opacity="0.7" />
        <line x1="62" y1="61" x2="82" y2="61" stroke={i} strokeWidth="1" opacity="0.7" />
      </g>
      {/* Groom arm */}
      {anim === 'groom' && (
        <g style={{ transformBox: 'fill-box', transformOrigin: 'bottom center', animation: 'groom 2.2s ease-in-out' }}>
          <path d="M38,90 Q28,72 35,60" fill="none" stroke={f} strokeWidth="8" strokeLinecap="round" />
          <circle cx="35" cy="58" r="6" fill={f} />
        </g>
      )}
      {/* Ball */}
      {anim === 'playball' && (
        <g style={{ animation: 'ball 0.9s ease-in-out infinite' }}>
          <circle cx="80" cy="122" r="8" fill="#ef4444" />
          <path d="M74,118 Q80,114 86,118" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
          <circle cx="80" cy="122" r="8" fill="none" stroke="#b91c1c" strokeWidth="1" opacity="0.5" />
        </g>
      )}
    </svg>
  );
};

/** Lying down cat — nighttime */
const CatLying = ({ dark }: { dark: boolean }) => {
  const f = fill(dark);
  const i = inv(dark);
  return (
    <svg viewBox="0 0 130 80" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="70" cy="58" rx="42" ry="18" fill={f} />
      {/* Tail curled */}
      <path d="M110,58 Q125,40 115,30 Q108,24 100,32" fill="none" stroke={f} strokeWidth="7" strokeLinecap="round"
        style={{ transformBox: 'fill-box', transformOrigin: 'bottom left', animation: 'tail-slow 3s ease-in-out infinite' }}
      />
      {/* Paws */}
      <ellipse cx="38" cy="70" rx="10" ry="6" fill={f} />
      <ellipse cx="58" cy="72" rx="10" ry="6" fill={f} />
      {/* Head resting sideways */}
      <circle cx="28" cy="50" r="20" fill={f} />
      {/* Ears */}
      <path d="M16,34 L20,18 L30,34 Z" fill={f} />
      <path d="M36,32 L32,16 L42,30 Z" fill={f} />
      {/* Inner ears */}
      <path d="M18,33 L21,21 L28,33 Z" fill={i} opacity="0.4" />
      <path d="M37,31 L33,19 L40,29 Z" fill={i} opacity="0.4" />
      {/* Sleeping eyes — curved lines */}
      <path d="M18,48 Q22,52 26,48" fill="none" stroke={i} strokeWidth="2" strokeLinecap="round" />
      <path d="M30,47 Q34,51 38,47" fill="none" stroke={i} strokeWidth="2" strokeLinecap="round" />
      {/* Nose */}
      <ellipse cx="28" cy="55" rx="2.5" ry="1.8" fill={i} />
      {/* Whiskers */}
      <line x1="4" y1="52" x2="22" y2="54" stroke={i} strokeWidth="1" opacity="0.6" />
      <line x1="4" y1="57" x2="22" y2="57" stroke={i} strokeWidth="1" opacity="0.6" />
      <line x1="34" y1="54" x2="50" y2="52" stroke={i} strokeWidth="1" opacity="0.6" />
      <line x1="34" y1="57" x2="50" y2="57" stroke={i} strokeWidth="1" opacity="0.6" />
    </svg>
  );
};

/** Focus state — sitting upright, green glowing eyes */
const CatFocus = ({ dark }: { dark: boolean }) => {
  const f = fill(dark);
  const i = inv(dark);
  return (
    <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="100" rx="22" ry="26" fill={f} />
      <rect x="32" y="115" width="10" height="14" rx="5" fill={f} />
      <rect x="58" y="115" width="10" height="14" rx="5" fill={f} />
      <path d="M72,118 Q90,100 85,80 Q80,62 70,70" fill="none" stroke={f} strokeWidth="7" strokeLinecap="round" />
      <rect x="42" y="74" width="16" height="12" rx="4" fill={f} />
      <path d="M30,42 L38,22 L46,42 Z" fill={f} />
      <path d="M70,42 L62,22 L54,42 Z" fill={f} />
      <circle cx="50" cy="55" r="22" fill={f} />
      {/* Green glowing eyes for focus */}
      <circle cx="42" cy="52" r="4" fill="#22c55e" className="animate-pulse" />
      <circle cx="58" cy="52" r="4" fill="#22c55e" className="animate-pulse" />
      <ellipse cx="50" cy="60" rx="3" ry="2" fill={i} />
      <line x1="18" y1="56" x2="38" y2="58" stroke={i} strokeWidth="1" opacity="0.7" />
      <line x1="18" y1="61" x2="38" y2="61" stroke={i} strokeWidth="1" opacity="0.7" />
      <line x1="62" y1="58" x2="82" y2="56" stroke={i} strokeWidth="1" opacity="0.7" />
      <line x1="62" y1="61" x2="82" y2="61" stroke={i} strokeWidth="1" opacity="0.7" />
    </svg>
  );
};

// ─── ZZZ Floating Label ───────────────────────────────────────────────────────
const ZzzFloat = ({ index }: { index: number }) => (
  <span
    className="absolute text-zinc-400 dark:text-zinc-500 font-black select-none pointer-events-none animate-zzz"
    style={{
      fontSize: `${10 + index * 3}px`,
      right: `${-8 - index * 10}px`,
      top: `${20 - index * 12}px`,
      animationDelay: `${index * 0.8}s`,
      opacity: 0,
    }}
  >
    z
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Pet = () => {
  const {
    petState, petPosition, setPetPosition,
    settings, setPetState,
    timeLeft, isActive, setIsActive, resetTimer,
    setStatsOpen, setSettingsOpen
  } = useStore();

  const [isDragging, setIsDragging]     = useState(false);
  const [dragOffset, setDragOffset]     = useState({ x: 0, y: 0 });
  const [showBubble, setShowBubble]     = useState(false);
  const [bubbleText, setBubbleText]     = useState('');
  const [clickCount, setClickCount]     = useState(0);
  const [dragCount, setDragCount]       = useState(0);
  const [showTimer, setShowTimer]       = useState(false);

  // Time-aware state
  const [miniAnim, setMiniAnim]         = useState<MiniAnim>('none');
  const [animKey, setAnimKey]           = useState(0);
  const [nightPose, setNightPose]       = useState<NightPose>('sit');
  const [isNight, setIsNight]           = useState(false);
  const [showZzz, setShowZzz]           = useState(false);

  const bubbleTimerRef         = useRef<any>(null);
  const clickResetTimerRef     = useRef<any>(null);
  const dragResetTimerRef      = useRef<any>(null);
  const miniAnimTimerRef       = useRef<any>(null);
  const miniAnimRestoreRef     = useRef<any>(null);
  const nightLieTimerRef       = useRef<any>(null);
  const zzzTimerRef            = useRef<any>(null);
  const continuousUsageRef     = useRef<number>(0);

  // Refs to always hold latest values — avoids closure staleness in timers
  const petStateRef   = useRef(petState);
  const isNightRef    = useRef(false);
  const nightPoseRef  = useRef<NightPose>('sit');
  useEffect(() => { petStateRef.current = petState; }, [petState]);
  useEffect(() => { nightPoseRef.current = nightPose; }, [nightPose]);

  // isUsageRemind: true = the remind was triggered by 1hr usage (not timer end)
  const [isUsageRemind, setIsUsageRemind] = useState(false);

  // Register debug trigger so Settings can fire mini-anims directly
  const ANIM_DURATIONS: Record<string, number> = { headshake: 1500, groom: 2500, playball: 3000 };
  useEffect(() => {
    triggerMiniAnimRef.current = (anim) => {
      clearTimeout(miniAnimRestoreRef.current);
      setAnimKey(k => k + 1);
      setMiniAnim(anim);
      miniAnimRestoreRef.current = setTimeout(() => setMiniAnim('none'), ANIM_DURATIONS[anim] ?? 2000);
    };
    return () => { triggerMiniAnimRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Time check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkTime = () => {
      const h = new Date().getHours();
      const night = h >= 22 || h < 7;
      setIsNight(night);
      isNightRef.current = night;
    };
    checkTime();
    const t = setInterval(checkTime, 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Daytime random mini-animation every 5 min ────────────────────────────
  // Uses refs so the timer is never cancelled by unrelated state changes
  useEffect(() => {
    const ANIMS: MiniAnim[] = ['headshake', 'groom', 'playball'];
    const DURATIONS: Record<MiniAnim, number> = {
      none: 0, headshake: 1500, groom: 2500, playball: 3000,
    };

    const schedule = () => {
      clearTimeout(miniAnimTimerRef.current);
      const delay = Math.round((5 * 60 * 1000) / speedTestRef.current);
      miniAnimTimerRef.current = setTimeout(() => {
        // Always read latest values via refs
        if (petStateRef.current !== 'idle' || isNightRef.current) {
          schedule();
          return;
        }
        const pick = ANIMS[Math.floor(Math.random() * ANIMS.length)];
        setAnimKey(k => k + 1);
        setMiniAnim(pick);
        // Restore to none after animation duration, then reschedule
        clearTimeout(miniAnimRestoreRef.current);
        miniAnimRestoreRef.current = setTimeout(() => {
          setMiniAnim('none');
          schedule();
        }, DURATIONS[pick]);
      }, delay);
    };
    schedule();

    return () => {
      clearTimeout(miniAnimTimerRef.current);
      clearTimeout(miniAnimRestoreRef.current);
    };
  // Only run once on mount — refs keep values fresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Night: auto-lie after 8s of inactivity, zzz every 12s ───────────────
  useEffect(() => {
    if (!isNight || petState !== 'idle') {
      setNightPose('sit');
      setShowZzz(false);
      clearTimeout(nightLieTimerRef.current);
      clearInterval(zzzTimerRef.current);
      return;
    }

    nightLieTimerRef.current = setTimeout(() => {
      setNightPose('lie');
    }, 8000);

    zzzTimerRef.current = setInterval(() => {
      if (nightPoseRef.current === 'lie') {
        setShowZzz(true);
        setTimeout(() => setShowZzz(false), 3000);
      }
    }, 12_000);

    return () => {
      clearTimeout(nightLieTimerRef.current);
      clearInterval(zzzTimerRef.current);
    };
  }, [isNight, petState, nightPose]);

  // ── Continuous usage: tick every minute (or faster in speed-test mode) ───
  // speedTestRef.current is read at tick-start time; dispatch 'idlecat-speed-change'
  // to restart the interval with the new rate.
  const [speedVersion, setSpeedVersion] = useState(0);
  useEffect(() => {
    const handler = () => setSpeedVersion(v => v + 1);
    window.addEventListener('idlecat-speed-change', handler);
    return () => window.removeEventListener('idlecat-speed-change', handler);
  }, []);

  useEffect(() => {
    const ms = Math.round(60_000 / speedTestRef.current);
    const tick = setInterval(() => {
      const state = petStateRef.current;
      if (state === 'idle' || state === 'focus') {
        continuousUsageRef.current += 1;
        if (continuousUsageRef.current >= 60 && state === 'idle') {
          setIsUsageRemind(true);
          setPetState('remind');
          continuousUsageRef.current = 0;
        }
      } else {
        continuousUsageRef.current = 0;
      }
    }, ms);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedVersion]);

  // ── Display bubble ───────────────────────────────────────────────────────
  const displayBubble = (text: string, duration = 3000) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubbleText(text);
    setShowBubble(true);
    bubbleTimerRef.current = setTimeout(() => setShowBubble(false), duration);
  };

  // ── Drag handling ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({ x: e.clientX - petPosition.x, y: e.clientY - petPosition.y });
    setDragCount(prev => prev + 1);
    if (dragResetTimerRef.current) clearTimeout(dragResetTimerRef.current);
    dragResetTimerRef.current = setTimeout(() => setDragCount(0), 5000);
    if (dragCount >= 3) displayBubble(Math.random() > 0.5 ? "拖不动了…" : "别拽了喵，头晕！");
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth  - 100 * settings.petSize, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 130 * settings.petSize, e.clientY - dragOffset.y));
    setPetPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, settings.petSize, setPetPosition]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ── Click handling ───────────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    // Night: clicking wakes cat up (sit), reset lie timer
    if (isNight && petState === 'idle') {
      setNightPose('sit');
      setShowZzz(false);
      clearTimeout(nightLieTimerRef.current);
      nightLieTimerRef.current = setTimeout(() => setNightPose('lie'), 8000);
    }

    setClickCount(prev => prev + 1);
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    clickResetTimerRef.current = setTimeout(() => setClickCount(0), 5000);
    if (clickCount >= 5) { displayBubble("别戳啦 QAQ (炸毛中)"); return; }

    const randomQuote = DEVELOPER_QUOTES[Math.floor(Math.random() * DEVELOPER_QUOTES.length)];
    displayBubble(randomQuote);
  };

  const handleDoubleClick = () => setSettingsOpen(true);

  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetTimer();
    setIsUsageRemind(false);
    setPetState('idle');
  };

  // ── Format time ──────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Which cat body to render ─────────────────────────────────────────────
  const renderCatBody = () => {
    if (petState === 'focus') return <CatFocus dark={settings.isDarkMode} />;
    if (petState === 'rest')  return <CatLying dark={settings.isDarkMode} />;
    if (isNight && nightPose === 'lie' && petState === 'idle') return <CatLying dark={settings.isDarkMode} />;
    return <CatSitting key={animKey} dark={settings.isDarkMode} anim={petState === 'idle' ? miniAnim : 'none'} animKey={animKey} />;
  };

  // ── Outer animation class ────────────────────────────────────────────────
  const outerAnim = () => {
    if (petState === 'remind') return 'animate-stretch';
    if (petState === 'rest')   return 'animate-sleep';
    return '';
  };

  const isLying = (petState === 'rest') || (isNight && nightPose === 'lie' && petState === 'idle');

  return (
    <div
      className="fixed z-50 select-none group/pet"
      style={{
        left: petPosition.x,
        top:  petPosition.y,
        opacity: settings.opacity,
        transform: `scale(${settings.petSize})`,
        transformOrigin: 'bottom left',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowTimer(true)}
      onMouseLeave={() => setShowTimer(false)}
    >
      <WeatherEffect type={settings.weather} />

      {/* ZZZ floating */}
      {showZzz && isLying && (
        <div className="absolute -top-8 right-0 pointer-events-none">
          <ZzzFloat index={0} />
          <ZzzFloat index={1} />
          <ZzzFloat index={2} />
        </div>
      )}

      {/* Floating Timer */}
      {settings.showTimer && (
        <div className={cn(
          "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-[10px] font-black shadow-2xl transition-all duration-500 flex items-center gap-3 border border-white/10 dark:border-black/10 pointer-events-auto z-10",
          (isActive || showTimer || petState === 'remind') ? "opacity-100 translate-y-0 scale-100" : "opacity-60 translate-y-[-4px] scale-90"
        )}>
          <button onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }} className="hover:scale-125 transition-transform active:scale-95 bg-white/10 dark:bg-black/10 p-1 rounded-full">
            {isActive ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>
          <span className="font-mono tabular-nums tracking-tight">{formatTime(timeLeft)}</span>
          <button onClick={(e) => { e.stopPropagation(); resetTimer(); }} className="hover:scale-125 transition-transform active:scale-95 opacity-50 hover:opacity-100">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hover control buttons */}
      <div className="absolute -left-10 top-0 flex flex-col gap-2 opacity-0 group-hover/pet:opacity-100 transition-opacity duration-300">
        <button onClick={(e) => { e.stopPropagation(); setStatsOpen(true); }} className="w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-lg">
          <Activity className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }} className="w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-lg">
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Speech Bubble */}
      {(showBubble || petState === 'remind') && (
        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
          <div className="text-[10px] font-medium text-zinc-900 dark:text-zinc-100 text-center">
            {petState === 'remind' ? (
              <div className="space-y-2">
                {isUsageRemind ? (
                  <p className="font-bold leading-tight">已经连续盯屏幕 1 小时了喵！<br/>起来动一动、喝杯水吧～</p>
                ) : (
                  <p className="font-bold leading-tight">计时器结束啦喵！休息一下吧～</p>
                )}
                <div className="flex flex-col gap-1.5 pt-1">
                  <button onClick={handleAcknowledge} className="w-full py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:opacity-90 transition-opacity font-bold text-[9px]">朕已知晓</button>
                  <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }} className="w-full py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[9px]">打开设置</button>
                </div>
              </div>
            ) : bubbleText}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-zinc-900" />
        </div>
      )}

      {/* Cat body */}
      <div
        className={cn(
          outerAnim(),
          isLying ? "w-32 h-20" : "w-20 h-32",
          "flex items-end justify-center relative transition-all duration-700"
        )}
      >
        {renderCatBody()}
      </div>
    </div>
  );
};
