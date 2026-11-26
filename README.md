# A digital flower bouquet

An animated bouquet gift made in [Remotion](https://www.remotion.dev) (React + TypeScript).
It renders to an MP4, and it also runs as a static web page for GitHub Pages, with a maker page
for designing your own bouquet and sending it as a link. The gift itself has:

- a **Tap to open** cover,
- a music-box tune you can mute,
- a **Breeze** button that sends a gust through the flowers,
- after the 12-second intro the bouquet **keeps swaying** and dropping petals. It never cuts off;
  **Watch again** replays the intro.

Everything is drawn with inline SVG. There are no images or audio files to host. The fonts
(Fraunces and Caveat) load from Google Fonts and fall back to system serif and cursive fonts.

## Run it

```bash
npm install
npm run dev       # the gift page at http://localhost:5173
npm run studio    # Remotion Studio: every preset as its own composition
npm run render    # out/bouquet.mp4 (1080 × 1920, 30 fps, 12 s)
npm run build     # static site in dist/
```

## Make one and send it

Open the site. The main page is the **maker**:

1. Type who it's to, who it's from, and your message.
2. Pick a ready-made mix, a holder (paper wrap, basket, vase, hatbox, hand-tied) and a shape.
3. Add, remove and recolour flowers. Each one has size, position, tilt, leaves, and (for some) petals and centre colour.
4. Set the ribbon, container and other colours.
5. Tap **Copy gift link** (or **Share…** on a phone) and send it.

The whole design is stored inside the link (`?g=…`), so there's no account or database. Anyone
with the link can see the note. Whoever opens it gets the **Tap to open** gift.

The short form still works for quick links:
`?to=Sam&from=Alex&msg=Happy%20birthday!&preset=lilyVase` (presets: `classic`, `blush`, `sunday`,
`lavender`, `sunflowerBasket`, `lilyVase`, `peonyBox`, `wildflowerPosy`). Add `&frame=400` to open on
a still frame.

## Hosting on GitHub Pages

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main` (repository
**Settings → Pages → Source: GitHub Actions**). `vite.config.ts` uses `base: './'`, so it works under
any repository name.

## Customise

The maker covers most of this without code. To change the defaults (what the maker starts with,
and what an MP4 render shows), edit [`src/bouquet/config.ts`](src/bouquet/config.ts).

### The bouquet

```ts
export const defaultBouquetProps = {
  recipientName: 'Amelia',
  message: 'Happy birthday! …',
  senderName: 'Theo',
  heading: 'a little something for',
  signoff: 'with love,',
  container: 'wrap',     // 'wrap' | 'basket' | 'vase' | 'box' | 'none'
  arrangement: 'dome',   // 'dome' | 'tall' | 'wide' | 'cascade' | 'posy'
  palette: DEFAULT_PALETTE,
  flowers: DEFAULT_FLOWERS,
};
```

| Container | What it is                                                       |
| --------- | ---------------------------------------------------------------- |
| `wrap`    | Kraft paper folds with tissue and a ribbon bow                   |
| `basket`  | Woven basket with a handle; bow on the handle                    |
| `vase`    | Glass vase with water; stems show through the glass              |
| `box`     | Striped hatbox with a ribbon band                                |
| `none`    | A hand-tied posy: stems bound with ribbon                        |

| Arrangement | Shape                                                                |
| ----------- | -------------------------------------------------------------------- |
| `dome`      | Rounded, the classic bouquet                                         |
| `tall`      | Narrow and upright                                                   |
| `wide`      | Low and spreading                                                    |
| `cascade`   | Auto-placed flowers spill over the front of the container            |
| `posy`      | Small and tight                                                      |

Palette keys: `background`, `rose`, `butter`, `sage`, `kraft`, `ink`, `tissue`, `ribbon`, `cream`,
`wicker` (basket), `glass` (vase), `box` (hatbox).

### Each flower

```ts
{ type: 'lily', color: '#FBEFEA', centerColor: 'rose', x: -0.3, y: 0.8, scale: 1.1 }
```

| Field         | Meaning                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `type`        | One of the 17 types below                                                     |
| `color`       | A palette key (`'rose'`) or any hex (`'#F2A17E'`). Each type has a default    |
| `centerColor` | Centre / throat colour (daisy, sunflower, cosmos, anemone, lily, ranunculus)  |
| `petals`      | Petal count (daisy, sunflower, cosmos, anemone, lily)                         |
| `leaves`      | Leaves on the stem, 0–3                                                       |
| `stemColor`   | Stem colour                                                                   |
| `x`           | −1 (far left) to 1 (far right)                                                |
| `y`           | 0 (just above the container) to 1 (top). Negative spills over the front       |
| `scale`       | Size multiplier                                                               |
| `tilt`        | Head rotation in degrees                                                      |
| `delay`       | Extra frames before this stem starts growing                                  |

Leave out `x` and `y` and the flower is placed automatically. Stems grow in list order, and lower
flowers are drawn in front.

**Blooms:** `rose`, `tulip`, `daisy`, `ranunculus`, `lily`, `peony`, `sunflower`, `carnation`,
`cosmos`, `hydrangea`, `anemone`.
**Greenery and sprays:** `eucalyptus`, `babysBreath`, `lavender`, `fern`, `forgetMeNot`, `berries`.

**Adding your own type:** add its name to `HeadType` or `FillerType` in
[`src/bouquet/types.ts`](src/bouquet/types.ts) and an entry to `FLOWER_TYPES` in
[`src/bouquet/flowers.ts`](src/bouquet/flowers.ts). A `head` draws a bloom around (0, 0) and uses
`bloom(delay)` for each petal's spring; a `filler` grows along the stem.

### Presets

`PRESETS` in `config.ts` holds eight ready-made compositions. Use one in a link (`?preset=peonyBox`),
in code (`{ ...defaultBouquetProps, ...PRESETS.peonyBox }`), or copy one as the starting point for your own.

## Rendering an MP4 with your text

```bash
npx remotion render src/remotion/index.ts Bouquet out/gift.mp4 \
  --props='{"recipientName":"Sam","senderName":"Alex","container":"basket","message":"You make every day brighter."}'
```

`Bouquet-breeze` shows a gust at 10 s. To put gusts in your own video, pass `"gusts":[300]`
(frame numbers) in `--props`.

## Music

Put an mp3 in `public/` (for example `public/song.mp3`), then create a `.env` file containing
`VITE_AUDIO_SRC=./song.mp3`. Without it, the page plays the built-in music box. The breeze makes a soft
whoosh either way. The MP4 has no audio; add a Remotion `<Audio>` to the composition if you want sound
in the video.

## How it's built

```
src/
  App.tsx                  Routes: the maker, or a gift when the link has one
  Builder.tsx              The maker page: live preview, flower list, colours, Copy link
  Gift.tsx                 Gift page: cover, music, breeze, endless hold
  share.ts                 Packs a design into the link and reads it back safely
  audio/musicBox.ts        Web Audio music box and breeze whoosh
  remotion/Root.tsx        Compositions (Bouquet, Bouquet-breeze, one per preset)
  bouquet/
    BouquetComposition.tsx Layer order for the whole scene
    Flower.tsx             One stem: stem layer and head layer
    flowers.ts             Flower library, arrangements, layout, sway and breeze bend
    containers.ts          Basket, vase, hatbox, posy and the bow
    WrappingPaper.tsx      Kraft wrap and tissue
    Container.tsx          Container components
    NoteCard.tsx · card.ts Note card
    Opening.tsx · openingModel.ts  Wax seal, sparkles, heading
    FloatingPetals.tsx · petals.ts Drifting and blown petals
    PaperBackground.tsx    Paper colour, grain and vignette
    timing.ts              Choreography, springs, ambient loop and gusts
    geometry.ts            Colour, path and bezier helpers
    config.ts / types.ts   Defaults, presets and prop types
scripts/canvas/            Bundles the same scene code for the Design canvas preview
```

All motion is computed from `useCurrentFrame()` (with `spring()` and `interpolate()`) plus the list of
gust frames. Nothing uses CSS keyframes, timers or `Math.random`, so every frame renders the same way in
the Studio, the Player and the MP4. Ambient motion repeats exactly every 720 frames, which is why the
hold can loop without a seam. With `prefers-reduced-motion` the sway is gentler, and the page pauses
when its tab is hidden.

`npm run canvas:bundle` rebuilds the scene bundle used by the Design canvas preview
(`out/canvas-scene.js`).

Remotion is free for individuals and small teams. See the [Remotion license](https://www.remotion.dev/license).
