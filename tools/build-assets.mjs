#!/usr/bin/env node
// Gera as imagens do README (claro e escuro, pt e en) a partir de assets/readme/dados.json e reescreve
// os blocos <!-- gerado:nome --> do README.md e do README.en.md. Sem dependências; a saída é determinística.
// Uso: node tools/build-assets.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const raiz = new URL('../', import.meta.url);
const ler = p => fs.readFileSync(new URL(p, raiz));
const dados = JSON.parse(ler('assets/readme/dados.json'));
const MET = JSON.parse(ler('tools/fonts/metrics.json'));
const SANS = ler('tools/fonts/geist.woff2').toString('base64');
const MONO = ler('tools/fonts/geist-mono.woff2').toString('base64');
const OUT = new URL('assets/readme/', raiz);

// ---------- medida de texto (avanços reais da Geist; sem kerning, então a medida sobra um pouco) ----------
const PESOS = [400, 500, 600, 700];
const tw = (s, size, weight = 400, mono = false, ls = 0) => {
  const str = String(s), w = PESOS.reduce((a, b) => Math.abs(b - weight) < Math.abs(a - weight) ? b : a);
  let u = 0;
  for (const ch of str) {
    if (!MET.chars.includes(ch)) throw new Error(`glifo fora da fonte embutida: "${ch}" em "${str}"`);
    u += mono ? MET.mono : MET.sans[w][ch];
  }
  return u * size / 1000 + ls * [...str].length;
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = n => Math.round(n * 10) / 10;

// <text> com trava de largura: estoura o build se o texto não couber em `max`.
function T(x, y, s, { size = 14, w = 400, fill, anchor, mono = false, ls = 0, max, cls = '', op } = {}) {
  const width = tw(s, size, w, mono, ls);
  if (max != null && width > max) throw new Error(`texto estoura: "${s}" tem ${width.toFixed(0)}px, cabe ${max.toFixed(0)}px`);
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}"${mono ? ' class="m"' : ''}${w !== 400 ? ` font-weight="${w}"` : ''}` +
    `${ls ? ` letter-spacing="${ls}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''}${fill ? ` fill="${fill}"` : ''}` +
    `${op != null ? ` fill-opacity="${op}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;
}

// ---------- temas: escuro quente e papel claro, acento do Pavio (lilás → terracota) ----------
// bg é a cor da página do GitHub: o SVG não pinta fundo, só o anel do check e o miolo do medidor usam bg.
// a2t é o acento escurecido para texto pequeno (contraste ≥ 4.5:1); a2 fica para gráficos.
// Paleta do vídeo de apresentação (direção C · marca-texto): papel, tinta e o amarelo só como faixa (hl).
// O card pinta o próprio fundo, então é o mesmo no tema claro e no escuro do GitHub.
const PAPEL = {
  bg: '#F5F3EF', text: '#111111', soft: '#3A3835', muted: '#6F6B64', faint: '#6F6B64', a2t: '#111111',
  glass: '#F5F3EF', glassA: [1, 1], line: '#111111', lineA: 0.13, lineTop: 0.13, chipA: 0.04,
  a1: '#111111', a2: '#111111', glowA: 0, titleA: '#111111', titleB: '#111111', iconStroke: '#111111',
  screen: '#ECE9E3', ink: '#111111', selA: 1, shadow: false, flat: true, dot: 0, hl: '#FFD60A', term: '#110F14', termText: '#F5F3EF',
};
const TEMAS = { dark: PAPEL, light: PAPEL };

// ---------- ícones desenhados para este repo, grade de 24 px ----------
const I = {
  sparkle: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 15.5v4M16.5 17.5h4"/>',
  nib: '<path d="M12 3l6.5 7.5L12 21 5.5 10.5z"/><path d="M12 3v7"/><circle cx="12" cy="12.2" r="1.6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  bezier: '<path d="M4 18C8 18 8 6 12 6s4 12 8 12"/><path d="M12 6h6"/><circle cx="19" cy="6" r="1.3"/><circle cx="4" cy="18" r="1.3"/><circle cx="20" cy="18" r="1.3"/>',
  motion: '<circle cx="15.5" cy="12" r="5.5"/><path d="M4 8.5h4.5M3 12h4.5M4 15.5h4.5"/>',
  layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12.5l8.5 4.5 8.5-4.5"/><path d="M3.5 16.5l8.5 4.5 8.5-4.5" opacity=".5"/>',
  cycle: '<path d="M19.5 12a7.5 7.5 0 0 1-13.4 4.6"/><path d="M4.5 12a7.5 7.5 0 0 1 13.4-4.6"/><path d="M18.3 3.5v4h-4M5.7 20.5v-4h4"/><path d="M9.3 12.2l1.9 1.9 3.6-3.8"/>',
  shield: '<path d="M12 3l7.5 2.8V12c0 4.3-3.2 7.8-7.5 9-4.3-1.2-7.5-4.7-7.5-9V5.8z"/><path d="M8.6 12.1l2.4 2.4 4.4-4.6"/>',
  check: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 12.3l2.7 2.7L16.2 9.3"/>',
  graph: '<circle cx="6" cy="6.5" r="2.2"/><circle cx="18" cy="5.5" r="2.2"/><circle cx="12" cy="18" r="2.2"/><circle cx="19" cy="15.5" r="1.6"/><path d="M8 7.3l8-1.4M7 8.5l4 7.6M17 7.5l-4 8.6M14.1 17.4l3.4-1.3"/>',
  browser: '<rect x="3" y="4" width="18" height="15" rx="2.5"/><path d="M3 8.5h18"/><path d="M12.5 11.5l6 2.4-2.6 1-1 2.6z"/>',
  ask: '<path d="M4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3.5V17h-2A1.5 1.5 0 0 1 3 15.5V6a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M10 9.2a2 2 0 1 1 2.9 1.8c-.6.3-.9.7-.9 1.3"/><path d="M12 14.4v.1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  clapper: '<path d="M3.5 10h17v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 10L5 5.5l15.2-2 .8 3.9L3.5 10"/><path d="M8.6 4.9l1.9 3.8M13.6 4.2l1.9 3.8"/>',
  play: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M10 8.6v6.8l5.6-3.4z"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.2 9.2v5.6l4.6-2.8z"/><path d="M7 5v14M17 5v14" opacity=".45"/>',
  gauge: '<path d="M3.8 16.5a8.5 8.5 0 1 1 16.4 0"/><path d="M12 16l4.2-5.2"/><circle cx="12" cy="16" r="1.6"/><path d="M6.3 10.5l1 .8M12 6.5v1.3" opacity=".55"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="3.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="3.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.8 4.5l-3.6 15"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  noreread: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5"/><path d="M9 14l2.2 2.2 4-4.4"/>',
  batch: '<path d="M4 7h11M4 12h11M4 17h11"/><path d="M17 5l3 2-3 2M17 10l3 2-3 2M17 15l3 2-3 2"/>',
  split: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.6 1.6M9.5 2.5h5"/>',
  text: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 8.5h8M12 8.5v8"/>',
  reply: '<path d="M4 12h12.5a3.5 3.5 0 0 1 0 7H14"/><path d="M8 8l-4 4 4 4"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.5c.9-3.7 3.7-5.6 7.2-5.6s6.3 1.9 7.2 5.6"/>',
};
const icon = (name, x, y, s, color, sw = 1.6) => {
  assert.ok(I[name], `ícone inexistente: ${name}`);
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s / 24 * 1000) / 1000})" fill="none" stroke="${color}" stroke-width="${r1(sw * 24 / s * 100) / 100}" stroke-linecap="round" stroke-linejoin="round">${I[name]}</g>`;
};

