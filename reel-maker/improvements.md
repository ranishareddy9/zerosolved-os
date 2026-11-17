# Reel self-improvement log

The weekly **Reel Self-Improve** routine writes here. Each run makes at most one change, either a `reel-memory.md` line or an `.claude/skills/auto-*` skill, and keeps it only if test previews of 3 past cases score higher with it. The Reel Maker agent reads this file before every reel.

Rules: no protected file is ever edited (`.claude/protected-files.txt`), `reel-playbook` is never edited directly, and the numbers rule can never be weakened. `node reel-maker/scoring/score.mjs status` reads the table below.

`action` is one of: `kept` (change committed), `discarded` (tested, didn't help), `skipped` (fewer than 5 new scored reels, or no clear gap), `revert` (a kept change rolled back).

| date | action | change | evidence | before | after | commit |
|---|---|---|---|---|---|---|
| 2026-11-15 | kept | reel-memory.md: verified date from the case file goes on the hook card source line and cost/market card foot | trial avg 28.67 vs 28.0 on ZS-0270, ZS-0444, ZS-0036; 0 failed checks | 28.0 | 28.67 | a863496 |
