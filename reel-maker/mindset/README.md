# Mindset reels and posts

A second Zerosolved format, separate from the case-file reels: minimal black pictogram reels (17 s, 1080×1920) and one-line image posts (1080×1350), inspired by the owner's references (see `reference/STYLE.md`). The **Mindset posts (cloud)** routine makes one reel and one image post at 8 AM and 8 PM IST and posts both to Instagram.

## Commands (run from `reel-maker/`)
```
node mindset/render-mindset.mjs mindset/specs/<id>.json --preview   # reel: 6 stills + sheet in mindset/previews/<id>/
node mindset/render-mindset.mjs mindset/specs/<id>.json             # reel → output/video/<id>.mp4 (about 1–2 min)
node mindset/render-mindset.mjs mindset/specs/<post-id>.json        # post → output/instagram/<post-id>.jpg
```
Fix every `Spec errors`, `STYLE WARNINGS` and `LAYOUT WARNINGS` line before the final render.

## Reel spec
```json
{
  "id": "mr-2026-11-16-am",
  "type": "reel",
  "kicker": "builder notes · guesser vs solver",
  "title": "Two ways to pick [lime]what to build.[/lime]",
  "lanes": [
    { "label": "guesser", "sub": "builds first", "motion": "restart", "object": "bricks", "color": "orange" },
    { "label": "solver",  "sub": "asks first",   "motion": "steady",  "object": "bricks", "color": "lime" }
  ],
  "punchline": "Same effort. A [lime]real problem[/lime] underneath.",
  "caption": "…",
  "music": { "seed": 11 }
}
```
- **Lanes:** exactly 2. Left is the struggling side (`color: "orange"`), right is the Zerosolved way (`color: "lime"`). Labels ≤ 16 characters; `sub` is a few lowercase words.
- **motion:** `steady` (builds the whole time, stands tall at the end), `restart` (builds, crumbles, three times, ends sitting), `stall` (starts, then stops to think), `idle` (only thinks), `late` (thinks, then builds), `burst` (builds fast, then burns out sitting). The two lanes must use different motions; the right lane is normally `steady` or `late`.
- **object:** `bricks` (a wall) or `stairs` (the figure climbs as it builds).
- **title:** sentence case, ends with a period, max 2 lines, 1–3 `[lime]` words. **punchline:** the same rules; it appears at 11.6 s. The end card (wordmark, "Stop guessing. Start solving.", "Explore Zerosolved.com →") is automatic.
- Change `music.seed` (any whole number) between reels so the generated track varies.

## Post spec
```json
{ "id": "mp-2026-11-16-am", "type": "post", "kicker": "builder notes",
  "text": "Ideas are cheap. [lime]Problems[/lime] are what people pay for.", "caption": "…" }
```
or an equation:
```json
{ "id": "mp-2026-11-16-pm", "type": "post", "variant": "equation", "kicker": "builder notes",
  "terms": [ {"word": "idea", "label": "you"}, {"op": "+"}, {"word": "silence", "label": "users"}, {"op": "="}, {"word": "[lime]hobby[/lime]", "label": "result"} ],
  "line": "Start with a [lime]problem[/lime], not an idea.", "caption": "…" }
```
- **text:** one or two short sentences, max 5 lines, 1–3 lime words, ends with a period.
- **equation:** 3 terms max, one short word each (no spaces), ops `+ − = ≠ × ÷ > <`, labels one word.

## Rules (the renderer enforces the first three)
- **No digits anywhere** — title, labels, punchline, text, terms or caption. These pieces have no case file, and every number must come from a case file.
- No exclamation marks. Write the name as "Zerosolved".
- Sentence case with a period; 1–3 lime words on the key idea (opportunity), never decoration.
- Original lines only: never reuse the reference creator's concepts or wording, and don't repeat anything in `mindset/history.json`.
- Generated music only (no Instagram or third-party songs).

## Caption
1–2 short lines that restate the idea for founders and students, then a blank line, `Stop guessing. Start solving.`, `Explore Zerosolved.com →`, and 3–5 hashtags without digits (for example `#buildinpublic #startupideas #founders #studentprojects #zerosolved`).
