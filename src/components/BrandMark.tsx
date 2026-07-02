import { GraduationCap } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export function BrandMark({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const s = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const icon = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s} rounded-xl bg-brand-gradient flex items-center justify-center glow-shadow`}>
        <GraduationCap className={`${icon} text-white`} strokeWidth={2.4} />
      </div>
      {showText && (
        <div className="leading-tight">
          <div className={`font-display font-bold ${text}`}>{BRAND.short}<span className="text-primary">.</span></div>
          {size !== 'sm' && <div className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-0.5">Learning</div>}
        </div>
      )}
    </div>
  );
}
