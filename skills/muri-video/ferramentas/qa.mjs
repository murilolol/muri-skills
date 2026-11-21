#!/usr/bin/env node
// QA automático da entrega (SKILL.md regra 9, references/render.md): mede out/final/*.mp4 e gera pranchas de QA.
// Uso: node qa.mjs <pasta-do-projeto> [--sem-prancha] [--cenas abertura:0,meio:5.2,...]
// Só node (stdlib) + ffmpeg/ffprobe no PATH + python3 com PIL (prancha.py). Sai com 1 se algo falhar.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i < 0 ? null : args.splice(i, 2)[1]; };
const cenasArg = opt('--cenas');
const semPrancha = args.includes('--sem-prancha');
const pasta = args.find((a) => !a.startsWith('--'));
if (!pasta) { console.error('uso: node qa.mjs <pasta-do-projeto> [--sem-prancha] [--cenas a:0,b:5.2,...]'); process.exit(1); }

const raiz = path.resolve(pasta);
const final = path.join(raiz, 'out/final');
const json = (rel) => JSON.parse(fs.readFileSync(path.join(raiz, rel), 'utf8'));
const run = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!fs.existsSync(final)) { console.error(`${final} não existe; renderize a entrega antes.`); process.exit(1); }

let fps = 30;
try { fps = json('src/plano.json').fps ?? 30; } catch { /* sem plano.json: usa 30 */ }

const arquivos = fs.readdirSync(final).filter((f) => f.endsWith('.mp4')).sort();
const nome = /^(.+)-(16x9|9x16)(-4k)?(-sem-trilha)?\.mp4$/;
const linhas = []; // [arquivo, LUFS, TP, duração, status]
const falhas = [];
const falhar = (alvo, msg) => { falhas.push(`${alvo}: ${msg}`); };

const medidas = arquivos.map((f) => {
  const p = path.join(final, f);
  const m = nome.exec(f);
  const d = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).stdout);
  const l = run('ffmpeg', ['-hide_banner', '-nostats', '-i', p, '-vn', '-af', 'loudnorm=print_format=json', '-f', 'null', '-']).stderr;
  let lufs = NaN; let tp = NaN;
  try { const j = JSON.parse(l.slice(l.lastIndexOf('{'), l.lastIndexOf('}') + 1)); lufs = Number(j.input_i); tp = Number(j.input_tp); } catch { /* sem áudio */ }
  const erros = [];
  if (!m) erros.push('nome fora do padrão <p>-<formato>{-4k}{-sem-trilha}.mp4');
  if (!(d > 0)) erros.push('duração ilegível');
  if (!Number.isFinite(lufs) || Math.abs(lufs + 16) > 1) erros.push(`LUFS ${lufs} fora de −16 ±1`);
  if (!Number.isFinite(tp) || tp > -1.5) erros.push(`true peak ${tp} > −1,5 dBTP`);
  for (const e of erros) falhar(f, e);
  linhas.push([f, lufs.toFixed(1), tp.toFixed(1), `${d.toFixed(3)}s`, erros.length ? 'FALHA' : 'OK']);
  return { f, p, d, m };
});

// Com/sem trilha: mesma duração (±1 quadro), em cada formato e resolução; formatos entre si também.
const grupos = {};
for (const x of medidas.filter((x) => x.m)) (grupos[`${x.m[1]}${x.m[3] ?? ''}`] ??= []).push(x);
for (const [g, xs] of Object.entries(grupos)) {
  const comTrilha = (x) => !x.m[4];
  for (const f of ['16x9', '9x16']) {
    const par = xs.filter((x) => x.m[2] === f);
    if (par.length && !(par.some(comTrilha) && par.some((x) => !comTrilha(x)))) falhar(`${g}`, `${f} sem a versão ${par.some(comTrilha) ? 'sem-trilha' : 'com trilha'}`);
  }
  const ds = xs.map((x) => x.d);
  if (Math.max(...ds) - Math.min(...ds) > 1 / fps + 1e-3) falhar(g, `durações diferem ${Math.round((Math.max(...ds) - Math.min(...ds)) * fps)} quadro(s) (${xs.map((x) => `${x.f}=${x.d.toFixed(3)}`).join(', ')})`);
}
if (!fs.readdirSync(final).some((f) => f.endsWith('.vtt'))) falhar('out/final', 'sem legenda .vtt');
if (!arquivos.length) falhar('out/final', 'nenhum MP4');

