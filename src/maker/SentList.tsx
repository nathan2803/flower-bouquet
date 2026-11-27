import React, { useState } from 'react';
import { DEFAULT_PALETTE } from '../bouquet/config';
import { FONTS } from '../bouquet/fonts';
import type { BouquetProps } from '../bouquet/types';
import { readPastedLink } from '../share';
import { FlowerThumb } from './FlowerPicker';
import { removeSent, restoreSent, type SentGift, type SentHow } from './sent';

const HOW_LABEL: Record<SentHow, string> = {
  link: 'link copied',
  share: 'shared',
  qr: 'QR code',
  image: 'image saved',
  opened: 'opened by you',
};

const when = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

type Props = {
  sent: SentGift[];
  onChange: (list: SentGift[]) => void;
  onEdit: (gift: BouquetProps) => void;
};

/**
 * "Gifts you've sent": every gift whose link left the maker on this device,
 * newest first, with its link, whether it still opens, and a way to edit it.
 */
export const SentList: React.FC<Props> = ({ sent, onChange, onEdit }) => {
  const [note, setNote] = useState<{ text: string; undo?: SentGift[] } | null>(null);
  const rows = sent.map((s) => ({ ...s, read: readPastedLink(s.link) }));
  const live = rows.filter((r) => r.read.kind === 'gift').length;

  const copy = async (s: SentGift) => {
    try {
      await navigator.clipboard.writeText(s.link);
      setNote({ text: `Copied the link for ${s.to}.` });
    } catch {
      setNote({ text: 'Couldn’t copy automatically. Open the gift and copy the address instead.' });
    }
  };

  const remove = (s: SentGift) => {
    const before = sent;
    onChange(removeSent(s.code));
    const stillOpens = readPastedLink(s.link).kind === 'gift';
    setNote({ text: `Removed the gift for ${s.to} from this list.${stillOpens ? ' Its link still works.' : ''}`, undo: before });
  };

  return (
    <section className="panel-section sent" aria-labelledby="sec-sent">
      <div className="section-head">
        <h2 id="sec-sent" style={{ fontFamily: FONTS.serif }}>
          Gifts you’ve sent
        </h2>
        {sent.length > 0 && (
          <span className="count">
            {sent.length} {sent.length === 1 ? 'gift' : 'gifts'}
            {live < sent.length ? ` · ${live} still open` : ''}
          </span>
        )}
      </div>

      {sent.length === 0 ? (
        <p className="hint">
          When you copy, share or save a gift, it’s listed here so you can find its link again or fix it later. The list stays in this
          browser; gifts sent before 28 Nov 2026 aren’t in it.
        </p>
      ) : (
        <>
          <ul className="sent__list">
            {rows.map((s) => {
              const retired = s.read.kind !== 'gift';
              return (
                <li key={s.code} className={`sent__item ${retired ? 'is-retired' : ''}`}>
                  <FlowerThumb type={s.hero.type} color={s.hero.color} palette={DEFAULT_PALETTE} size={52} />
                  <div className="sent__main">
                    <p className="sent__to" style={{ fontFamily: FONTS.serif }}>
                      For {s.to}
                      <span className={`sent__status ${retired ? 'sent__status--down' : ''}`}>{retired ? 'Taken down' : 'Opens'}</span>
                    </p>
                    <p className="sent__msg">{s.message}</p>
                    <p className="sent__meta">
                      From {s.from} · {s.flowers} flowers · {when.format(s.lastAt)}
                      {s.how.length > 0 && ` · ${s.how.map((h) => HOW_LABEL[h]).join(', ')}`}
                    </p>
                  </div>
                  <div className="sent__actions">
                    <button type="button" className="btn btn--quiet" onClick={() => copy(s)} disabled={retired}>
                      Copy link
                    </button>
                    {s.read.kind === 'gift' && (
                      <button type="button" className="btn btn--quiet" onClick={() => onEdit((s.read as { gift: BouquetProps }).gift)}>
                        Edit
                      </button>
                    )}
                    <button type="button" className="btn btn--quiet" onClick={() => remove(s)} aria-label={`Remove the gift for ${s.to} from this list`}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="hint">
            Kept in this browser only. It can’t tell whether a gift has been opened, and removing one here doesn’t stop its link working.
          </p>
        </>
      )}
      <p className="send__status" role="status">
        {note?.text}
        {note?.undo && (
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => {
              restoreSent(note.undo!);
              onChange(note.undo!);
              setNote(null);
            }}
          >
            Undo
          </button>
        )}
      </p>
    </section>
  );
};