// ---------- primitivas ----------
function svg(W, H, t, title, defs, body, css = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}" fill="${t.text}">
<title>${esc(title)}</title>
<style>
@font-face{font-family:G;src:url(data:font/woff2;base64,${SANS}) format('woff2');font-weight:400 700}
@font-face{font-family:GM;src:url(data:font/woff2;base64,${MONO}) format('woff2');font-weight:400 600}
text{font-family:G,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-kerning:normal}
.m{font-family:GM,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
<linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a1}"/><stop offset="1" stop-color="${t.a2}"/></linearGradient>
<linearGradient id="accH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a1}"/><stop offset="1" stop-color="${t.a2}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.line}" stop-opacity="${t.lineTop}"/><stop offset=".35" stop-color="${t.line}" stop-opacity="${t.lineA}"/><stop offset="1" stop-color="${t.line}" stop-opacity="${r1(t.lineA * 6) / 10}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.glass}" stop-opacity="${t.glassA[0]}"/><stop offset="1" stop-color="${t.glass}" stop-opacity="${t.glassA[1]}"/></linearGradient>
<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.line}" stop-opacity="0"/><stop offset=".5" stop-color="${t.line}" stop-opacity="${t.shadow || t.flat ? 0 : 0.35}"/><stop offset="1" stop-color="${t.line}" stop-opacity="0"/></linearGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1" fill="${t.ink}" fill-opacity="${t.dot}"/></pattern>
<filter id="sh" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx="0" dy="${t.shadow ? 6 : 0}" stdDeviation="${t.shadow ? 10 : 0}" flood-color="#3A2A1E" flood-opacity="${t.shadow ? 0.07 : 0}"/></filter>
${defs}
</defs>
${body}
</svg>
`;
}
const glow = (id, color, a, cx, cy, rx, ry) =>
  `<radialGradient id="${id}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${cx} ${cy}) scale(${rx} ${ry})"><stop offset="0" stop-color="${color}" stop-opacity="${a}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
// cartão de vidro: preenchimento suave, borda iluminada por cima
const card = (x, y, w, h, r = 20) =>
  `<g filter="url(#sh)"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="url(#glass)"/></g>` +
  `<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${r1(h - 1)}" rx="${r - 0.5}" fill="none" stroke="url(#edge)"/>` +
  `<rect x="${r1(x + r)}" y="${r1(y)}" width="${r1(w - 2 * r)}" height="1" fill="url(#hl)"/>`;
const tile = (name, x, y, s, t, accent = false) => accent
  ? `<rect x="${r1(x)}" y="${r1(y)}" width="${s}" height="${s}" rx="${r1(s * 0.28)}" fill="url(#acc)"/><rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${s - 1}" height="${s - 1}" rx="${r1(s * 0.28)}" fill="none" stroke="#fff" stroke-opacity=".28"/>${icon(name, x + s * 0.22, y + s * 0.22, s * 0.56, '#fff', 1.7)}`
  : `<rect x="${r1(x)}" y="${r1(y)}" width="${s}" height="${s}" rx="${r1(s * 0.28)}" fill="${t.ink}" fill-opacity="${t.chipA * 1.4}"/><rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${s - 1}" height="${s - 1}" rx="${r1(s * 0.28)}" fill="none" stroke="url(#edge)"/>${icon(name, x + s * 0.24, y + s * 0.24, s * 0.52, t.iconStroke, 1.6)}`;
function pill(x, y, label, t, { size = 14, h = 32, accent = false, mono = false, w: fw = 500, anchor } = {}) {
  const w = Math.round(tw(label, size, fw, mono) + 32), x0 = anchor === 'end' ? x - w : x;
  return { w, svg: `<rect x="${r1(x0)}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.ink}" fill-opacity="${t.chipA}" stroke="${accent ? 'url(#accH)' : t.line}" stroke-opacity="${accent ? 0.75 : r1(t.lineA * 13) / 10}"/>` +
    T(x0 + w / 2, y + h / 2 + size * 0.35, label, { size, w: mono ? 400 : fw, mono, anchor: 'middle', fill: accent ? t.text : t.soft }) };
}
// chips em linha; quebram para a linha de baixo quando não cabem. Devolve o svg e a altura usada.
function chips(x, y, items, maxX, t, opts = {}) {
  const h = opts.h ?? 32;
  let cx = x, cy = y, out = '';
  for (const it of items) {
    let p = pill(cx, cy, it, t, opts);
    if (cx > x && cx + p.w > maxX) { cx = x; cy += h + 10; p = pill(cx, cy, it, t, opts); }
    if (cx + p.w > maxX) throw new Error(`chip estoura: ${it}`);
    out += p.svg; cx += p.w + 10;
  }
  return { svg: out, h: cy - y + h };
}
const check = (cx, cy, t, r = 8) =>
  `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 2.5}" fill="${t.bg}"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="url(#acc)"/>` +
  `<path d="M${r1(cx - r * 0.42)} ${r1(cy + 0.2)}l${r1(r * 0.3)} ${r1(r * 0.3)} ${r1(r * 0.52)}-${r1(r * 0.55)}" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
const label = (x, y, s, t, opts = {}) => T(x, y, s, { size: LBL, mono: true, ls: 1.2, fill: t.muted, ...opts });
const lw = s => tw(s, LBL, 400, true, 1.2);
const hr = (x1, x2, y, t) => `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="1" fill="${t.line}" fill-opacity="${t.lineA}"/>`;

// ---------- textos de interface ----------
const L = {
  pt: {
    kicker: 'Agent Skills · portfólio aberto',
    lema: ['Skills que ensinam agentes de código', 'a entregar ', 'trabalho pronto', '.'],
    indice: [['01', 'muri-video', 'vídeo narrado, do briefing ao MP4'], ['02', 'muri-saver', 'sessões curtas, contexto enxuto'], ['03', 'muri-design', 'cara do produto, nada decorativo'], ['04', 'stack', 'skills de terceiros, com crédito']],
    funciona: 'funciona em',
    busca: 'vídeo de lançamento do app',
    paleta: [['film', 'muri-video', 'vídeo narrado, do briefing ao MP4'], ['gauge', 'muri-saver', 'sessões curtas, contexto enxuto'], ['nib', 'muri-design', 'regras de design, sem template'], ['sparkle', 'impeccable', 'crítica e polimento de interface'], ['ask', 'grill-me', 'perguntas até o plano fechar']],
    rodapePaleta: ['skills', '↑↓ navegar   ↵ carregar'],
    autoral: 'autoral', comoChamar: 'COMO CHAMAR', quando: 'QUANDO USAR', entrega: 'ENTREGA', etapas: 'DO BRIEFING À ENTREGA',
    aprova: 'para e espera sua aprovação', orquestra: 'ORQUESTRA', motor: 'MOTOR', ativar: 'ATIVAR', desativar: 'DESATIVAR', kit: 'KIT COMPLETO', processo: 'PROCESSO',
    regras: 'O QUE MUDA NO AGENTE', stackSub: 'Agrupadas pelo que resolvem. Instale cada uma direto da fonte, pelo comando do autor.',
    stackRodape: 'Código de terceiros não é copiado para este repositório. Crédito, licença e instalação de cada skill estão no README.',
    titulos: { hero: 'muri-skills: skills que ensinam agentes de código a entregar trabalho pronto', stack: 'Stack curada: skills de terceiros agrupadas pelo que resolvem' },
  },
  en: {
    kicker: 'Agent Skills · open portfolio',
    lema: ['Skills that teach coding agents', 'to ship ', 'finished work', '.'],
    indice: [['01', 'muri-video', 'narrated video, from brief to MP4'], ['02', 'muri-saver', 'short sessions, lean context'], ['03', 'muri-design', "the product's look, nothing decorative"], ['04', 'stack', 'third-party skills, credited']],
    funciona: 'works in',
    busca: 'launch video for the app',
    paleta: [['film', 'muri-video', 'narrated video, from brief to MP4'], ['gauge', 'muri-saver', 'short sessions, lean context'], ['nib', 'muri-design', 'design rules, no templates'], ['sparkle', 'impeccable', 'interface critique and polish'], ['ask', 'grill-me', 'questions until the plan is closed']],
    rodapePaleta: ['skills', '↑↓ navigate   ↵ load'],
    autoral: 'original', comoChamar: 'HOW TO CALL IT', quando: 'WHEN TO USE', entrega: 'YOU GET', etapas: 'FROM BRIEF TO DELIVERY',
    aprova: 'stops for your approval', orquestra: 'ORCHESTRATES', motor: 'ENGINE', ativar: 'TURN ON', desativar: 'TURN OFF', kit: 'FULL KIT', processo: 'PROCESS',
    regras: 'WHAT CHANGES IN THE AGENT', stackSub: 'Grouped by what they solve. Install each one from the source, with the author\'s command.',
    stackRodape: 'No third-party code is copied into this repository. Credit, license and install for each skill are in the README.',
    titulos: { hero: 'muri-skills: skills that teach coding agents to ship finished work', stack: 'Curated stack: third-party skills grouped by what they solve' },
  },
};

// grade comum: moldura em x=24 (raio 24), conteúdo de x=64 a x=1216, painéis internos com raio 18.
// O GitHub mostra as imagens a ~830 px, então nada de texto abaixo de LBL (15 px → ~10 px na tela).
const W = 1280, FX = 24, FR = 24, PR = 18, CX = 64, CR = W - 64, LBL = 15;

// ---------- 1. HERO ----------
function hero(mode, lang) {
  const t = TEMAS[mode], l = L[lang], H = 600;
  const pw = 540, px = CR - pw, py = 76, rowH = 62, ph = 80 + 5 * rowH + 10 + 50;
  const defs = `${glow('g1', t.a1, t.glowA, 960, 30, 640, 380)}${glow('g2', t.a2, r1(t.glowA * 5.5) / 10, 1180, 560, 440, 260)}
