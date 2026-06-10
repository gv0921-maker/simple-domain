import { ArrowRight } from 'lucide-react';

/** Small "scroll horizontally" hint shown only on mobile, above wide tables. */
export function MobileScrollHint({ label = 'Scroll horizontally to see more' }: { label?: string }) {
  return (
    <div className="md:hidden flex items-center gap-1 text-[11px] text-muted-foreground px-1">
      <span>{label}</span>
      <ArrowRight className="h-3 w-3" />
    </div>
  );
}