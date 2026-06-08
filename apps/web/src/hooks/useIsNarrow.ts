import { useEffect, useState } from 'react';

/** True when the viewport is below the given breakpoint (default 768px). */
export function useIsNarrow(breakpoint = 768): boolean {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return narrow;
}