<radialGradient id="fade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(920 290) scale(700 420)"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
<mask id="dm"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<linearGradient id="title" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="${t.titleA}"/><stop offset="1" stop-color="${t.titleB}"/></linearGradient>
<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${t.shadow ? 0.55 : 0.09}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a1}" stop-opacity="0"/><stop offset=".5" stop-color="${t.a2}"/><stop offset="1" stop-color="${t.a1}" stop-opacity="0"/></linearGradient>
<clipPath id="selc"><rect x="${px + 10}" y="${py + 80}" width="${pw - 20}" height="${rowH - 4}" rx="12"/></clipPath>
<clipPath id="topc"><rect x="${px}" y="${py}" width="${pw}" height="2"/></clipPath>`;
  const css = `.caret{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
.sweep{animation:sw 5s cubic-bezier(.45,0,.2,1) infinite}@keyframes sw{0%{transform:translateX(-240px)}55%,100%{transform:translateX(${pw + 40}px)}}
.beam{animation:bm 6.5s cubic-bezier(.45,0,.2,1) infinite}@keyframes bm{0%{transform:translateX(-200px)}60%,100%{transform:translateX(${pw + 40}px)}}
.breathe{animation:br 8s ease-in-out infinite}@keyframes br{0%,100%{opacity:1}50%{opacity:.62}}`;

  // coluna da esquerda: termina 48 px antes da paleta
  const lx = CX, lmax = px - 48, kick = l.kicker;
  let left = `<rect x="${lx}" y="${py}" width="${Math.round(tw(kick, LBL, 400, true, 0.2) + 50)}" height="34" rx="17" fill="${t.ink}" fill-opacity="${t.chipA}" stroke="${t.line}" stroke-opacity="${r1(t.lineA * 13) / 10}"/>
<circle cx="${lx + 19}" cy="${py + 17}" r="4.5" fill="url(#acc)"/>${T(lx + 34, py + 22.5, kick, { size: LBL, mono: true, ls: 0.2, fill: t.soft })}`;
  const wm = tw('muri-skills', 104, 700, false, -4.6);
  if (wm > lmax - lx) throw new Error(`wordmark largo demais: ${Math.round(wm)}`);
  left += `<text x="${lx - 5}" y="214" font-size="104" font-weight="700" letter-spacing="-4.6" fill="url(#title)">muri<tspan fill="${t.a2}">-</tspan>skills</text>`;
  const [a, b, em, c] = l.lema;
  left += T(lx, 266, a, { size: 26, fill: t.soft, ls: -0.3, max: lmax - lx });
  if (tw(b + em + c, 26, 500) > lmax - lx) throw new Error('lema largo demais');
  left += `<rect x="${r1(lx + tw(b, 26, 400, false, -0.3) - 2)}" y="289" width="${r1(tw(em, 26, 600, false, -0.3) + 4)}" height="13" fill="${t.hl}"/>`;
  left += `<text x="${lx}" y="300" font-size="26" letter-spacing="-.3" fill="${t.soft}">${esc(b)}<tspan fill="${t.text}" font-weight="600">${esc(em)}</tspan>${esc(c)}</text>`;
  l.indice.forEach(([n, nome, desc], i) => {
    const y = 366 + i * 36;
    left += hr(lx, lmax, y - 28, t);
    left += T(lx, y, n, { size: LBL, mono: true, fill: t.a2t, w: 500 });
    left += T(lx + 40, y, nome, { size: 19, w: 600, fill: t.text });
    left += T(lx + 168, y, desc, { size: 17, fill: t.muted, max: lmax - lx - 168 });
  });
  left += hr(lx, lmax, 366 + l.indice.length * 36 - 28, t);
  if (366 + l.indice.length * 36 - 28 > py + ph - 26 - 12) throw new Error('índice encosta nos hosts');
  let hx = lx + tw(l.funciona, LBL, 400, true) + 14;
  left += T(lx, py + ph - 5, l.funciona, { size: LBL, mono: true, fill: t.faint });
  dados.hosts.forEach(h => { const p = pill(hx, py + ph - 26, h, t, { size: LBL, h: 32 }); left += p.svg; hx += p.w + 8; });
  if (hx - 8 > lmax) throw new Error('hosts estouram');

  // paleta de comandos
  let list = '';
  l.paleta.forEach(([ic, name, desc], i) => {
    const ry = py + 80 + i * rowH, sel = i === 0, rh = rowH - 4;
    if (sel) list += `<rect x="${px + 10}" y="${ry}" width="${pw - 20}" height="${rh}" rx="12" fill="${t.hl}" fill-opacity="${t.selA}"/><rect x="${px + 10.5}" y="${ry + 0.5}" width="${pw - 21}" height="${rh - 1}" rx="11.5" fill="none" stroke="url(#accH)" stroke-opacity=".6"/><g clip-path="url(#selc)"><rect class="sweep" x="${px - 200}" y="${ry}" width="200" height="${rh}" fill="url(#sweep)"/></g>`;
    list += tile(ic, px + 22, ry + 10, 38, t, sel);
    list += T(px + 74, ry + 35, name, { size: 18, w: 600, fill: t.text });
    list += T(px + 190, ry + 35, desc, { size: 16, fill: sel ? t.soft : t.muted, max: pw - 190 - (sel ? 62 : 22) });
    if (sel) list += `<rect x="${px + pw - 52}" y="${ry + 16}" width="30" height="26" rx="6" fill="${t.ink}" fill-opacity="${t.chipA * 2}" stroke="${t.line}" stroke-opacity="${r1(t.lineA * 15) / 10}"/>${T(px + pw - 37, ry + 34, '↵', { size: LBL, mono: true, fill: t.soft, anchor: 'middle' })}`;
  });
  const qx = px + 58, cmd = '/muri-video';
  const caretX = qx + tw(cmd, 18, 500, true) + 10 + tw(l.busca, 18) + 2;
  if (caretX > px + pw - 20) throw new Error('busca da paleta estoura');
  const body = `${card(FX, FX, W - 2 * FX, H - 2 * FX, FR)}
<rect width="${W}" height="${H}" fill="url(#g1)" class="breathe"/>
<rect width="${W}" height="${H}" fill="url(#g2)"/>
<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dm)"/>
${left}
${card(px, py, pw, ph, PR)}
<g clip-path="url(#topc)"><rect class="beam" x="${px - 160}" y="${py}" width="160" height="1.5" fill="url(#beam)"/></g>
${icon('search', px + 22, py + 24, 22, t.muted, 1.6)}
<text x="${qx}" y="${py + 41}" font-size="18"><tspan class="m" fill="url(#accH)" font-weight="500">${cmd}</tspan><tspan dx="10" fill="${t.text}">${esc(l.busca)}</tspan></text>
<rect class="caret" x="${r1(caretX)}" y="${py + 24}" width="1.8" height="22" fill="${t.text}"/>
${hr(px, px + pw, py + 68, t)}
${list}
${hr(px, px + pw, py + ph - 48, t)}
${T(px + 22, py + ph - 18, l.rodapePaleta[0], { size: LBL, mono: true, fill: t.muted })}
${T(px + pw - 22, py + ph - 18, l.rodapePaleta[1], { size: LBL, mono: true, fill: t.muted, anchor: 'end' })}`;
  return svg(W, H, t, l.titulos.hero, defs, body, css);
}

// ---------- cabeçalho comum dos cards autorais (devolve o svg e o y onde ele termina) ----------
function cabecalho(s, c, t, l, chamar) {
  let o = tile(s.icone, CX, 64, 64, t, true);
  o += `<rect x="${CX + 82}" y="86" width="${r1(tw(s.nome, 40, 700, false, -1.3) + 6)}" height="17" fill="${t.hl}"/>`;
  o += T(CX + 84, 100, s.nome, { size: 40, w: 700, ls: -1.3, fill: t.text });
  o += pill(CX + 84 + tw(s.nome, 40, 700, false, -1.3) + 18, 74, `${s.num} · ${l.autoral}`, t, { size: 14, h: 30, accent: true, mono: true }).svg;
  // caixa "como chamar" com cursor piscando
  const bw = Math.round(tw(chamar, 19, 400, true) + 68), bx = CR - bw;
  o += T(CX + 84, 136, c.resumo, { size: 20, fill: t.soft, max: bx - 24 - CX - 84 });
  o += label(CR, 74, l.comoChamar, t, { anchor: 'end' });
  o += `<rect x="${bx}" y="88" width="${bw}" height="48" rx="12" fill="${t.term}"/>`;
  o += `<path d="M${bx + 18} 105l7 7-7 7" fill="none" stroke="${t.hl}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` + T(bx + 38, 119, chamar, { size: 19, mono: true, fill: t.termText });
  o += `<rect class="caret" x="${r1(bx + 38 + tw(chamar, 19, 400, true) + 3)}" y="101" width="10" height="22" rx="1.5" fill="${t.hl}"/>`;
  // quando usar: rótulo + chips (podem quebrar em duas linhas)
  const cx0 = CX + lw(l.quando) + 24, ch = chips(cx0, 174, c.chips_quando, CR, t, { size: 16, h: 36 });
  o += label(CX, 198, l.quando, t) + ch.svg;
  const y = 174 + ch.h + 26;
  o += hr(CX, CR, y, t);
  return { svg: o, y };
}
const caretCss = '.caret{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}';

