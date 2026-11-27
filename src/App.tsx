import React, { useMemo } from 'react';
import { Builder } from './Builder';
import { Gift } from './Gift';
import { readLink } from './share';
import { Unavailable } from './Unavailable';

/**
 * The plain site URL opens the maker. A gift link (`?b=…`) opens the gift.
 * Retired links (older versions, `?g=…`, `?to=…`) say the gift is no longer
 * available; links that can't be read say so too.
 */
export const App: React.FC = () => {
  const { link, still } = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const frame = Number(q.get('frame'));
    return { link: readLink(window.location.search), still: Number.isFinite(frame) && frame > 0 ? frame : null };
  }, []);
  if (link.kind === 'maker') return <Builder />;
  if (link.kind === 'gift') return <Gift gift={link.gift} still={still} />;
  return <Unavailable reason={link.kind} />;
};