// Cenas: início/fim em segundos. Mesma regra de src/narracao.tsx do template (respiro + voz + respiro, menos a transição).
function cenas() {
  if (cenasArg) {
    const ini = cenasArg.split(',').map((s) => { const [id, t] = s.split(':'); return [id, Number(t)]; });
    return ini.map(([id, t], i) => [id, t, (ini[i + 1]?.[1] ?? medidas[0].d) - 1 / fps]);
  }
  const plano = json('src/plano.json');
  const dur = json('src/narracao.json');
  const ids = Object.keys(json('src/roteiro.json').cenas);
  const T = plano.transicao;
  const frames = ids.map((id) => {
    const r = plano.cenas[id];
    const voz = dur[id]?.segundos ?? Math.max(2, json('src/roteiro.json').cenas[id].split(/\s+/).length / 2.6); // sem voz gravada: estimativa do template
    return Math.round((r.entrada + voz + r.saida) * plano.fps);
  });
  let inicio = 0;
  return ids.map((id, i) => {
    const s = inicio; inicio += frames[i] - T;
    return [id, s / fps, (s + frames[i] - (i < ids.length - 1 ? T : 0) - 1) / fps];
  });
}

if (!semPrancha && medidas.length) {
  try {
    const por = (f) => medidas.find((x) => x.m?.[2] === f && !x.m[4] && !x.m[3]) ?? medidas.find((x) => x.m?.[2] === f && !x.m[4]);
    const [h, v] = [por('16x9'), por('9x16')];
    if (!h || !v) throw new Error('faltam os dois formatos (com trilha) para a prancha');
    const qa = path.join(raiz, 'out/qa');
    fs.mkdirSync(qa, { recursive: true });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'muri-qa-'));
    const encaixe = 'scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2'; // 9:16 vira coluna central; prancha.py espera largura 960
    const lista = cenas();
    lista.forEach(([id, ini, fim], i) => {
      const imgs = [];
      for (const [tag, t] of [['ini', ini], ['meio', (ini + fim) / 2], ['fim', fim]]) {
        for (const [fmt, x] of [['16x9', h], ['9x16', v]]) {
          const img = path.join(tmp, `${fmt}-${tag}.png`);
          const r = run('ffmpeg', ['-v', 'error', '-y', '-ss', Math.min(t, x.d - 1 / fps).toFixed(3), '-i', x.p, '-frames:v', '1', '-vf', encaixe, img]);
          if (r.status !== 0) throw new Error(`ffmpeg falhou em ${id}/${fmt}-${tag}: ${r.stderr.trim()}`);
          imgs.push(img);
        }
      }
      const saida = path.join(qa, `${String(i + 1).padStart(2, '0')}-${id}.jpg`);
      const r = run('python3', ['-E', path.join(import.meta.dirname, 'prancha.py'), saida, ...imgs]);
      if (r.status !== 0) throw new Error(`prancha.py falhou: ${r.stderr.trim()}`);
    });
    fs.rmSync(tmp, { recursive: true });
    console.log(`Pranchas: ${qa} (${lista.length} cenas; colunas 16:9 | 9:16, linhas início/meio/fim)`);
  } catch (e) {
    falhar('prancha', e.code === 'ENOENT' ? `${e.message} (use --cenas a:0,b:5.2 ou --sem-prancha)` : e.message);
  }
}

const larg = Math.max(...linhas.map((l) => l[0].length), 7);
console.log(['arquivo'.padEnd(larg), 'LUFS', 'TP dBTP', 'duração', 'status'].join('  '));
for (const l of linhas) console.log([l[0].padEnd(larg), l[1].padStart(5), l[2].padStart(7), l[3].padStart(8), l[4]].join('  '));
for (const f of falhas) console.log(`FALHA ${f}`);
console.log(`\nNão medido (confira a olho nas pranchas): área segura (270 px livres em cima e embaixo no 9:16), texto de apoio ≥ 32 px, nada sob a legenda.`);
console.log(falhas.length ? `QA: ${falhas.length} falha(s)` : 'QA: OK');
process.exit(falhas.length ? 1 : 0);