// ---------- 2. muri-video ----------
// mini-ilustrações de cada etapa, desenhadas dentro de um quadro (x, y, w, h)
function arte(tipo, x, y, w, h, t) {
  const n = t.ink, line = (x1, y1, ww, op = 0.18, hh = 5) => `<rect x="${r1(x1)}" y="${r1(y1)}" width="${r1(ww)}" height="${hh}" rx="${hh / 2}" fill="${n}" fill-opacity="${op}"/>`;
  const cx = x + w / 2, cy = y + h / 2;
  switch (tipo) {
    case 'briefing': {
      let o = `<rect x="${r1(cx - 62)}" y="${r1(y + 16)}" width="124" height="${h - 32}" rx="9" fill="${n}" fill-opacity=".05" stroke="${n}" stroke-opacity=".14"/>`;
      o += line(cx - 50, y + 28, 70, 0.32, 6);
      [0, 1, 2].forEach(i => {
        const yy = y + 50 + i * 19;
        o += i === 0 ? `<circle cx="${r1(cx - 44)}" cy="${r1(yy)}" r="5" fill="url(#acc)"/>` + `<rect x="${r1(cx - 34)}" y="${r1(yy - 3)}" width="48" height="6" rx="3" fill="url(#accH)"/>` + `<rect x="${r1(cx + 20)}" y="${r1(yy - 6)}" width="30" height="12" rx="6" fill="${t.a2}" fill-opacity=".18"/>`
          : `<circle cx="${r1(cx - 44)}" cy="${r1(yy)}" r="4.5" fill="none" stroke="${n}" stroke-opacity=".3" stroke-width="1.4"/>` + line(cx - 34, yy - 3, 40 + i * 6, 0.16, 6);
      });
      return o;
    }
    case 'roteiro': {
      let o = '';
      [[62, 0.16], [80, 0.16], [70, 0], [84, 0.16], [52, 0.16]].forEach(([ww, op], i) => {
        const yy = y + 18 + i * 13;
        o += line(x + 18, yy, 10, 0.12, 6);
        o += op ? line(x + 34, yy, ww, op, 6) : `<rect x="${r1(x + 34)}" y="${r1(yy)}" width="${ww}" height="6" rx="3" fill="url(#accH)"/>`;
      });
      // forma de onda da voz
      const amps = [3, 6, 10, 7, 13, 9, 15, 8, 12, 5, 9, 4, 7, 3];
      amps.forEach((a, i) => { o += `<rect class="wv" style="animation-delay:${(i * 0.09).toFixed(2)}s" x="${r1(x + 22 + i * 9.6)}" y="${r1(y + h - 22 - a / 2)}" width="3" height="${a}" rx="1.5" fill="${t.a1}" fill-opacity=".75"/>`; });
      return o;
    }
    case 'direcao': {
      let o = '';
      [-1, 0, 1].forEach(i => {
        const fw = 40, fh = 46, fx = cx - fw / 2 + i * 48, fy = y + 18 - (i === 0 ? 4 : 0);
        o += `<rect x="${r1(fx)}" y="${r1(fy)}" width="${fw}" height="${fh}" rx="6" fill="${i === 0 ? t.a1 : n}" fill-opacity="${i === 0 ? 0.16 : 0.06}" stroke="${i === 0 ? 'url(#accH)' : n}" stroke-opacity="${i === 0 ? 0.9 : 0.16}" stroke-width="${i === 0 ? 1.5 : 1}"/>`;
        o += line(fx + 7, fy + 9, 18, i === 0 ? 0.35 : 0.2, 4) + `<circle cx="${r1(fx + fw - 12)}" cy="${r1(fy + fh - 13)}" r="6" fill="${i === 0 ? t.a2 : n}" fill-opacity="${i === 0 ? 0.8 : 0.14}"/>`;
      });
      [0, 1, 2, 3].forEach(i => { o += `<rect x="${r1(cx - 66 + i * 34)}" y="${r1(y + h - 30)}" width="28" height="16" rx="3.5" fill="${n}" fill-opacity=".07" stroke="${n}" stroke-opacity=".14"/>`; });
      return o;
    }
    case 'cenas': {
      const bars = [18, 28, 22, 40, 33];
      let o = `<g transform="translate(${r1(cx)} ${r1(cy - 2)}) skewY(-6) rotate(-4)"><rect x="-58" y="-36" width="116" height="72" rx="8" fill="${n}" fill-opacity=".06" stroke="${n}" stroke-opacity=".18"/>` + line(-48, -27, 40, 0.3, 5);
      bars.forEach((b, i) => { o += `<rect x="${-46 + i * 19}" y="${26 - b}" width="12" height="${b}" rx="2.5" fill="${i === 3 ? 'url(#acc)' : n}" fill-opacity="${i === 3 ? 1 : 0.2}"/>`; });
      o += '</g>';
      o += `<path class="cur" d="M${r1(cx + 22)} ${r1(cy + 8)}l0 17 4.6-4.4 3.2 7 3-1.4-3.2-6.8 6.3-.3z" fill="${t.text}" stroke="${t.screen}" stroke-width="1.2" stroke-linejoin="round"/>`;
      return o;
    }
    case 'som': {
      let o = '';
      const amps = [4, 8, 14, 22, 12, 6, 10, 18, 30, 16, 8, 5, 12, 24, 14, 7, 4];
      amps.forEach((a, i) => { o += `<rect x="${r1(x + 20 + i * 8.6)}" y="${r1(cy - 4 - a / 2)}" width="3.6" height="${a}" rx="1.8" fill="${[8, 13].includes(i) ? t.a2 : n}" fill-opacity="${[8, 13].includes(i) ? 0.95 : 0.24}"/>`; });
      o += line(x + 18, y + h - 22, w - 36, 0.12, 2);
      [3, 8, 13].forEach(i => { const dx = x + 21.8 + i * 8.6, dy = y + h - 21; o += `<path d="M${r1(dx)} ${r1(dy - 5)}l5 5-5 5-5-5z" fill="${i === 3 ? n : t.a2}" fill-opacity="${i === 3 ? 0.3 : 1}"/>`; });
      o += `<rect class="ph" x="${r1(x + 20)}" y="${r1(y + 14)}" width="1.6" height="${h - 30}" fill="${t.a1}"/>`;
      return o;
    }
    case 'render': {
      const fy = y + 18;
      let o = `<rect x="${r1(x + 18)}" y="${r1(fy + 6)}" width="88" height="50" rx="6" fill="${n}" fill-opacity=".06" stroke="url(#accH)" stroke-opacity=".8" stroke-width="1.4"/>` +
        `<path d="M${r1(x + 57)} ${r1(fy + 22)}v18l14-9z" fill="${t.a2}"/>` +
        `<rect x="${r1(x + w - 64)}" y="${r1(fy)}" width="34" height="62" rx="6" fill="${n}" fill-opacity=".06" stroke="${t.a1}" stroke-opacity=".8" stroke-width="1.4"/>` +
        `<path d="M${r1(x + w - 51)} ${r1(fy + 24)}v14l11-7z" fill="${t.a1}"/>`;
      o += line(x + 18, y + h - 24, w - 36, 0.12, 5) + `<rect class="bar" x="${r1(x + 18)}" y="${r1(y + h - 24)}" width="${r1(w - 36)}" height="5" rx="2.5" fill="url(#accH)"/>`;
      return o;
    }
  }
  throw new Error(`arte desconhecida: ${tipo}`);
}

