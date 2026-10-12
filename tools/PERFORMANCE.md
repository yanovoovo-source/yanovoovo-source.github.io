# Animation and scrolling check

Run `node tools/check-site.mjs` for five-page checks at 320, 375, 768 and 1440 px.
Run `node tools/check-site.mjs --profile` for a repeatable scrolling comparison.

## 2026-10-12 comparison

Same local Chrome, headless with GPU disabled, 900 px viewport height. Each sample
scrolls the homepage for two seconds while the chosen weather is active.
These are requestAnimationFrame callbacks, not measured display presentations or
a guarantee of performance on every phone. Cold-network loading is not included.

| Width | Weather | Before: callbacks / slow frames | After: callbacks / slow frames |
| --- | --- | --- | --- |
| 375 | clear | 112 / 8 | 121 / 0 |
| 375 | rain | 59 / 41 | 121 / 0 |
| 375 | snow | 63 / 48 | 122 / 0 |
| 1440 | clear | 61 / 41 | 121 / 0 |
| 1440 | rain | 26 / 24 | 121 / 0 |
| 1440 | snow | 26 / 23 | 121 / 0 |

Slow means a callback interval longer than 25 ms. The first optimized run also
recorded zero layout time during both snowfall samples (previously 20 / 14 ms).
Re-running the benchmark will produce different numbers; retain the same browser
flags, viewport sizes and machine load when comparing.

Changes: one canvas with cached snow sprites and batched rain strokes; adaptive
particle budget; decoded two-layer background crossfades; removal of large live
backdrop blurs; transform-based snow accumulation and pet dragging; animation and
snow-growth work suspended when the document is hidden. Regression checks include
real mouse and touch input, rapid background switching, reduced-motion support,
music controls, and mobile overflow.
