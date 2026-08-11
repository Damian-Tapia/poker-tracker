'use client';

interface Props {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-14 w-14 text-xl' };

function initials(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function Avatar({ name, avatar, size = 'md', className = '' }: Props) {
  const isEmoji = avatar && /^\p{Emoji}/u.test(avatar);
  return (
    <div
      className={`
        flex shrink-0 items-center justify-center rounded-full
        border-2 border-brass-700 bg-felt-700 font-semibold text-brass-300
        ${sizes[size]} ${className}
      `}
    >
      {isEmoji ? avatar : initials(name)}
    </div>
  );
}