function videoCard(mode, lang) {
  const t = TEMAS[mode], l = L[lang], s = dados.autorais.find(a => a.nome === 'muri-video'), c = s[lang], pt = s.pt;
  const head = cabecalho(s, c, t, l, s.ativar);
  const n = c.etapas.length, gap = 16, fw = (CR - CX - gap * (n - 1)) / n, fy = head.y + 66, fh = 132;
  const capS = 16.5, caps = c.etapas.map(e => wrap(e.linhas.join(' '), capS, fw - 2));
  const capRows = Math.max(...caps.map(x => x.length));
  const ey = fy + fh + 104 + (capRows - 1) * 23 + 34; // linha divisória das entregas
  const ex0 = CX + Math.max(lw(l.entrega), lw(l.quando)) + 24;
  const ent = chips(ex0, ey + 30, c.chips_entrega, CR, t, { size: 16, h: 36 });
  const oy = ey + 30 + ent.h + 44, H = oy + 38 + FX;
  const defs = `${glow('g1', t.a1, t.glowA, 1080, 0, 560, 320)}${glow('g2', t.a2, r1(t.glowA * 4) / 10, 140, H, 520, 240)}
<clipPath id="trk"><rect x="${CX}" y="${fy + fh + 16}" width="${CR - CX}" height="4"/></clipPath>
<linearGradient id="pulse" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a2}" stop-opacity="0"/><stop offset=".75" stop-color="${t.a2}"/><stop offset="1" stop-color="${t.a1}"/></linearGradient>`;
  const css = `${caretCss}
.pulse{animation:pl 6s cubic-bezier(.55,0,.25,1) infinite}@keyframes pl{0%{transform:translateX(0)}75%,100%{transform:translateX(${CR - CX + 80}px)}}
.wv{animation:wv 1.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}@keyframes wv{to{transform:scaleY(.45)}}
.ph{animation:ph 4s linear infinite}@keyframes ph{to{transform:translateX(${Math.round(fw - 42)}px)}}
.cur{animation:cu 3.2s ease-in-out infinite}@keyframes cu{0%,100%{transform:translate(0,0)}50%{transform:translate(-5px,-6px)}}
.bar{animation:ba 4.5s cubic-bezier(.6,0,.3,1) infinite;transform-box:fill-box;transform-origin:left}@keyframes ba{0%{transform:scaleX(.08)}70%,100%{transform:scaleX(1)}}`;
  let strip = '';
  c.etapas.forEach((e, i) => {
    const x = CX + i * (fw + gap), meta = pt.etapas[i];
    strip += `<rect x="${r1(x)}" y="${fy}" width="${r1(fw)}" height="${fh}" rx="14" fill="${t.screen}" stroke="${t.line}" stroke-opacity="${r1(t.lineA * 12) / 10}"/>`;
    strip += arte(meta.arte, x, fy, fw, fh, t);
    if (meta.aprova) strip += check(x + fw - 4, fy + 4, t);
    strip += T(x + 2, fy + fh + 50, `0${i + 1}`, { size: LBL, mono: true, w: 500, fill: t.a2t });
    strip += T(x + 2, fy + fh + 77, e.titulo, { size: 19, w: 600, fill: t.text, ls: -0.3, max: fw - 2 });
    caps[i].forEach((ln, k) => { strip += T(x + 2, fy + fh + 104 + k * 23, ln, { size: capS, fill: t.muted, max: fw - 2 }); });
  });
  strip += `<rect x="${CX}" y="${fy + fh + 17}" width="${CR - CX}" height="1.5" fill="url(#accH)" opacity=".35"/>`;
  strip += `<g clip-path="url(#trk)"><rect class="pulse" x="${CX - 80}" y="${fy + fh + 16.5}" width="80" height="2.5" rx="1.2" fill="url(#pulse)"/></g>`;
  const aw = tw(l.aprova, 16, 400) + 28, ly = head.y + 40;
  const orq = s.orquestra.join(' · ');
  const mx = CR - tw(s.motor, 16, 400, true) - 14;
  if (CX + lw(l.orquestra) + 14 + tw(orq, 16, 400, true) > mx - lw(l.motor) - 32) throw new Error('linha orquestra/motor estoura');
  const body = `<rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>
${card(FX, FX, W - 2 * FX, H - 2 * FX, FR)}
${head.svg}
${label(CX, ly, l.etapas, t)}
${check(CR - aw + 8, ly - 5, t, 8)}${T(CR, ly, l.aprova, { size: 16, fill: t.muted, anchor: 'end' })}
${strip}
${hr(CX, CR, ey, t)}
${label(CX, ey + 54, l.entrega, t)}
${ent.svg}
${label(CX, oy, l.orquestra, t)}
${T(CX + lw(l.orquestra) + 14, oy, orq, { size: 16, mono: true, fill: t.soft })}
${T(CR, oy, s.motor, { size: 16, mono: true, fill: t.soft, anchor: 'end' })}
${label(mx, oy, l.motor, t, { anchor: 'end' })}`;
  return svg(W, H, t, `${s.nome}: ${c.resumo}`, defs, body, css);
}

