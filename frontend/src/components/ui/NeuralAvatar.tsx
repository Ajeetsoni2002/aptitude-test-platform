// src/components/ui/NeuralAvatar.tsx
// User avatar: photo if we have one, otherwise initials on a neutral disc.
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


const getInitials = (name: string) =>
  name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';


const NeuralAvatar = ({ name, size = 'md', showRing = false, className, imageUrl }: NeuralAvatarProps) => {
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const normalizedImageUrl = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);
  const { px, font } = sizeMap[size];

  const shouldShowImage = Boolean(normalizedImageUrl && failedUrl !== normalizedImageUrl);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 font-mono font-bold',
        showRing && 'ring-1 ring-line ring-offset-2 ring-offset-canvas',
        font,
        className
      )}
      style={{
        width: px,
        height: px,
        background: 'rgb(var(--ink) / .1)',
        color: 'rgb(var(--ink))',
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
