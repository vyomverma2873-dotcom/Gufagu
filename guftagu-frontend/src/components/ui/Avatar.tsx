import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export default function Avatar({ src, alt = '', size = 'md', isOnline, className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const onlineSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'rounded-full object-cover bg-zinc-800',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-white font-medium',
            sizes[size]
          )}
        >
          {getInitials(alt || 'U')}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-zinc-900',
            onlineSizes[size],
            isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
          )}
        />
      )}
    </div>
  );
}