// ---------- 3. muri-saver ----------
function saverCard(mode, lang) {
  const t = TEMAS[mode], l = L[lang], s = dados.autorais.find(a => a.nome === 'muri-saver'), c = s[lang], pt = s.pt;
  const head = cabecalho(s, c, t, l, s.ativar);
  const py = head.y + 36, ph = 340, ry = py + ph + 60, rowH = 104, cols = 3, rows = Math.ceil(c.regras.length / cols);
  const fy = ry + 24 + rows * rowH + 40, H = fy + 38 + FX;
  const defs = `${glow('g1', t.a1, t.glowA, 1120, H, 560, 320)}${glow('g2', t.a2, r1(t.glowA * 4) / 10, 200, 0, 520, 240)}
<linearGradient id="arc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a1}"/><stop offset=".6" stop-color="${t.a2}"/><stop offset="1" stop-color="${t.a2}"/></linearGradient>`;
  const css = `${caretCss}
.flow{stroke-dasharray:4 8;animation:fl 1.6s linear infinite}@keyframes fl{to{stroke-dashoffset:-24}}
.needle{animation:nd 5s ease-in-out infinite}@keyframes nd{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}`;

  // medidor de contexto: agulha cheia = com a skill, agulha tracejada = sem
  const gx = CX, gw = 500, cx = gx + gw / 2, cy = py + 236, R = 128;
  const pt0 = p => { const a = Math.PI + p * Math.PI; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
  const arc = (p0, p1, r = R) => { const a0 = Math.PI + p0 * Math.PI, a1 = Math.PI + p1 * Math.PI; return `M${r1(cx + r * Math.cos(a0))} ${r1(cy + r * Math.sin(a0))}A${r} ${r} 0 0 1 ${r1(cx + r * Math.cos(a1))} ${r1(cy + r * Math.sin(a1))}`; };
  let g = card(gx, py, gw, ph, PR) + label(gx + 28, py + 40, c.gauge.titulo, t);
  g += `<path d="${arc(0, 1)}" fill="none" stroke="${t.ink}" stroke-opacity=".07" stroke-width="16" stroke-linecap="round"/>`;
  g += `<path d="${arc(0, 0.55)}" fill="none" stroke="${t.a1}" stroke-width="16" stroke-linecap="round"/>`;
  g += `<path d="${arc(0.6, 0.79)}" fill="none" stroke="url(#arc)" stroke-opacity=".75" stroke-width="16"/>`;
  g += `<path d="${arc(0.84, 1)}" fill="none" stroke="${t.a2}" stroke-width="16" stroke-linecap="round"/>`;
  for (let k = 0; k <= 10; k++) { const a = Math.PI + k / 10 * Math.PI, r0 = R + 16, r2 = R + (k % 5 ? 21 : 26); g += `<path d="M${r1(cx + r0 * Math.cos(a))} ${r1(cy + r0 * Math.sin(a))}L${r1(cx + r2 * Math.cos(a))} ${r1(cy + r2 * Math.sin(a))}" stroke="${t.ink}" stroke-opacity=".25" stroke-width="1.4" stroke-linecap="round"/>`; }
  const zl = [[0.25, c.gauge.zonas[0]], [0.7, c.gauge.zonas[1]], [0.93, c.gauge.zonas[2]]];
  zl.forEach(([p, z], i) => { const a = Math.PI + p * Math.PI, rr = R + [48, 44, 64][i]; g += T(cx + rr * Math.cos(a), cy + rr * Math.sin(a) + 5, z, { size: LBL, mono: true, fill: i === 0 ? t.a1 : t.a2t, anchor: 'middle', w: 500 }); });
  const [gxp, gyp] = pt0(0.94), [nxp, nyp] = pt0(0.3);
  g += `<path d="M${cx} ${cy}L${r1(cx + (gxp - cx) * 0.9)} ${r1(cy + (gyp - cy) * 0.9)}" stroke="${t.muted}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round" opacity=".8"/>`;
  g += `<g class="needle" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy}L${r1(cx + (nxp - cx) * 0.92)} ${r1(cy + (nyp - cy) * 0.92)}" stroke="${t.text}" stroke-width="3.2" stroke-linecap="round"/></g>`;
  g += `<circle cx="${cx}" cy="${cy}" r="9" fill="${t.bg}" stroke="${t.text}" stroke-width="3"/>`;
  g += `<path d="M${gx + 40} ${py + ph - 52}h22" stroke="${t.text}" stroke-width="3" stroke-linecap="round"/>` + T(gx + 74, py + ph - 46, c.gauge.com, { size: 16.5, fill: t.text, w: 500, max: gw - 100 });
  g += `<path d="M${gx + 40} ${py + ph - 24}h22" stroke="${t.muted}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>` + T(gx + 74, py + ph - 18, c.gauge.sem, { size: 16.5, fill: t.muted, max: gw - 100 });

  // diagrama de delegação: 28 px de respiro nos quatro lados
  const ox = gx + gw + 24, ow = CR - ox, d = c.delegacao, nh = 64, pad = 28, nw = (ow - 2 * pad - 20) / 2, mid = ox + ow / 2;
  const y1 = py + 60, y2 = y1 + nh + 30, y3 = y2 + nh + 30;
  assert.equal(y3 + nh + pad, py + ph, 'painel de delegação sem respiro de 28 px embaixo');
  const node = (x, y, ic, [a, b], acc) => card(x, y, nw, nh, 14) + tile(ic, x + 13, y + 13, 38, t, acc) +
    T(x + 64, y + 29, a, { size: 18, w: 600, fill: t.text }) + T(x + 64, y + 50, b, { size: LBL, fill: t.muted, max: nw - 74 });
  const wire = p => `<path class="flow" d="${p}" stroke="${t.a2}" stroke-opacity=".8" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const lx = ox + pad + nw / 2, rx = ox + ow - pad - nw / 2, jy = y2 + nh + 15;
  let dg = card(ox, py, ow, ph, PR) + label(ox + pad, py + 40, d.titulo, t, { max: ow - 2 * pad });
  dg += wire(`M${mid} ${y1 + nh}V${y2}`);
  dg += wire(`M${mid} ${y2 + nh}V${jy - 8}Q${mid} ${jy} ${mid - 8} ${jy}H${lx + 8}Q${lx} ${jy} ${lx} ${jy + 8}V${y3}`);
  dg += wire(`M${mid} ${jy - 8}Q${mid} ${jy} ${mid + 8} ${jy}H${rx - 8}Q${rx} ${jy} ${rx} ${jy + 8}V${y3}`);
  dg += node(mid - nw / 2, y1, 'person', d.voce, false) + node(mid - nw / 2, y2, 'gauge', d.agente, true);
  dg += node(lx - nw / 2, y3, 'search', d.gemini, false) + node(rx - nw / 2, y3, 'code', d.codex, false);

  // regras
  const cw = (CR - CX - 32) / cols;
  let rg = label(CX, ry, l.regras, t);
  c.regras.forEach((r, i) => {
    const x = CX + (i % cols) * (cw + 16), y = ry + 24 + Math.floor(i / cols) * rowH;
    rg += tile(pt.regras[i].icone, x, y + 2, 44, t, i === 5);
    rg += T(x + 60, y + 22, r.titulo, { size: 19, w: 600, fill: t.text, ls: -0.3, max: cw - 64 });
    const ls = wrap(r.texto, 16.5, cw - 64);
    assert.ok(ls.length <= 2, `regra longa demais: ${r.texto}`);
    ls.forEach((ln, k) => { rg += T(x + 60, y + 48 + k * 23, ln, { size: 16.5, fill: t.muted }); });
  });

  const foot = [[l.ativar, s.ativar], [l.desativar, lang === 'en' ? s.desativar_en : s.desativar], [l.kit, s.kit.replace('https://', '')]];
  let ft = hr(CX, CR, fy - 40, t), fx = CX;
  foot.forEach(([k, v], i) => {
    ft += label(fx, fy, k, t);
    const vx = fx + lw(k) + 14;
    ft += T(vx, fy, v, { size: 17, mono: true, fill: i === 0 ? t.text : t.soft, w: i === 0 ? 500 : 400 });
    fx = vx + tw(v, 17, 400, true) + 40;
  });
  if (fx - 40 > CR) throw new Error('rodapé do muri-saver estoura');
  const body = `<rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>
${card(FX, FX, W - 2 * FX, H - 2 * FX, FR)}
${head.svg}
${g}${dg}${rg}${ft}`;
  return svg(W, H, t, `${s.nome}: ${c.resumo}`, defs, body, css);
}

// ---------- 3b. muri-design ----------
// dois painéis (reprovado × aprovado) desenhados com as próprias regras, as 6 regras e o processo no rodapé
function designCard(mode, lang) {
  const t = TEMAS[mode], l = L[lang], s = dados.autorais.find(a => a.nome === 'muri-design'), c = s[lang], pt = s.pt;
  const head = cabecalho(s, c, t, l, s.ativar);
  const py = head.y + 36, ph = 300, gap = 24, pw = (CR - CX - gap) / 2;
  const ry = py + ph + 60, rowH = 104, cols = 3, rows = Math.ceil(c.regras.length / cols);
  const fy = ry + 24 + rows * rowH + 40, H = fy + 38 + FX;
  const defs = `${glow('g1', t.a1, t.glowA, 160, H, 560, 320)}${glow('g2', t.a2, r1(t.glowA * 4) / 10, 1120, 0, 520, 240)}
<linearGradient id="ruim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A78BFA" stop-opacity=".75"/><stop offset="1" stop-color="#E0825F" stop-opacity=".75"/></linearGradient>`;
  const css = `${caretCss}
.mk{animation:mk 5s cubic-bezier(.6,0,.3,1) infinite;transform-box:fill-box;transform-origin:left}@keyframes mk{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.82)}}`;
  const mh = ph - 60 - 28 - 34;
  const painel = (x, bom) => {
    const mx = x + 28, my = py + 60, mw = pw - 56;
    let o = card(x, py, pw, ph, PR) + label(mx, py + 40, bom ? c.painel.bom : c.painel.ruim, t);
    if (bom) o += check(x + pw - 36, py + 35, t);
    else o += `<circle cx="${r1(x + pw - 36)}" cy="${py + 35}" r="9" fill="none" stroke="${t.a2t}" stroke-width="1.6"/><path d="M${r1(x + pw - 40)} ${py + 31}l8 8m0-8l-8 8" stroke="${t.a2t}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (bom) {
      // base lisa, título com uma faixa de acento, tela real escura com selo
      o += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="12" fill="${t.screen}" stroke="${t.line}" stroke-opacity="${r1(t.lineA * 12) / 10}"/>`;
      o += `<rect x="${mx + 22}" y="${my + 22}" width="${r1(mw * 0.5)}" height="14" rx="3" fill="${t.ink}" fill-opacity=".78"/>`;
      o += `<rect class="mk" x="${mx + 22}" y="${my + 44}" width="${r1(mw * 0.36)}" height="14" rx="3" fill="${t.hl}"/>`;
      const sy = my + 74, sh = mh - 74 - 38;
      o += `<rect x="${mx + 22}" y="${sy}" width="${mw - 44}" height="${sh}" rx="8" fill="${t.shadow ? '#16131A' : '#08070A'}" stroke="${t.line}" stroke-opacity="${t.shadow ? 0 : 0.18}"/>`;
      [[0.42, 0.55], [0.6, 0.3], [0.34, 0.3]].forEach(([f, op], k) => { o += `<rect x="${mx + 38}" y="${sy + 16 + k * 16}" width="${r1((mw - 76) * f)}" height="6" rx="3" fill="#F5F2EF" fill-opacity="${op}"/>`; });
      o += T(mx + 22, my + mh - 14, c.painel.selo, { size: LBL, mono: true, fill: t.muted });
    } else {
      // fundo em gradiente com pontos, grade de cards iguais com emoji
      o += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="12" fill="url(#ruim)"/><rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="12" fill="url(#dots)"/>`;
      const cw = (mw - 32 - 24) / 3, chh = (mh - 32 - 12) / 2;
      for (let k = 0; k < 6; k++) {
        const cx = mx + 16 + (k % 3) * (cw + 12), cy = my + 16 + Math.floor(k / 3) * (chh + 12);
        o += `<rect x="${r1(cx)}" y="${r1(cy)}" width="${r1(cw)}" height="${r1(chh)}" rx="8" fill="#FFFFFF" fill-opacity=".42" stroke="#FFFFFF" stroke-opacity=".6"/>`;
        o += `<circle cx="${r1(cx + 20)}" cy="${r1(cy + 20)}" r="8" fill="#FFC83D"/><circle cx="${r1(cx + 17.5)}" cy="${r1(cy + 18.5)}" r="1.2" fill="#5A3A00"/><circle cx="${r1(cx + 22.5)}" cy="${r1(cy + 18.5)}" r="1.2" fill="#5A3A00"/>`;
        o += `<rect x="${r1(cx + 12)}" y="${r1(cy + chh - 24)}" width="${r1(cw * 0.6)}" height="5" rx="2.5" fill="#FFFFFF" fill-opacity=".8"/><rect x="${r1(cx + 12)}" y="${r1(cy + chh - 14)}" width="${r1(cw * 0.4)}" height="5" rx="2.5" fill="#FFFFFF" fill-opacity=".55"/>`;
      }
    }
    o += T(mx, py + ph - 24, bom ? c.painel.bomTxt : c.painel.ruimTxt, { size: 16.5, fill: bom ? t.text : t.muted, w: bom ? 500 : 400, max: mw });
    return o;
  };

  const cw = (CR - CX - 32) / cols;
  let rg = label(CX, ry, l.regras, t);
  c.regras.forEach((r, i) => {
    const x = CX + (i % cols) * (cw + 16), y = ry + 24 + Math.floor(i / cols) * rowH;
    rg += tile(pt.regras[i].icone, x, y + 2, 44, t, i === 0);
    rg += T(x + 60, y + 22, r.titulo, { size: 19, w: 600, fill: t.text, ls: -0.3, max: cw - 64 });
    const ls = wrap(r.texto, 16.5, cw - 64);
    assert.ok(ls.length <= 2, `regra longa demais: ${r.texto}`);
    ls.forEach((ln, k) => { rg += T(x + 60, y + 48 + k * 23, ln, { size: 16.5, fill: t.muted }); });
  });

  let ft = hr(CX, CR, fy - 40, t);
  const vx = CX + lw(l.processo) + 14;
  ft += label(CX, fy, l.processo, t) + T(vx, fy, c.processo, { size: 17, mono: true, fill: t.soft });
  const ax = CR - tw(s.ativar, 17, 500, true);
  ft += T(ax, fy, s.ativar, { size: 17, mono: true, fill: t.text, w: 500 }) + label(ax - 14, fy, l.ativar, t, { anchor: 'end' });
  if (vx + tw(c.processo, 17, 400, true) + 32 > ax - 14 - lw(l.ativar)) throw new Error('rodapé do muri-design estoura');
  const body = `<rect width="${W}" height="${H}" fill="url(#g1)"/><rect width="${W}" height="${H}" fill="url(#g2)"/>
${card(FX, FX, W - 2 * FX, H - 2 * FX, FR)}
${head.svg}
${painel(CX, false)}${painel(CX + pw + gap, true)}${rg}${ft}`;
  return svg(W, H, t, `${s.nome}: ${c.resumo}`, defs, body, css);
}

