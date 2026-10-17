import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Check, X, ShieldCheck } from 'lucide-react';
import {
  useUserAvatar,
  setUserAvatar,
  randomizeUserAvatar,
  AVATAR_SPECS,
  type AvatarSpec,
  type AvatarCategory,
} from '@/lib/avatar-generator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AnimatedAvatarProps {
  username?: string;
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const SIZE_MAP = {
  xs: { container: 'h-7 w-7 text-sm', emoji: 'text-sm', badge: 'h-2 w-2' },
  sm: { container: 'h-9 w-9 text-base', emoji: 'text-base', badge: 'h-2.5 w-2.5' },
  md: { container: 'h-11 w-11 text-xl', emoji: 'text-xl', badge: 'h-3 w-3' },
  lg: { container: 'h-14 w-14 text-2xl', emoji: 'text-2xl', badge: 'h-3.5 w-3.5' },
  xl: { container: 'h-20 w-20 text-4xl', emoji: 'text-4xl', badge: 'h-4 w-4' },
};

export function AnimatedAvatar({
  username,
  avatarId,
  size = 'md',
  showBadge = false,
  className = '',
  onClick,
}: AnimatedAvatarProps) {
  const [userAvatar] = useUserAvatar(username);
  const avatar = avatarId ? AVATAR_SPECS.find((a) => a.id === avatarId) || userAvatar : userAvatar;
  const sizeCfg = SIZE_MAP[size];

  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.08, rotate: [0, -3, 3, 0] } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      className={`relative flex shrink-0 items-center justify-center rounded-2xl border ${avatar.borderColor} bg-gradient-to-br ${avatar.bgColor} shadow-sm backdrop-blur-md transition-shadow hover:shadow-md ${sizeCfg.container} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Floating Animated Mascot Emoji */}
      <motion.span
        animate={{
          y: [0, -1.5, 0, 1.5, 0],
          scale: [1, 1.04, 1, 0.98, 1],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`select-none ${sizeCfg.emoji} leading-none drop-shadow-xs`}
        role="img"
        aria-label={avatar.name}
      >
        {avatar.emoji}
      </motion.span>

      {/* Online / Active Pulse Badge */}
      {showBadge && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-emerald-500 ring-1 ring-background ${sizeCfg.badge}`} />
      )}
    </motion.div>
  );
}

// Full Interactive Mascot Customization Modal
export function AvatarCustomizerModal({
  open,
  onOpenChange,
  username,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
}) {
  const [currentAvatar, setAvatar] = useUserAvatar(username);
  const [activeCategory, setActiveCategory] = useState<AvatarCategory | 'all'>('all');
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSelectAvatar = (spec: AvatarSpec) => {
    setAvatar(spec.id);
  };

  const handleRandomize = () => {
    setIsSpinning(true);
    if (username) {
      const next = randomizeUserAvatar(username);
      setAvatar(next.id);
    }
    setTimeout(() => setIsSpinning(false), 400);
  };

  const filteredAvatars =
    activeCategory === 'all'
      ? AVATAR_SPECS
      : AVATAR_SPECS.filter((a) => a.category === activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Choose Your Study Mascot</span>
            <Sparkles size={16} className="text-amber-500" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select an animated animal, plant, or flower avatar for your active recall desk.
          </DialogDescription>
        </DialogHeader>

        {/* Current Active Mascot Spotlight */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-background/60 p-3.5 shadow-inner">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${currentAvatar.borderColor} bg-gradient-to-br ${currentAvatar.bgColor} text-3xl shadow-sm`}>
            <motion.span
              key={currentAvatar.id}
              initial={{ scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {currentAvatar.emoji}
            </motion.span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground leading-tight">{currentAvatar.name}</h4>
              <span className="rounded-md bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
                {currentAvatar.category}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{currentAvatar.tagline}</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleRandomize}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Randomize mascot"
          >
            <RefreshCw size={14} className={isSpinning ? 'animate-spin' : ''} />
          </motion.button>
        </div>

        {/* Category Tabs */}
        <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-semibold text-muted-foreground">
          {(['all', 'animal', 'plant', 'flower'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 rounded-lg py-1.5 text-center transition-colors cursor-pointer ${
                activeCategory === cat ? 'bg-card text-foreground font-bold shadow-xs' : 'hover:text-foreground'
              }`}
            >
              {cat === 'all' && 'All (18)'}
              {cat === 'animal' && '🐾 Fauna'}
              {cat === 'plant' && '🌿 Flora'}
              {cat === 'flower' && '🌸 Blooms'}
            </button>
          ))}
        </div>

        {/* Mascot Grid */}
        <div className="grid grid-cols-6 gap-2 max-h-52 overflow-y-auto p-1">
          {filteredAvatars.map((spec) => {
            const isSelected = spec.id === currentAvatar.id;
            return (
              <motion.button
                key={spec.id}
                type="button"
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectAvatar(spec)}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border text-xl transition-all cursor-pointer ${
                  isSelected
                    ? `border-primary bg-gradient-to-br ${spec.bgColor} ring-2 ring-primary/40 shadow-sm`
                    : 'border-border/70 bg-background/80 hover:border-primary/50'
                }`}
                title={`${spec.name} - ${spec.tagline}`}
              >
                <span>{spec.emoji}</span>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3">
          <span className="text-[11px] text-muted-foreground">Saved automatically to your profile</span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105 active:scale-[0.98] cursor-pointer"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
