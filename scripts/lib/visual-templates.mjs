// Deterministic HTML/CSS + SVG visual templates.
//
// One template per visual type. Each takes a small, strictly-shaped spec (which
// an AI pass fills in from the slot's own description) and returns a complete
// standalone HTML document that Playwright screenshots into a PNG.
//
// Why templates rather than free-form AI HTML: layout stays consistent and
// on-brand across hundreds of articles, nothing can drift into broken markup,
// and the AI only has to supply CONTENT (commands, labels, rows), which is what
// it is actually good at.
//
// Brand: navy #000f27, purple #4F1AF3, green #40b75f.

const SHELL = (body, w = 1200) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:${w}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#fff;color:#1c2536}
  .card{padding:34px 38px}
  .h{font-size:26px;font-weight:800;color:#000f27;margin:0 0 6px;letter-spacing:-.01em}
  .sh{font-size:15px;color:#64748b;margin:0 0 24px}
  /* terminal */
  .term{background:#0b1224;border:1px solid #1e2a44;border-radius:14px;overflow:hidden}
  .term .bar{display:flex;align-items:center;gap:8px;padding:13px 16px;background:#0a1020;border-bottom:1px solid #1e2a44}
  .term .bar i{width:12px;height:12px;border-radius:50%;display:block}
  .r{background:#ff5f56}.y{background:#ffbd2e}.g{background:#27c93f}
  .term .bar span{margin-left:10px;color:#7c88a5;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .term pre{margin:0;padding:20px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;line-height:1.75;color:#c7d2e6;white-space:pre-wrap;word-break:break-word}
  .p{color:#9d7bff}.c{color:#e7ecf5;font-weight:600}.ok{color:#40b75f}.warn{color:#ffbd2e}.err{color:#ff6b6b}.m{color:#7c88a5}.cmt{color:#5b678a;font-style:italic}
  /* table */
  table{width:100%;border-collapse:collapse;font-size:16px;border-radius:12px;overflow:hidden}
  th{text-align:left;background:#000f27;color:#fff;padding:14px 16px;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:14px 16px;border-bottom:1px solid #eef2f7;vertical-align:top;color:#243049}
  tr:last-child td{border-bottom:none}
  tr:nth-child(even) td{background:#fafbfe}
  td.mono{font-family:ui-monospace,Menlo,monospace;font-size:14px}
  .pill{display:inline-block;font-weight:700;font-size:12px;padding:4px 11px;border-radius:999px}
  .pos{background:#dcfce7;color:#15803d}.neg{background:#fee2e2;color:#b91c1c}.neu{background:#e8eefb;color:#334155}
  /* panel */
  .panel{border:1px solid #e2e8f0;border-radius:14px;padding:24px;background:#fff;box-shadow:0 4px 18px rgba(0,15,39,.05)}
  .lbl{font-size:12px;font-weight:800;color:#475569;letter-spacing:.05em;text-transform:uppercase;margin:0 0 8px}
  .row{display:flex;align-items:center;gap:12px;border:2px solid #4F1AF3;border-radius:11px;padding:14px 16px;background:#faf9ff;margin:0 0 12px}
  .row .k{font-size:16px;font-weight:700;color:#000f27}
  .row .v{margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#4F1AF3;background:#efeaff;padding:5px 11px;border-radius:7px}
  .row.plain{border-color:#e2e8f0;background:#fff}
  .row.plain .v{color:#475569;background:#f1f5f9}
  .good{display:flex;align-items:center;gap:9px;font-size:15px;color:#15803d;font-weight:700;margin-top:4px}
</style></head><body>${body}</body></html>`;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const head = (title, sub) =>
  `${title ? `<p class="h">${esc(title)}</p>` : ""}${sub ? `<p class="sh">${esc(sub)}</p>` : ""}`;

/* ------------------------------- terminal -------------------------------- */
/** spec: { title, subtitle, tab, lines:[{kind:'cmd'|'out'|'ok'|'warn'|'err'|'comment', text, prompt?}] } */
export function terminal(spec) {
  const lines = (spec.lines ?? [])
    .map((l) => {
      const text = esc(l.text ?? "");
      switch (l.kind) {
        case "cmd":
          return `<span class="p">${esc(l.prompt ?? "$")}</span> <span class="c">${text}</span>`;
        case "ok":
          return `<span class="ok">${text}</span>`;
        case "warn":
          return `<span class="warn">${text}</span>`;
        case "err":
          return `<span class="err">${text}</span>`;
        case "comment":
          return `<span class="cmt">${text}</span>`;
        default:
          return `<span class="m">${text}</span>`;
      }
    })
    .join("\n");
  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
      <div class="term"><div class="bar"><i class="r"></i><i class="y"></i><i class="g"></i>
      <span>${esc(spec.tab ?? "terminal")}</span></div><pre>${lines}</pre></div></div>`,
  );
}

/* ------------------------------ comparison ------------------------------- */
/** spec: { title, subtitle, headers:[], rows:[[cell,...]] } where a cell can be
 *  a string or {text, tone:'pos'|'neg'|'neu', mono:true} */
export function comparison(spec) {
  const cell = (c) => {
    if (c && typeof c === "object") {
      const inner = c.tone ? `<span class="pill ${c.tone}">${esc(c.text)}</span>` : esc(c.text);
      return `<td class="${c.mono ? "mono" : ""}">${inner}</td>`;
    }
    return `<td>${esc(c)}</td>`;
  };
  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
      <table><thead><tr>${(spec.headers ?? []).map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${(spec.rows ?? []).map((r) => `<tr>${r.map(cell).join("")}</tr>`).join("")}</tbody></table></div>`,
  );
}

/* -------------------------------- panel ---------------------------------- */
/** spec: { title, subtitle, label, rows:[{k,v,highlight?}], confirm } */
export function panel(spec) {
  const rows = (spec.rows ?? [])
    .map(
      (r) =>
        `<div class="row ${r.highlight ? "" : "plain"}"><span class="k">${esc(r.k)}</span>${
          r.v ? `<span class="v">${esc(r.v)}</span>` : ""
        }</div>`,
    )
    .join("");
  const confirm = spec.confirm
    ? `<div class="good"><svg width="18" height="18" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#40b75f"/><path d="M6 10.5l2.5 2.5L14 7.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(spec.confirm)}</div>`
    : "";
  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
      <div class="panel">${spec.label ? `<p class="lbl">${esc(spec.label)}</p>` : ""}${rows}${confirm}</div></div>`,
  );
}

/* -------------------------------- graph ---------------------------------- */
/** spec: { title, subtitle, yLabel, xLabel, series:[v..] (0..100), ceiling?:{value,label}, annotation? } */
export function graph(spec) {
  const W = 1080,
    H = 380,
    L = 78,
    R = 40,
    T = 40,
    B = 62;
  const pts = (spec.series ?? []).length ? spec.series : [5, 18, 34, 52, 66, 74, 80, 84, 86, 88];
  const plotW = W - L - R,
    plotH = H - T - B;
  const x = (i) => L + (plotW * i) / Math.max(1, pts.length - 1);
  // 6% headroom so a value of 100 sits just below the top edge rather than on it.
  const y = (v) => T + plotH - (plotH * 0.94 * Math.max(0, Math.min(100, v))) / 100;
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${T + plotH} L${L},${T + plotH} Z`;
  // The ceiling label sits BELOW its line when the line is near the top, so it
  // cannot collide with the y-axis label above the plot.
  const ceilY = spec.ceiling ? y(spec.ceiling.value) : 0;
  const ceilLabelY = ceilY < T + 26 ? ceilY + 22 : ceilY - 10;
  const ceil = spec.ceiling
    ? `<line x1="${L}" y1="${ceilY}" x2="${W - R}" y2="${ceilY}" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="8 6"/>
       <text x="${W - R - 8}" y="${ceilLabelY}" fill="#ef4444" font-family="Arial" font-size="15" font-weight="700" text-anchor="end">${esc(spec.ceiling.label)}</text>`
    : "";
  const gridY = [0, 25, 50, 75, 100]
    .map(
      (v) =>
        `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#eef2f7" stroke-width="1"/>`,
    )
    .join("");
  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <rect width="${W}" height="${H}" fill="#fff"/>
      ${gridY}
      <line x1="${L}" y1="${T}" x2="${L}" y2="${T + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="${L}" y1="${T + plotH}" x2="${W - R}" y2="${T + plotH}" stroke="#cbd5e1" stroke-width="1.5"/>
      <path d="${area}" fill="#4F1AF3" fill-opacity="0.10"/>
      <path d="${line}" fill="none" stroke="#4F1AF3" stroke-width="3.5" stroke-linejoin="round"/>
      ${ceil}
      <text x="${L}" y="${T - 14}" fill="#475569" font-family="Arial" font-size="15" font-weight="700">${esc(spec.yLabel ?? "")}</text>
      <text x="${W - R}" y="${H - 18}" fill="#64748b" font-family="Arial" font-size="15" text-anchor="end">${esc(spec.xLabel ?? "time →")}</text>
      ${spec.annotation ? `<text x="${L}" y="${H - 18}" fill="#40b75f" font-family="Arial" font-size="15" font-weight="700">${esc(spec.annotation)}</text>` : ""}
    </svg></div>`,
  );
}

/* --------------------------------- flow ---------------------------------- */
/**
 * spec: { title, subtitle, nodes:[{label, sub?, tone?:'dark'|'purple'|'green'|'plain'}],
 *         edges?:[label between nodes], note? }
 * Renders a left-to-right pipeline, which is the shape almost every request-path
 * / architecture / backup-flow slot actually needs.
 */
export function flow(spec) {
  const nodes = (spec.nodes ?? []).slice(0, 5);
  const W = 1120;
  // Wide enough that an edge label sits between the boxes instead of overlapping
  // the next one. Edge labels are short by contract, but "SET + return" already
  // proved that a narrow gap collides.
  const gapW = 116;
  const boxW = Math.floor((W - 80 - gapW * (nodes.length - 1)) / Math.max(1, nodes.length));
  const boxH = 116;
  const T = 70;
  const fill = { dark: "#000f27", purple: "#4F1AF3", green: "#40b75f", plain: "#ffffff" };
  const stroke = { dark: "#000f27", purple: "#4F1AF3", green: "#40b75f", plain: "#cbd5e1" };
  const textCol = (t) => (t === "plain" ? "#000f27" : "#ffffff");
  const subCol = (t) => (t === "plain" ? "#64748b" : "#c9d6ee");

  let svg = "";
  nodes.forEach((n, i) => {
    const tone = n.tone ?? (i === 0 ? "dark" : i === nodes.length - 1 ? "green" : "purple");
    const bx = 40 + i * (boxW + gapW);
    svg += `<rect x="${bx}" y="${T}" width="${boxW}" height="${boxH}" rx="14" fill="${fill[tone]}" stroke="${stroke[tone]}" stroke-width="2"/>
      <text x="${bx + boxW / 2}" y="${T + (n.sub ? 50 : 66)}" fill="${textCol(tone)}" font-family="Arial" font-size="19" font-weight="700" text-anchor="middle">${esc(n.label)}</text>`;
    if (n.sub)
      svg += `<text x="${bx + boxW / 2}" y="${T + 78}" fill="${subCol(tone)}" font-family="Arial" font-size="14" text-anchor="middle">${esc(n.sub)}</text>`;
    if (i < nodes.length - 1) {
      const ax = bx + boxW + 10;
      svg += `<line x1="${ax}" y1="${T + boxH / 2}" x2="${ax + gapW - 22}" y2="${T + boxH / 2}" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#ar)"/>`;
      const el = (spec.edges ?? [])[i];
      // Clamped: a long edge label is the one thing that can still overflow the
      // gap, and truncating reads better than overlapping the next box.
      if (el)
        svg += `<text x="${ax + (gapW - 22) / 2}" y="${T + boxH / 2 - 16}" fill="#64748b" font-family="Arial" font-size="13" text-anchor="middle">${esc(String(el).slice(0, 16))}</text>`;
    }
  });

  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
    <svg viewBox="0 0 ${W} ${T + boxH + (spec.note ? 78 : 40)}" width="100%">
      <defs><marker id="ar" markerWidth="11" markerHeight="11" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8"/></marker></defs>
      <rect width="${W}" height="100%" fill="#fff"/>
      ${svg}
      ${spec.note ? `<text x="${W / 2}" y="${T + boxH + 52}" fill="#475569" font-family="Arial" font-size="15" text-anchor="middle">${esc(spec.note)}</text>` : ""}
    </svg></div>`,
  );
}

/* -------------------------------- fanout --------------------------------- */
/**
 * spec: { title, subtitle, source:{label,sub}, targets:[{label,sub,tone?}], edgeLabel?, note? }
 *
 * One source talking to SEVERAL things at once. This exists because the linear
 * `flow` template cannot express it honestly: a load balancer checking two
 * backends, or a primary with two read replicas, is a fan-out, and drawing it as
 * a chain claims the second node is downstream of the first, which is false.
 */
export function fanout(spec) {
  const targets = (spec.targets ?? []).slice(0, 4);
  const W = 1120;
  const srcW = 260,
    srcH = 116;
  const tW = 300,
    tH = 96,
    tGap = 22;
  const srcX = 40;
  const tX = srcX + srcW + 190;
  const stackH = targets.length * tH + (targets.length - 1) * tGap;
  // Fits the content rather than a fixed floor, so a 2-target diagram does not
  // ship with a band of empty space under it.
  const H = Math.max(srcH, stackH) + 70 + (spec.note ? 52 : 24);
  const midY = 70 + stackH / 2;
  const fill = { purple: "#4F1AF3", green: "#40b75f", red: "#e11d48", plain: "#ffffff", dark: "#000f27" };

  let g = "";
  // source
  g += `<rect x="${srcX}" y="${midY - srcH / 2}" width="${srcW}" height="${srcH}" rx="14" fill="#000f27"/>
    <text x="${srcX + srcW / 2}" y="${midY - (spec.source?.sub ? 6 : -8)}" fill="#fff" font-family="Arial" font-size="20" font-weight="700" text-anchor="middle">${esc(spec.source?.label ?? "Source")}</text>`;
  if (spec.source?.sub)
    g += `<text x="${srcX + srcW / 2}" y="${midY + 22}" fill="#9db0d0" font-family="Arial" font-size="14" text-anchor="middle">${esc(spec.source.sub)}</text>`;

  targets.forEach((t, i) => {
    const ty = 70 + i * (tH + tGap);
    const tone = t.tone ?? "purple";
    const isPlain = tone === "plain";
    g += `<rect x="${tX}" y="${ty}" width="${tW}" height="${tH}" rx="13" fill="${fill[tone] ?? fill.purple}" stroke="${fill[tone] ?? fill.purple}" stroke-width="2"/>
      <text x="${tX + tW / 2}" y="${ty + (t.sub ? 40 : 56)}" fill="${isPlain ? "#000f27" : "#fff"}" font-family="Arial" font-size="18" font-weight="700" text-anchor="middle">${esc(t.label)}</text>`;
    if (t.sub)
      g += `<text x="${tX + tW / 2}" y="${ty + 66}" fill="${isPlain ? "#64748b" : "#d7e0f2"}" font-family="Arial" font-size="13.5" text-anchor="middle">${esc(t.sub)}</text>`;
    // curved connector from the source's right edge to each target's left edge
    const x1 = srcX + srcW,
      y1 = midY,
      x2 = tX - 10,
      y2 = ty + tH / 2;
    g += `<path d="M${x1},${y1} C${x1 + 90},${y1} ${x2 - 90},${y2} ${x2},${y2}" fill="none" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#fa)"/>`;
  });

  if (spec.edgeLabel)
    g += `<text x="${srcX + srcW + 95}" y="${midY - 12}" fill="#64748b" font-family="Arial" font-size="13" text-anchor="middle">${esc(String(spec.edgeLabel).slice(0, 16))}</text>`;
  if (spec.note)
    g += `<text x="${W / 2}" y="${H - 14}" fill="#475569" font-family="Arial" font-size="15" text-anchor="middle">${esc(spec.note)}</text>`;

  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs><marker id="fa" markerWidth="11" markerHeight="11" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8"/></marker></defs>
      <rect width="${W}" height="${H}" fill="#fff"/>${g}
    </svg></div>`,
  );
}

/* --------------------------------- bars ---------------------------------- */
/**
 * spec: { title, subtitle, unitLabel?, bars:[{label, value 0-100, valueLabel?, tone?}], note? }
 *
 * A magnitude comparison between a handful of named things. Distinct from `graph`,
 * which plots one quantity over time. "A short storage bar next to a tall egress
 * bar" is this, and forcing it into a line chart produced nonsense.
 */
export function bars(spec) {
  const items = (spec.bars ?? []).slice(0, 6);
  const W = 1080,
    L = 240,
    R = 120,
    T = 56,
    rowH = 62,
    barH = 34;
  const H = T + items.length * rowH + (spec.note ? 56 : 22);
  const plotW = W - L - R;
  const max = Math.max(1, ...items.map((b) => Number(b.value) || 0));
  const tone = { purple: "#4F1AF3", green: "#40b75f", red: "#e11d48", grey: "#94a3b8" };

  let g = "";
  items.forEach((b, i) => {
    const y = T + i * rowH;
    const v = Math.max(0, Math.min(100, Number(b.value) || 0));
    const w = Math.max(3, (plotW * v) / max);
    const col = tone[b.tone] ?? (i === 0 ? tone.purple : tone.grey);
    g += `<text x="${L - 16}" y="${y + barH / 2 + 6}" fill="#243049" font-family="Arial" font-size="16" font-weight="600" text-anchor="end">${esc(b.label)}</text>
      <rect x="${L}" y="${y}" width="${plotW}" height="${barH}" rx="7" fill="#f1f5f9"/>
      <rect x="${L}" y="${y}" width="${w}" height="${barH}" rx="7" fill="${col}"/>`;
    if (b.valueLabel)
      g += `<text x="${L + w + 14}" y="${y + barH / 2 + 6}" fill="${col}" font-family="Arial" font-size="15" font-weight="700">${esc(b.valueLabel)}</text>`;
  });

  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <rect width="${W}" height="${H}" fill="#fff"/>${g}
      ${spec.unitLabel ? `<text x="${L}" y="${T - 18}" fill="#64748b" font-family="Arial" font-size="13">${esc(spec.unitLabel)}</text>` : ""}
      ${spec.note ? `<text x="${W / 2}" y="${H - 16}" fill="#475569" font-family="Arial" font-size="15" text-anchor="middle">${esc(spec.note)}</text>` : ""}
    </svg></div>`,
  );
}

/* ------------------------------- timeline -------------------------------- */
/**
 * spec: { title, subtitle, lanes:[{label, segments:[{kind:'up'|'down'|'deploy', label?, width}]}], note? }
 *
 * Two or three lanes of elapsed time, so a reader can see one lane has a gap and
 * the other does not. This is what "a before and after uptime timeline" and "a
 * naive deploy beside an overlapping deploy" actually need: the point is the
 * PRESENCE of a red gap in one lane, which a single line chart cannot show.
 */
export function timeline(spec) {
  const lanes = (spec.lanes ?? []).slice(0, 3);
  const W = 1080,
    L = 250,
    R = 40,
    T = 62,
    laneH = 46,
    gap = 34;
  const H = T + lanes.length * (laneH + gap) + (spec.note ? 40 : 6);
  const plotW = W - L - R;
  const col = { up: "#40b75f", down: "#e11d48", deploy: "#4F1AF3" };

  let g = "";
  lanes.forEach((lane, li) => {
    const y = T + li * (laneH + gap);
    const segs = (lane.segments ?? []).filter((s) => Number(s.width) > 0);
    const total = segs.reduce((n, s) => n + Number(s.width), 0) || 1;
    let x = L;
    g += `<text x="${L - 18}" y="${y + laneH / 2 + 6}" fill="#243049" font-family="Arial" font-size="16" font-weight="600" text-anchor="end">${esc(lane.label)}</text>`;
    segs.forEach((s) => {
      const w = (plotW * Number(s.width)) / total;
      g += `<rect x="${x}" y="${y}" width="${w}" height="${laneH}" fill="${col[s.kind] ?? col.up}"/>`;
      if (s.label && w > 70)
        g += `<text x="${x + w / 2}" y="${y + laneH / 2 + 5}" fill="#fff" font-family="Arial" font-size="13" font-weight="700" text-anchor="middle">${esc(s.label)}</text>`;
      x += w;
    });
    // round the lane's outer corners with a clipping overlay-free approach
    g += `<rect x="${L}" y="${y}" width="${plotW}" height="${laneH}" rx="8" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>`;
  });

  // legend
  g += `<g font-family="Arial" font-size="13" fill="#475569">
    <rect x="${L}" y="${T - 34}" width="13" height="13" rx="3" fill="${col.up}"/><text x="${L + 20}" y="${T - 23}">serving</text>
    <rect x="${L + 96}" y="${T - 34}" width="13" height="13" rx="3" fill="${col.down}"/><text x="${L + 116}" y="${T - 23}">failing requests</text>
    <rect x="${L + 250}" y="${T - 34}" width="13" height="13" rx="3" fill="${col.deploy}"/><text x="${L + 270}" y="${T - 23}">deploying</text></g>`;

  return SHELL(
    `<div class="card">${head(spec.title, spec.subtitle)}
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <rect width="${W}" height="${H}" fill="#fff"/>${g}
      ${spec.note ? `<text x="${W / 2}" y="${H - 8}" fill="#475569" font-family="Arial" font-size="15" text-anchor="middle">${esc(spec.note)}</text>` : ""}
    </svg></div>`,
  );
}

export const TEMPLATES = { terminal, comparison, panel, graph, flow, fanout, bars, timeline };