// ---------- 4. stack ----------
// O título fica no H2 do README; a imagem abre direto no subtítulo.
function stack(mode, lang) {
  const t = TEMAS[mode], l = L[lang], rowH = 98, top = 92, PW = W - 2 * FX, IP = CX - FX;
  const grupos = dados.grupos.map(g => ({ ...g, itens: dados.stack.filter(s => s.grupo === g.id) }));
  for (const s of dados.stack) assert.ok(dados.grupos.some(g => g.id === s.grupo), `grupo inválido em ${s.nome}`);
  const item = (s, x, y, maxW) => {
    const meta = `${s.autor} · ${s.licenca ?? RL[lang].semLicenca}`;
    return tile(s.icone, x, y + 4, 44, t) +
      T(x + 60, y + 20, s.nome, { size: 20, w: 600, fill: t.text, ls: -0.3, max: maxW - 60 }) +
      T(x + 60, y + 44, meta, { size: LBL, mono: true, fill: t.muted, max: maxW - 60 }) +
      T(x + 60, y + 70, s[lang].resumo, { size: 16.5, fill: t.soft, max: maxW - 60 });
  };
  let y = top, body = '';
  // grupo principal em largura total, os demais em pares
  const [g0, ...resto] = grupos;
  {
    const rows = Math.ceil(g0.itens.length / 2), h = rows * rowH + 58, labelW = 240, ix = CX + labelW, iw = (CR - ix - 24) / 2;
    const desc = wrap(g0[lang].desc, 16.5, labelW - 44);
    const bh = 44 + 50 + desc.length * 24, by = y + (h - bh) / 2; // bloco de abertura centrado na altura do painel
    body += card(FX, y, PW, h, FR) + tile(g0.icone, CX, by, 44, t, true);
    body += T(CX, by + 82, g0[lang].nome, { size: 24, w: 600, ls: -0.5, fill: t.text });
    body += desc.map((ln, k) => T(CX, by + 114 + k * 24, ln, { size: 16.5, fill: t.muted })).join('');
    body += `<rect x="${ix - 28}" y="${y + 28}" width="1" height="${h - 56}" fill="${t.line}" fill-opacity="${t.lineA}"/>`;
    g0.itens.forEach((s, i) => { body += item(s, ix + (i % 2) * (iw + 24), y + 30 + Math.floor(i / 2) * rowH, iw); });
    y += h + 16;
  }
  for (let p = 0; p < resto.length; p += 2) {
    const par = resto.slice(p, p + 2), hw = (PW - 16) / 2;
    const descs = par.map(g => wrap(g[lang].desc, 16, hw - 2 * IP - 60));
    const hh = 96 + (Math.max(...descs.map(d => d.length)) - 1) * 22;
    const h = hh + 18 + Math.max(...par.map(g => g.itens.length)) * rowH + 14;
    par.forEach((g, k) => {
      const x = FX + k * (hw + 16), xc = x + IP;
      body += card(x, y, hw, h, FR) + tile(g.icone, xc, y + 30, 44, t, true);
      body += T(xc + 60, y + 50, g[lang].nome, { size: 22, w: 600, ls: -0.5, fill: t.text });
      body += descs[k].map((ln, j) => T(xc + 60, y + 76 + j * 22, ln, { size: 16, fill: t.muted })).join('');
      body += hr(xc, x + hw - IP, y + hh, t);
      g.itens.forEach((s, i) => { body += item(s, xc, y + hh + 22 + i * rowH, hw - 2 * IP); });
    });
    y += h + 16;
  }
  const H = y + 56;
  const head = `${t.flat ? `<rect width="${W}" height="${H}" rx="${FR}" fill="${t.bg}"/>` : ''}<rect width="${W}" height="${H}" fill="url(#g1)"/>
${T(W / 2, 54, l.stackSub, { size: 18, anchor: 'middle', fill: t.muted, max: W - 2 * CX })}`;
  const foot = T(W / 2, H - 26, l.stackRodape, { size: LBL, anchor: 'middle', fill: t.muted, max: W - 2 * CX });
  return svg(W, H, t, l.titulos.stack, glow('g1', t.a1, t.glowA, 640, -40, 720, 320), head + body + foot);
}
function wrap(text, size, max, w = 400) {
  const out = [];
  for (const word of text.split(' ')) {
    const cur = out.length ? `${out[out.length - 1]} ${word}` : word;
    if (out.length && tw(cur, size, w) <= max) out[out.length - 1] = cur; else out.push(word);
  }
  return out;
}

