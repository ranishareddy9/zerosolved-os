// Zerosolved "mindset" format. Deterministic: window.__seek(t) draws the frame at t seconds.
// Reel (1080×1920, 17 s): two pictogram figures side by side, each with a label, building
// (bricks, stairs, ladder, path, plant, pyramid or chart) at a different pace; a punchline; then the Zerosolved end card.
// Post (1080×1350): one quote, or a word equation, on black.
(() => {
  const DUR = 17, A0 = 1.8, A1 = 11.6, PUNCH = 11.6, END = 14.2;
  const G = 1260;                       // ground line (reel)
  const LEG = 100, TOR = 92, ARM = 80, R = 27, GAP = 10, SW = 22;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const fadeIn = (t, a, d = 0.6) => ease((t - a) / d);
  const rad = (d) => (d * Math.PI) / 180;
  const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  const SVG = document.getElementById("scene"), TEXT = document.getElementById("text");
  const STAGE = document.getElementById("stage"), CHROME = document.getElementById("chrome");
  let spec = null, mode = "reel", H = 1920, lanes = [], el = {};

  function rich(node, s) {
    const re = /\[lime\]([\s\S]*?)\[\/lime\]/g; let i = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > i) node.appendChild(document.createTextNode(s.slice(i, m.index)));
      const sp = document.createElement("span"); sp.className = "lime"; sp.textContent = m[1]; node.appendChild(sp);
      i = re.lastIndex;
    }
    if (i < s.length) node.appendChild(document.createTextNode(s.slice(i)));
    return node;
  }
  function div(cls, parent = TEXT) { const d = document.createElement("div"); d.className = cls; parent.appendChild(d); return d; }

  // ---------- motions: progress p (0..1 of the object) and figure state over the action window ----------
  const WIN = A1 - A0;
  const MOTIONS = {
    steady: (u) => ({ p: 0.95 * u, state: u < 1 ? "work" : "proud" }),
    restart: (u) => {
      const c = Math.min(2, Math.floor(u * 3)), v = u * 3 - c;
      if (v < 0.78) return { p: (0.34 * v) / 0.78, state: "work" };
      return { p: 0, state: c === 2 ? "sit" : "think", collapse: { from: 0.34, s: ((v - 0.78) * WIN) / 3 } };
    },
    stall: (u) => ({ p: Math.min(0.3, u * 1.1), state: u * 1.1 < 0.3 ? "work" : "think" }),
    idle: () => ({ p: 0, state: "think" }),
    late: (u) => (u < 0.55 ? { p: 0, state: "think" } : { p: ((u - 0.55) / 0.45) * 0.8, state: u < 1 ? "work" : "proud" }),
    burst: (u) => ({ p: Math.min(0.45, u * 2.4), state: u * 2.4 < 0.45 ? "work" : "sit" }),
  };
  const POSES = {
    stand: { lean: 0, a1: 12, a2: -12, l1: 7, l2: -7, sit: 0, sw: 0, q: 0 },
    work: { lean: 36, a1: 80, a2: 40, l1: 18, l2: -16, sit: 0, sw: 1, q: 0 },
    think: { lean: -3, a1: 138, a2: -8, l1: 6, l2: -6, sit: 0, sw: 0, q: 1 },
    sit: { lean: 14, a1: 38, a2: 30, l1: 82, l2: 70, sit: 1, sw: 0, q: 0 },
    proud: { lean: -4, a1: 22, a2: -22, l1: 9, l2: -9, sit: 0, sw: 0, q: 0 },
  };
  const COLORS = { white: "#d6dae0", lime: "#a6cf2a", orange: "#e0753a" };
  const LABEL = { white: "#ffffff", lime: "#a6cf2a", orange: "#ff9357" };

  // pieces of each object, in build order: {x, y, w, h}
  function bricks(cx) {
    const x0 = cx - 50, out = [];
    for (let r = 0; r < 10; r++) {
      const y = G - (r + 1) * 31;
      if (r % 2 === 0) for (let k = 0; k < 4; k++) out.push({ x: x0 + k * 62, y, w: 58, h: 27 });
      else {
        out.push({ x: x0, y, w: 27, h: 27 });
        for (let k = 0; k < 3; k++) out.push({ x: x0 + 31 + k * 62, y, w: 58, h: 27 });
        out.push({ x: x0 + 217, y, w: 27, h: 27 });
      }
    }
    return out;
  }
  function stairs(cx) {
    const x0 = cx - 170, out = [];
    for (let i = 0; i < 7; i++) out.push({ x: x0 + i * 40, y: G - (i + 1) * 30, w: 38, h: (i + 1) * 30, step: i });
    return out;
  }

  // ladder: rails and rungs, built level by level; the figure climbs it
  function ladder(cx) {
    const x0 = cx - 30, out = [];
    for (let i = 0; i < 6; i++) {
      const y = G - (i + 1) * 40;
      out.push({ x: x0, y, w: 12, h: 40 }, { x: x0 + 108, y, w: 12, h: 40 }, { x: x0 + 12, y: y + 14, w: 96, h: 11, level: i + 1 });
    }
    return out;
  }
  // path: planks laid toward a flag; the figure walks along them
  function path(cx) {
    const x0 = cx - 200, out = [];
    for (let i = 0; i < 8; i++) out.push({ x: x0 + i * 48, y: G - 14, w: 44, h: 14 });
    return out;
  }
  // plant: a stem grows out of a pot, leaf by leaf, then blooms
  function plant(cx) {
    const sx = cx + 85, top = G - 70, out = [];
    for (let i = 0; i < 8; i++) {
      const y = top - (i + 1) * 34;
      out.push({ x: sx - 6, y, w: 12, h: 36 });
      out.push(i % 2 ? { x: sx + 7, y: y + 8, w: 62, h: 22, rx: 11 } : { x: sx - 69, y: y + 8, w: 62, h: 22, rx: 11 });
    }
    return out;
  }
  // pyramid: rows of blocks narrowing to a point
  function pyramid(cx) {
    const x0 = cx - 60, out = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 5 - r; k++) out.push({ x: x0 + r * 25 + k * 50, y: G - (r + 1) * 40, w: 46, h: 36 });
    return out;
  }
  // chart: bars that rise left to right, block by block
  function chart(cx) {
    const x0 = cx - 50, out = [];
    for (let c = 0; c < 5; c++) for (let k = 0; k <= c + 1; k++) out.push({ x: x0 + c * 52, y: G - (k + 1) * 34, w: 44, h: 30 });
    return out;
  }
  const BUILDERS = { bricks, stairs, ladder, path, plant, pyramid, chart };
  const STATIC = {
    path: (L) => { const fx = L.cx + 196, c = COLORS[L.color] || COLORS.white;
      return `<rect x="${fx}" y="${G - 170}" width="6" height="170" fill="#5b6472"/><path d="M${fx + 6} ${G - 170} l64 22 l-64 22 z" fill="${c}" opacity=".9"/>`; },
    plant: (L) => `<path d="M${L.cx + 25} ${G - 70} h120 l-16 70 h-88 z" fill="#5b6472"/>`,
  };

  function laneAt(L, t) {
    const u = clamp((t - A0) / WIN);
    const m = t < A0 ? { p: 0, state: L.motion === "idle" || L.motion === "late" ? "think" : "stand" } : MOTIONS[L.motion](u);
    if (t < A0 - 0.6) m.state = "stand";
    // figure position
    let fx, fy = G, dir = 1;
    if (L.object === "stairs") {
      const n = Math.floor(m.p * L.pieces.length);
      if (n === 0) fx = L.cx - 205; else { fx = L.pieces[n - 1].x + 19; fy = G - n * 30; }
    } else if (L.object === "ladder") {
      const rungs = L.pieces.slice(0, Math.floor(m.p * L.pieces.length)).filter((b) => b.level).length;
      fx = rungs === 0 ? L.cx - 150 : L.cx + 30; fy = G - rungs * 40;
    } else if (L.object === "path") {
      const n = Math.floor(m.p * L.pieces.length);
      fx = n === 0 ? L.cx - 215 : L.pieces[n - 1].x + 22; fy = n === 0 ? G : G - 14;
    } else fx = L.cx - 150;
    return { ...m, fx, fy, dir };
  }

  function poseAt(L, t) {
    const keys = ["lean", "a1", "a2", "l1", "l2", "sit", "sw", "q", "fx", "fy"];
    const acc = Object.fromEntries(keys.map((k) => [k, 0]));
    const K = 8;
    for (let k = 0; k < K; k++) {
      const s = laneAt(L, t - k * 0.055);
      const P = POSES[s.state] || POSES.stand;
      for (const key of keys) acc[key] += (key === "fx" || key === "fy" ? s[key] : P[key]) / K;
    }
    acc.a1 += acc.sw * 24 * Math.sin(t * 7.5);
    acc.a2 += acc.sw * 16 * Math.sin(t * 7.5 + 2.1);
    return acc;
  }

  function figure(P, t, dir = 1) {
    const legY = LEG * Math.cos(rad((Math.abs(P.l1) + Math.abs(P.l2)) / 2));
    const hipY = P.fy - (legY * (1 - P.sit) + 18 * P.sit);
    const hip = [P.fx, hipY];
    const along = (len, ang) => [hip[0] + len * Math.sin(rad(ang)) * dir, hip[1] - len * Math.cos(rad(ang))];
    const sh = along(TOR - 8, P.lean), neck = along(TOR, P.lean), head = along(TOR + GAP + R, P.lean);
    const limb = (from, len, phi) => [from[0] + len * Math.sin(rad(phi)) * dir, from[1] + len * Math.cos(rad(phi))];
    const h1 = limb(sh, ARM, P.a1 - P.lean), h2 = limb(sh, ARM, P.a2 - P.lean);
    const f1 = limb(hip, LEG, P.l1), f2 = limb(hip, LEG, P.l2);
    const ln = (a, b, o = 1) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" opacity="${o}"/>`;
    let s = `<g stroke="#fff" stroke-width="${SW}" stroke-linecap="round" fill="none">`;
    s += ln(hip, f2, 0.82) + ln(sh, h2, 0.82) + ln(hip, neck) + ln(hip, f1) + ln(sh, h1);
    s += `</g><circle cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="${R}" fill="#fff"/>`;
    if (P.q > 0.02) {
      const o = P.q * (0.55 + 0.35 * Math.sin(t * 3));
      s += `<text x="${(head[0] + 34 * dir).toFixed(1)}" y="${(head[1] - 46).toFixed(1)}" font-family="JetBrains Mono" font-weight="700" font-size="54" fill="#8a93a0" opacity="${o.toFixed(2)}">?</text>`;
    }
    return s;
  }

  function objects(L, t) {
    const st = laneAt(L, t), fill = COLORS[L.color] || COLORS.white;
    const total = L.pieces.length;
    let s = STATIC[L.object] ? STATIC[L.object](L) : "";
    const rect = (b, dy = 0, o = 1, rot = 0, dx = 0) =>
      `<rect x="${(b.x + dx).toFixed(1)}" y="${(b.y + dy).toFixed(1)}" width="${b.w}" height="${b.h}" rx="${b.rx ?? 4}" fill="${fill}" opacity="${o.toFixed(3)}"` +
      (rot ? ` transform="rotate(${rot.toFixed(1)} ${(b.x + dx + b.w / 2).toFixed(1)} ${(b.y + dy + b.h / 2).toFixed(1)})"` : "") + "/>";
    if (st.collapse) {
      const n = Math.floor(st.collapse.from * total), sec = st.collapse.s;
      for (let i = 0; i < n; i++) {
        const b = L.pieces[i], d = (n - i) * 0.012, ss = Math.max(0, sec - d);
        const dy = Math.min(G - b.y - b.h + 6, 0.5 * 2600 * ss * ss * (0.8 + 0.6 * hash(i)));
        const o = clamp(1 - ss / 0.6);
        if (o > 0) s += rect(b, dy, o, (hash(i, 2) - 0.5) * 140 * ss, (hash(i, 3) - 0.5) * 160 * ss);
      }
      return s;
    }
    const nf = st.p * total, full = Math.floor(nf), frac = nf - full;
    for (let i = 0; i < Math.min(full, total); i++) s += rect(L.pieces[i]);
    if (full < total && frac > 0.02) s += rect(L.pieces[full], -70 * (1 - ease(frac)), frac);
    return s;
  }

  function drawReel(t) {
    const endK = fadeIn(t, END, 0.6), main = 1 - endK;
    // Frame 0 is the Instagram grid cover: show the title, labels and lanes fully
    // built from the first frame instead of fading in from black.
    const ti = t + 2;
    let s = `<defs><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="rm"><rect x="0" y="${G}" width="1080" height="260" fill="url(#rf)"/></mask>
      <linearGradient id="fl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    let body = "";
    for (const L of lanes) body += objects(L, t) + figure(poseAt(L, t), t, 1);
    const showLanes = fadeIn(ti, 0.5, 0.8) * main;
    s += `<g opacity="${showLanes.toFixed(3)}">${body}<rect x="60" y="${G}" width="960" height="2" fill="url(#fl)"/>
      <g mask="url(#rm)"><g transform="translate(0 ${2 * G}) scale(1 -1)">${body}</g></g></g>`;
    SVG.innerHTML = s;
    el.head.style.opacity = (fadeIn(ti, 0.2, 0.6) * main).toFixed(3);
    el.head.style.transform = `translateY(${(14 * (1 - fadeIn(ti, 0.2, 0.6))).toFixed(1)}px)`;
    el.labels.forEach((n, i) => { n.style.opacity = (fadeIn(ti, 0.7 + i * 0.25, 0.6) * main).toFixed(3); });
    if (el.foot) el.foot.style.opacity = (0.9 * fadeIn(ti, 1.0, 0.6) * main).toFixed(3);
    const pk = fadeIn(t, PUNCH, 0.7);
    el.punch.style.opacity = (pk * main).toFixed(3);
    el.punch.style.transform = `translateY(${(16 * (1 - pk)).toFixed(1)}px)`;
    const e2 = fadeIn(t, END + 0.3, 0.7);
    el.end.style.opacity = e2.toFixed(3);
    el.end.style.transform = `translateY(${(18 * (1 - e2)).toFixed(1)}px)`;
    CHROME.style.opacity = (0.6 * fadeIn(ti, 0.1, 0.6) * main).toFixed(3);
    STAGE.style.opacity = Math.min(fadeIn(ti, 0, 0.35), 1 - fadeIn(t, DUR - 0.5, 0.5)).toFixed(3);
  }

  function initReel() {
    H = 1920; STAGE.style.height = H + "px"; SVG.setAttribute("width", 1080); SVG.setAttribute("height", H);
    CHROME.style.top = "268px";
    el.head = div("t"); el.head.style.top = "400px";
    div("bar", el.head); div("kicker", el.head).textContent = spec.kicker || "builder notes";
    const ti = div("title", el.head); ti.style.marginTop = "22px"; rich(ti, spec.title);
    lanes = spec.lanes.map((L, i) => {
      const cx = 270 + 540 * i;
      const object = BUILDERS[L.object] ? L.object : "bricks";
      return { ...L, cx, color: L.color || (i === 0 ? "orange" : "lime"), object, pieces: BUILDERS[object](cx) };
    });
    el.labels = lanes.map((L) => {
      const n = div("label"); n.style.left = `${L.cx - 230}px`; n.style.top = "690px";
      n.style.color = LABEL[L.color] || "#fff";
      n.appendChild(document.createTextNode(L.label));
      if (L.sub) div("sub", n).textContent = L.sub;
      return n;
    });
    el.punch = div("t punch"); el.punch.style.top = "1340px"; rich(el.punch, spec.punchline);
    if (spec.footnote) { el.foot = div("t foot"); el.foot.style.top = "1516px"; el.foot.textContent = spec.footnote; }
    el.end = div("t end"); el.end.style.top = "720px";
    const wm = div("wm", el.end); div("dot", wm); wm.appendChild(document.createTextNode("zerosolved"));
    rich(div("sign", el.end), "Stop guessing. [lime]Start solving.[/lime]");
    div("cta", el.end).textContent = "Explore Zerosolved.com →";
    return { duration: DUR, cuts: [0, PUNCH, END] };
  }

  function initPost() {
    H = 1350; STAGE.style.height = H + "px"; SVG.setAttribute("width", 1080); SVG.setAttribute("height", H);
    CHROME.style.top = "64px";
    const box = div("t"); box.style.top = "0"; box.style.height = H + "px";
    box.style.display = "flex"; box.style.flexDirection = "column"; box.style.justifyContent = "center";
    div("bar", box); div("kicker", box).textContent = spec.kicker || "builder notes";
    if (spec.variant === "equation") {
      const eq = div("eq", box); eq.style.marginTop = "70px";
      for (const term of spec.terms) {
        if (term.op) { div("op", eq).textContent = term.op; continue; }
        const tm = div("term", eq);
        rich(div("w", tm), term.word);
        if (term.label) div("lb", tm).textContent = term.label;
      }
      if (spec.line) { const l = div("kicker", box); l.style.marginTop = "80px"; l.style.fontSize = "30px"; l.style.color = "#e6eaf0"; rich(l, spec.line); }
    } else {
      const q = div("quote", box); q.style.marginTop = "34px"; rich(q, spec.text);
    }
    if (spec.footnote) { const fn = div("t foot"); fn.style.top = "1200px"; fn.style.color = "#5b6472"; fn.textContent = spec.footnote; el.foot = fn; }
    const ft = div("t foot"); ft.style.top = "1262px"; ft.textContent = "Explore Zerosolved.com →";
    CHROME.style.opacity = "0.6";
    el.box = box;
    return { duration: 0, cuts: [] };
  }

  window.__init = (data) => {
    spec = data; mode = data.type === "post" ? "post" : "reel";
    document.documentElement.style.height = document.body.style.height = (mode === "post" ? 1350 : 1920) + "px";
    return mode === "post" ? initPost() : initReel();
  };
  window.__seek = (t) => { if (mode === "reel") drawReel(t); };

  // Layout check: text inside the safe area, nothing clipped, line counts sane.
  window.__lint = () => {
    const w = [];
    const safe = mode === "reel" ? { top: 250, bottom: 1570 } : { top: 40, bottom: 1310 };
    const lines = (n) => { const lh = parseFloat(getComputedStyle(n).lineHeight); return Math.round(n.getBoundingClientRect().height / lh); };
    if (mode === "reel") {
      drawReel(END - 0.2);
      for (const n of [el.head, el.punch, ...el.labels]) {
        const r = n.getBoundingClientRect();
        if (r.top < safe.top || r.bottom > safe.bottom) w.push(`text outside the safe area: "${n.textContent.slice(0, 40)}" (y ${Math.round(r.top)}–${Math.round(r.bottom)})`);
        if (r.left < 40 || r.right > 1040) w.push(`text too wide: "${n.textContent.slice(0, 40)}"`);
      }
      const tl = lines(el.head.querySelector(".title")); if (tl > 2) w.push(`title runs to ${tl} lines (max 2) — shorten it`);
      if (el.head.getBoundingClientRect().bottom > 670) w.push("title block runs into the lane labels — shorten the title");
      const pl = lines(el.punch); if (pl > 2) w.push(`punchline runs to ${pl} lines (max 2) — shorten it`);
      if (el.foot) {
        const fr = el.foot.getBoundingClientRect();
        if (fr.top < el.punch.getBoundingClientRect().bottom + 8) w.push("footnote overlaps the punchline — shorten the punchline");
        if (fr.bottom > safe.bottom || el.foot.scrollWidth > el.foot.clientWidth + 2 || fr.height > 40) w.push("footnote is too long — keep it to one short line");
      }
      el.labels.forEach((n) => { if (n.scrollWidth > n.clientWidth + 2 || n.firstChild.textContent.length > 16) w.push(`label "${n.firstChild.textContent}" is too long (max 16 characters)`); });
    } else {
      const r = el.box.querySelector(".quote, .eq")?.getBoundingClientRect();
      if (r && (r.top < 200 || r.bottom > 1170)) w.push("quote is too long for the post — shorten it");
      if (el.foot && el.foot.getBoundingClientRect().height > 40) w.push("footnote is too long — keep it to one short line");
      const q = el.box.querySelector(".quote"); if (q && lines(q) > 5) w.push(`quote runs to ${lines(q)} lines (max 5)`);
      const eq = el.box.querySelector(".eq"); if (eq && eq.scrollWidth > eq.clientWidth + 2) w.push("equation is too wide — use shorter words");
    }
    return w;
  };
})();
