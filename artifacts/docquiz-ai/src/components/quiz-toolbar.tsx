import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Flame,
  Zap,
  Type,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { QuizQuestion } from '@workspace/api-client-react';
import { generateSmartHint } from '@/lib/gamification';
import {
  readAccessibilitySettings,
  writeAccessibilitySettings,
  type AccessibilitySettings,
} from '@/lib/storage';

export function QuizToolbar({
  question,
  questionNumber,
  streak,
  adaptiveLevel,
  onHintUsed,
}: {
  question: QuizQuestion;
  questionNumber: number;
  streak: number;
  adaptiveLevel: 'sharp' | 'standard' | 'scaffold';
  onHintUsed?: () => void;
}) {
  const [settings, setSettings] = useState<AccessibilitySettings>(readAccessibilitySettings());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('docquiz-accessibility-updated', handleUpdate);
    return () => window.removeEventListener('docquiz-accessibility-updated', handleUpdate);
  }, []);

  // Stop TTS when question changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setShowHint(false);
  }, [question.id]);

  // Text to Speech reader
  const toggleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const optionsText = question.options
      .map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`)
      .join('. ');

    const fullText = `Question ${questionNumber}. ${question.question}. ${optionsText}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Dyslexia Font mode
  const toggleDyslexia = () => {
    const updated = { ...settings, dyslexiaFont: !settings.dyslexiaFont };
    setSettings(updated);
    writeAccessibilitySettings(updated);
  };

  const hintText = generateSmartHint(
    question.question,
    question.options,
    question.correctAnswerIndex,
  );

  return (
    <div className="mb-5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-card/60 p-2 backdrop-blur-sm">
        {/* Left: Streak & Adaptive Mode Pill */}
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <div className="flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in duration-300">
              <Flame size={13} className="fill-amber-500 text-amber-500" />
              <span>{streak} Streak!</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all ${
              adaptiveLevel === 'sharp'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : adaptiveLevel === 'scaffold'
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'bg-muted text-muted-foreground'
            }`}
            title="Adaptive difficulty dynamically adjusts pacing and scaffolding to your recall streak."
          >
            <Zap size={12} className={adaptiveLevel === 'sharp' ? 'animate-pulse' : ''} />
            <span className="font-mono-ui uppercase text-[10px] tracking-wider">
              {adaptiveLevel === 'sharp'
                ? 'Adaptive: Sharp Focus'
                : adaptiveLevel === 'scaffold'
                ? 'Adaptive: Scaffold'
                : 'Adaptive: Balanced'}
            </span>
          </div>
        </div>

        {/* Right: Accessibility Controls (TTS, Dyslexia Font, Hint) */}
        <div className="flex items-center gap-1.5">
          {/* Smart Hint Button */}
          <button
            type="button"
            onClick={() => {
              setShowHint(!showHint);
              if (onHintUsed) onHintUsed();
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              showHint
                ? 'bg-amber-500 text-white shadow-sm'
                : 'border border-border/80 bg-background text-muted-foreground hover:border-amber-500/40 hover:text-foreground'
            }`}
            title="Reveal conceptual hint without giving away the answer"
            data-testid="button-smart-hint"
          >
            <HelpCircle size={13} />
            <span className="hidden sm:inline">Hint</span>
          </button>

          {/* Text to Speech Button */}
          <button
            type="button"
            onClick={toggleTTS}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              isSpeaking
                ? 'bg-primary text-primary-foreground shadow-sm animate-pulse'
                : 'border border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
            title={isSpeaking ? 'Stop reading' : 'Read question aloud (Text-to-Speech)'}
            data-testid="button-tts"
          >
            {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="hidden sm:inline">{isSpeaking ? 'Speaking…' : 'Read'}</span>
          </button>

          {/* Dyslexia / High Legibility Toggle */}
          <button
            type="button"
            onClick={toggleDyslexia}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
              settings.dyslexiaFont
                ? 'bg-secondary text-secondary-foreground shadow-sm'
                : 'border border-border/80 bg-background text-muted-foreground hover:border-secondary/40 hover:text-foreground'
            }`}
            title="Toggle dyslexia-friendly font and high-contrast spacing"
            data-testid="button-dyslexia-font"
          >
            <Type size={13} />
            <span className="hidden sm:inline">Font</span>
          </button>
        </div>
      </div>

      {/* Expandable Smart Hint Card */}
      {showHint && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-foreground shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-600 dark:text-amber-400">Tutor Guidance Hint</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{hintText}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
