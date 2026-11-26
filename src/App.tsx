import React, { useMemo } from 'react';
import { Builder } from './Builder';
import { Gift } from './Gift';
import { giftFromUrl } from './share';

/**
 * The plain site URL opens the maker. A gift link (`?g=…`, or the simple
 * `?to=…&preset=…` form) opens the gift itself.
 */
export const App: React.FC = () => {
  const { gift, still } = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const frame = Number(q.get('frame'));
    return { gift: giftFromUrl(window.location.search), still: Number.isFinite(frame) && frame > 0 ? frame : null };
  }, []);
  if (!gift) return <Builder />;
  return <Gift gift={gift} still={still} makeHref={window.location.pathname} />;
};