// ---------- README: tabelas da stack e comandos de instalação ----------
const RL = {
  pt: { para: 'Para que serve.', quando: 'Quando usar.', peca: 'Peça assim:', recebe: 'O que você recebe.', cols: ['Skill', 'Para que serve', 'Peça assim'], semLicenca: 'sem arquivo de licença', entrega: 'Entrega', dentro: 'dentro do Claude Code', resumoInstalar: 'Comandos de instalação de cada skill da stack' },
  en: { para: 'What it is for.', quando: 'When to use it.', peca: 'Ask like this:', recebe: 'What you get.', cols: ['Skill', 'What it is for', 'Ask like this'], semLicenca: 'no license file', entrega: 'You get', dentro: 'inside Claude Code', resumoInstalar: 'Install commands for every skill in the stack' },
};
function blocoStack(lang) {
  const r = RL[lang], cel = s => s.replace(/\|/g, '\\|');
  return dados.grupos.map(g => {
    const itens = dados.stack.filter(s => s.grupo === g.id);
    const linhas = itens.map(s => `| [\`${s.nome}\`](${s.repo})<br><sub>[${s.autor}](https://github.com/${s.github}) · ${s.licenca ?? r.semLicenca}</sub> | ${cel(s[lang].para_que_serve)}<br><sub>${r.entrega}: ${cel(s[lang].entrega)}</sub> | <sub>“${cel(s[lang].quando_usar)}”</sub> |`);
    return `<details>\n<summary><b>${g[lang].nome}</b> · ${itens.map(s => s.nome).join(', ')}</summary>\n\n| ${r.cols.join(' | ')} |\n|---|---|---|\n${linhas.join('\n')}\n\n</details>`;
  }).join('\n\n');
}
function blocoAutoral(nome, lang) {
  const s = dados.autorais.find(a => a.nome === nome), c = s[lang], r = RL[lang];
  return `**${r.para}** ${c.para_que_serve}\n\n**${r.quando}** ${c.chips_quando.map((x, i) => i ? x : x[0].toUpperCase() + x.slice(1)).join(' · ')}. ${r.peca} \`${c.quando_usar}\`\n\n**${r.recebe}** ${c.entrega}\n\n\`\`\`bash\n${s.instalar}\n\`\`\``;
}
function blocoInstalar(lang) {
  const r = RL[lang];
  const cmds = dados.stack.map(s => `# ${s.nome} (${s.autor}, ${s.licenca ?? r.semLicenca})${s.instalar.startsWith('/') ? `, ${r.dentro}` : ''}\n${s.instalar}`);
  return `<details>\n<summary>${r.resumoInstalar}</summary>\n\n\`\`\`bash\n${cmds.join('\n\n')}\n\`\`\`\n\n</details>`;
}
function reescrever(arquivo, nome, conteudo) {
  const url = new URL(arquivo, raiz), txt = fs.readFileSync(url, 'utf8');
  const re = new RegExp(`(<!-- gerado:${nome} -->)[\\s\\S]*?(<!-- /gerado:${nome} -->)`);
  assert.match(txt, re, `${arquivo} sem o bloco gerado:${nome}`);
  const novo = txt.replace(re, (_, a, b) => `${a}\n${conteudo}\n${b}`);
  if (novo !== txt) fs.writeFileSync(url, novo);
}

// ---------- saída ----------
const arquivos = {};
for (const lang of ['pt', 'en']) for (const mode of ['dark', 'light']) {
  const suf = `-${mode}${lang === 'en' ? '.en' : ''}.svg`;
  arquivos[`hero${suf}`] = hero(mode, lang);
  arquivos[`card-muri-video${suf}`] = videoCard(mode, lang);
  arquivos[`card-muri-saver${suf}`] = saverCard(mode, lang);
  arquivos[`card-muri-design${suf}`] = designCard(mode, lang);
  arquivos[`stack${suf}`] = stack(mode, lang);
}
// apaga SVGs antigos que não são mais gerados
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg') && !(f in arquivos)) fs.rmSync(new URL(f, OUT));
for (const [f, s] of Object.entries(arquivos)) {
  assert.ok(!/<script|href=|xlink:|url\((?!#|data:)/i.test(s), `${f}: referência externa ou script`);
  assert.ok(s.length < 150 * 1024, `${f}: ${Math.round(s.length / 1024)} KB passa de 150 KB`);
  fs.writeFileSync(new URL(f, OUT), s);
}
for (const [arquivo, lang] of [['README.md', 'pt'], ['README.en.md', 'en']]) {
  reescrever(arquivo, 'stack', blocoStack(lang));
  reescrever(arquivo, 'instalar', blocoInstalar(lang));
  for (const a of dados.autorais) reescrever(arquivo, a.nome, blocoAutoral(a.nome, lang));
}
console.log(Object.entries(arquivos).map(([f, s]) => `${f} ${(s.length / 1024).toFixed(1)} KB`).join('\n'));
