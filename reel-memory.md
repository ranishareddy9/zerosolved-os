# Reel Memory

Lasting feedback on Zerosolved reels. The **Reel Maker agent reads this file before every job** and applies every entry. When an entry conflicts with the `reel-playbook` skill, the newer dated entry wins until the playbook is updated to match.

## What gets saved (and what doesn't)

**Save** feedback that should change *every future reel*:
- Preferences about pacing, length, scene order, motion, music, tone, CTA, colors or type.
- "Always / never" statements ("never use the compare scene", "always lead with the stat").
- Corrections that reveal a general rule. For example, "that stat had no source" becomes a rule about sourcing.

**Don't save** one-off fixes that only apply to the current reel:
- Typo fixes, rewording a single headline, swapping one icon.
- "Make *this* card orange", "shorten *this* line", a different student idea for *this* case.
- Facts about a single case (they live in `reel-maker/sources/` and the spec).

**Test before saving:** *"Would I apply this to a reel about a completely different case?"* If not, don't save it.

**How to save:**
- Add one line under **Entries**: `- YYYY-MM-DD · area · rule — why (source)`.
- Keep rules short and concrete. Don't duplicate an existing entry; update it and change its date.
- Delete entries the owner reverses.
- When three or more entries touch the same area, propose folding them into the playbook.

**Areas:** `facts` · `structure` · `timing` · `motion` · `music` · `voice` · `cta` · `look` · `export` · `process`

## Entries

- 2026-11-09 · facts · Every number on screen must come from the case file (the saved source text). Never invent, estimate, round up or combine figures, and always show the source and year — this keeps the "no unverified numbers" voice (owner rule; enforced by `render.mjs`).
- 2026-11-09 · structure · 6 scenes, ~35 s: logo sting → hook → case in 30 seconds → audience A → audience B → end card — tighter than the 7-scene, 42 s first cut (owner interview).
- 2026-11-09 · structure · Drop the "chatbot vs case file" scene from the default arc; use it only on request (owner interview).
- 2026-11-09 · structure · Pick the audience order per case: founders first when there's a clear paying buyer plus a cost figure, otherwise students first (owner interview).
- 2026-11-09 · timing · Short logo (1.5 s), then the hook. The problem must be on screen by about 2 s (owner interview). Updated 2026-11-17: the intro is now a cold open that shows the hook from frame 0 (see the 2026-11-17 look entry).
- 2026-11-09 · timing · Text density and ~6–7 s holds are about right. Don't add more text per scene (owner interview).
- 2026-11-09 · motion · Calmer, not flashy: small tilts, no springs or overshoot, soft fades (owner interview).
- 2026-11-09 · music · Keep the generated track. No voiceover and no third-party audio (owner).
- 2026-11-09 · cta · The end-card CTA is always exactly "Explore Zerosolved.com →" (owner interview).
- 2026-11-09 · voice · Write "Zerosolved" in all text and use 971 case files (owner).
- 2026-11-15 · facts · Put the case file's "verified YYYY-MM-DD" (copied exactly) in the hook card's source line and in the foot of any cost or market card, next to "modeled from public data" and the case ID — "sources" was the lowest rubric criterion (3/5 on ZS-0270 and ZS-0444 without a year; 4/5 with one). Keep the source line short enough for one line (source: self-improve, trial avg 28.67 vs 28.0 on ZS-0270, ZS-0444, ZS-0036).
- 2026-11-17 · look · Frame 0 is the Instagram grid cover, so it must never be black. The intro scene is now a cold open: the wordmark plus the hook (the next scene's headline, or the intro's own `"hook"`) fully on screen from the first frame. Don't set `"coldOpen": false` or add `line1`/`line2` to the intro (owner: black tiles on the grid).
- 2026-11-17 · voice · Write the hook for a thumb that is still scrolling. 3–6 words naming the pain or the surprise, not the topic ("The cloud bill surprise." beats "Cloud cost monitoring."). Use a concrete noun from the case, put the 1–2 lime words on the pain, use no question marks or numbers, and keep it readable on the grid tile (max 2 lines at 112px) (owner: "need the best hook").
