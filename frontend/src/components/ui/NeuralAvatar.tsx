// src/components/ui/NeuralAvatar.tsx
// User avatar: photo if we have one, otherwise initials on a tinted disc.
// The tint is picked from the name so the same person always gets the
// same colour.
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/utils/imageUtils';

interface NeuralAvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** kept for API compatibility; draws a thin ring when true */
  showRing?: boolean;
  className?: string;
  imageUrl?: string;
}

const sizeMap = {
  sm: { px: 32, font: 'text-xs' },
  md: { px: 44, font: 'text-sm' },
  lg: { px: 64, font: 'text-lg' },
  xl: { px: 96, font: 'text-3xl' },
};

const TINTS = ['brand', 'plum', 'clay', 'green', 'amber'];

const getInitials = (name: string) =>
  name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const tintFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

const NeuralAvatar = ({ name, size = 'md', showRing = false, className, imageUrl }: NeuralAvatarProps) => {
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const normalizedImageUrl = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);
  const { px, font } = sizeMap[size];
  const tint = tintFor(name || '?');

  const shouldShowImage = Boolean(normalizedImageUrl && failedUrl !== normalizedImageUrl);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 font-display font-semibold',
        showRing && 'ring-1 ring-line ring-offset-2 ring-offset-canvas',
        font,
        className
      )}
      style={{
        width: px,
        height: px,
        background: `rgb(var(--${tint}) / .16)`,
        color: `rgb(var(--${tint}))`,
      }}
    >
      {shouldShowImage ? (
        <img
          src={normalizedImageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(normalizedImageUrl)}
          loading="lazy"
        />
      ) : (
        <span aria-label={name}>{getInitials(name)}</span>
      )}
    </div>
  );
};

export default NeuralAvatar;
