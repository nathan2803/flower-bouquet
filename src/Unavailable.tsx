import React, { useEffect } from 'react';
import { FONTS } from './bouquet/fonts';

const COPY = {
  retired: {
    title: 'This gift is no longer available',
    body: 'The person who sent it has taken it down.',
  },
  broken: {
    title: 'This link doesn’t open',
    body: 'Part of it may have been cut off when it was copied. Ask the person who sent it to send it again.',
  },
};

/** Shown instead of a gift whose link was retired, or that can't be read. */
export const Unavailable: React.FC<{ reason: keyof typeof COPY }> = ({ reason }) => {
  const { title, body } = COPY[reason];
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <main className="page">
      <div className="stage">
        <div className="cover">
          <div className="cover__inner">
            <svg className="cover__seal unavailable__seal" viewBox="-80 -80 160 160" aria-hidden="true">
              <circle r="72" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 9" strokeLinecap="round" />
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-22" rx="14" ry="22" fill="none" stroke="currentColor" strokeWidth="3" transform={`rotate(${a})`} />
              ))}
              <circle r="8" fill="currentColor" />
            </svg>
            <h1 className="unavailable__title" style={{ fontFamily: FONTS.serif }}>
              {title}
            </h1>
            <p className="unavailable__body">{body}</p>
          </div>
        </div>
      </div>
    </main>
  );
};
