#!/usr/bin/env node
// muri: vídeos do Muri Video na árvore do Orca (~/videos/muri-video/<cliente>/<video>/vN; raiz em MURI_ORCA_RAIZ).
// Cada vN é um worktree do repo Muri Video e nunca é sobrescrita. Uso: muri ajuda
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acharNoPath, comChromeHeadless, rodarNpm, rodarPython } from '../ferramentas/plataforma.mjs';

const HOME = os.homedir();
const raiz = process.env.MURI_ORCA_RAIZ ?? `${HOME}/videos/muri-video`;
const repo = process.env.MURI_VIDEO_REPO ?? `${HOME}/videos/projetos/muri-video`;
const ORCA = process.env.MURI_ORCA_BIN ?? (process.platform === 'darwin' ? '/Applications/Orca.app/Contents/Resources/bin/orca' : 'orca');
// binário externo; .mjs/.js roda pelo próprio node (os falsos dos testes funcionam igual no Windows)
const executar = (bin, args, opts) => (/\.m?js$/.test(bin) ? spawnSync(process.execPath, [bin, ...args], opts) : spawnSync(bin, args, opts));

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const falha = (msg) => { console.error(msg); process.exit(1); };

const lerEstado = (pasta) => {
  try { return JSON.parse(fs.readFileSync(path.join(pasta, 'producao/estado.json'), 'utf8')); } catch { return {}; }
};
const statusOrca = ({ etapa = '' }) => (etapa === 'entregue' ? 'completed' : etapa.startsWith('aguardando_aprovacao') ? 'in-review' : 'in-progress');
// partes do caminho relativo à raiz: ['acme', 'lancamento', 'v1']
const partes = (pasta) => path.relative(fs.realpathSync(raiz), pasta).split(path.sep);

// O Orca é metadado: se falhar, avisa e segue (a pasta já está pronta)
function orca(...args) {
  const r = executar(ORCA, args, { encoding: 'utf8' });
  if (r.status !== 0) console.error(`Aviso: orca ${args.slice(0, 2).join(' ')} falhou: ${(r.stderr || r.error?.message || '').trim()}`);
}
const sincronizar = (pasta) =>
  orca('worktree', 'set', '--worktree', `path:${pasta}`, '--display-name', partes(pasta).join(' · '), '--workspace-status', statusOrca(lerEstado(pasta)));

function preparar(destino) {
  const rel = partes(destino).slice(0, -1).join('-');
  // todas as versões do vídeo caem no mesmo projeto do ai-memory
  const toml = path.join(destino, '.ai-memory.toml');
  if (!fs.existsSync(toml)) fs.writeFileSync(toml, `project = "${rel}"\nproject_strategy = "repo-root"\n\n[capture]\nignore_paths = ["node_modules/**", ".env", "**/.env", ".git/**", "out/**", "build/**"]\n`);
  if (deps && rodarNpm('pnpm', ['install', '--frozen-lockfile'], { cwd: destino, stdio: 'inherit' }).status !== 0) falha(`pnpm install falhou em ${destino}`);
  sincronizar(destino);
  console.log(`Pronto: ${destino}`);
}

function novo([cliente, video]) {
  if (!cliente || !video) falha('uso: muri novo <cliente> <video> [--sem-deps]');
  const destino = path.join(raiz, cliente, video, 'v1');
  if (fs.existsSync(destino)) falha(`${destino} já existe; para outra versão use: muri versao`);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  git(repo, 'worktree', 'add', '-q', '-b', `video/${cliente}-${video}-v1`, destino, 'main');
  preparar(fs.realpathSync(destino));
}

// sobe da pasta até a vN do vídeo
function pastaVersao(de = '.') {
  let p = fs.realpathSync(de);
  while (!/^v\d+$/.test(path.basename(p))) {
    if (p === path.dirname(p)) falha(`Não achei uma pasta vN acima de ${de}.`);
    p = path.dirname(p);
  }
  return p;
}

function versao([de]) {
  const dirVideo = path.dirname(pastaVersao(de));
  const n = Math.max(...fs.readdirSync(dirVideo).filter((d) => /^v\d+$/.test(d)).map((d) => +d.slice(1)));
  const ultima = path.join(dirVideo, `v${n}`);
  const destino = path.join(dirVideo, `v${n + 1}`);
  const sujas = git(ultima, 'status', '--porcelain').split('\n').filter(Boolean).length;
  if (sujas) console.error(`Aviso: v${n} tem ${sujas} mudança(s) não commitada(s); a v${n + 1} parte do último commit.`);
  git(repo, 'worktree', 'add', '-q', '-b', `video/${partes(dirVideo).join('-')}-v${n + 1}`, destino, git(ultima, 'rev-parse', 'HEAD'));
  preparar(destino);
}

// todas as vN em <cliente>/<video>/vN ou <video>/vN
function todasVersoes(dir = fs.realpathSync(raiz), nivel = 0) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .flatMap((e) => (/^v\d+$/.test(e.name) ? [path.join(dir, e.name)] : nivel < 2 ? todasVersoes(path.join(dir, e.name), nivel + 1) : []));
}

function status() {
  const linhas = todasVersoes().map((pasta) => {
    const p = partes(pasta);
    const { etapa = '?', proximaAcao = '' } = lerEstado(pasta);
    sincronizar(pasta);
    // shortcut: próxima ação cortada em 90 caracteres pra tabela caber; o texto inteiro está no estado.json
    return [p.length > 2 ? p[0] : '', p.at(-2), p.at(-1), etapa, proximaAcao.length > 90 ? `${proximaAcao.slice(0, 89)}…` : proximaAcao];
  });
  const larg = [0, 1, 2, 3].map((i) => Math.max(...[['cliente', 'vídeo', 'vN', 'etapa'], ...linhas].map((l) => l[i].length)));
  for (const l of [['cliente', 'vídeo', 'vN', 'etapa', 'próxima ação'], ...linhas]) console.log(l.map((c, i) => (i < 4 ? c.padEnd(larg[i]) : c)).join('  '));
}

// <pai da raiz>/<pasta>/<cliente>/<video>/vN; nunca sobrescreve
function destinoFora(pasta, onde) {
  const destino = path.join(path.dirname(fs.realpathSync(raiz)), onde, ...partes(pasta));
  if (fs.existsSync(destino)) falha(`${destino} já existe; nada foi copiado.`);
  return destino;
}

function entregar([de]) {
  const pasta = pastaVersao(de);
  const final = path.join(pasta, 'out/final');
  if (!fs.existsSync(final) || !fs.readdirSync(final).length) falha(`${final} está vazio ou não existe; renderize a entrega antes.`);
  const destino = destinoFora(pasta, '_entregas');
  fs.cpSync(final, destino, { recursive: true });
  const arq = path.join(pasta, 'producao/estado.json');
  fs.writeFileSync(arq, `${JSON.stringify({ ...lerEstado(pasta), etapa: 'entregue' }, null, 2)}\n`);
  sincronizar(pasta);
  console.log(`Entregue: ${destino}`);
}

const contar = (p) => (fs.statSync(p).isFile() ? 1 : fs.readdirSync(p, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).length);

function arquivar([de]) {
  const pasta = pastaVersao(de);
  const sujas = git(pasta, 'status', '--porcelain');
  if (sujas) falha(`${pasta} tem mudança não commitada; commite antes de arquivar:\n${sujas}`);
  const destino = destinoFora(pasta, '_arquivo/muri-video');
  const itens = ['out/final', 'producao', 'src/roteiro.json'].filter((i) => fs.existsSync(path.join(pasta, i)));
  for (const i of itens) {
    fs.cpSync(path.join(pasta, i), path.join(destino, i), { recursive: true });
    if (contar(path.join(pasta, i)) !== contar(path.join(destino, i))) falha(`Cópia de ${i} incompleta em ${destino}; o worktree foi mantido.`);
  }
  const [branch, head] = [git(pasta, 'branch', '--show-current'), git(pasta, 'rev-parse', 'HEAD')];
  orca('worktree', 'rm', '--worktree', `path:${pasta}`, '--force');
  if (fs.existsSync(pasta)) falha(`Arquivo copiado em ${destino}, mas o Orca não removeu ${pasta}.`);
  // o Orca apaga o branch sem commit próprio: recria no mesmo commit pra não perder o histórico
  if (spawnSync('git', ['-C', repo, 'rev-parse', '--verify', '-q', branch]).status !== 0) git(repo, 'branch', branch, head);
  console.log(`Arquivado: ${destino} (branch ${branch} em ${head.slice(0, 7)})`);
}

// ordem: estado → pendência de aprovação → próxima tarefa; o handoff é gravado pelo Claude a cada aprovação
function retomar([de]) {
  const pasta = pastaVersao(de);
  const { etapa = '?', aprovacoes = {}, proximaAcao = '' } = lerEstado(pasta);
  const pendentes = Object.entries(aprovacoes).filter(([, a]) => a?.aprovado === false).map(([k]) => k);
  console.log(`${partes(pasta).join(' · ')}  (${pasta})`);
  console.log(`Etapa: ${etapa}`);
  console.log(`Aprovação pendente: ${pendentes.join(', ') || 'nenhuma'}`);
  console.log(`Próxima ação: ${proximaAcao}`);
  const r = executar(process.env.MURI_AI_MEMORY_BIN ?? 'ai-memory', ['handoffs', '--json'], { cwd: pasta, encoding: 'utf8' });
  let handoffs;
  try { handoffs = JSON.parse(r.stdout); } catch { return console.log('Handoffs: ai-memory indisponível.'); }
  console.log(`Handoffs abertos: ${handoffs.length || 'nenhum'}`);
  for (const h of handoffs) {
    const quando = new Date(h.created_at_ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
    console.log(`  ${h.id} · ${h.from_agent} · ${quando}`);
  }
}

// Ambiente de produção: obrigatórios (FALTA, sai 1) e opcionais (AVISO). Não instala nem inicia nada.
function doctor() {
  const linha = (nivel, nome, extra = '') => console.log(`${nivel} ${nome}${extra ? `: ${extra}` : ''}`);
  let falhou = false;
  const major = Number(process.versions.node.split('.')[0]);
  linha(major >= 22 ? 'OK' : 'FALTA', 'node', major >= 22 ? process.versions.node : `${process.versions.node} (precisa ≥ 22)`);
  falhou ||= major < 22;
  for (const [nome, obrigatorio] of [['ffmpeg', 1], ['ffprobe', 1], ['whisper-cli', 1], ['chrome-headless-shell', 1], ['figcraft-cli', 0]]) {
    const p = acharNoPath(nome);
    linha(p ? 'OK' : obrigatorio ? 'FALTA' : 'AVISO', nome, p ?? (obrigatorio ? '' : 'opcional (styleframes editáveis)'));
    falhou ||= !p && Boolean(obrigatorio);
  }
  const mods = ['kokoro_onnx', 'soundfile', 'librosa'];
  const r = rodarPython(['-E', '-c', 'import importlib.util as u,sys;print(" ".join(m for m in sys.argv[1:] if not u.find_spec(m)))', ...mods], { encoding: 'utf8', cwd: path.parse(process.cwd()).root }); // -E (não -I): módulos do pip --user contam; cwd na raiz pra não ler módulo do diretório atual
  if (r.status !== 0) linha('AVISO', 'python', 'Python 3 indisponível (voz local Kokoro e análise de batida precisam dele)');
  else for (const m of mods) linha(r.stdout.split(/\s+/).includes(m) ? 'AVISO' : 'OK', `python ${m}`, r.stdout.split(/\s+/).includes(m) ? `pip install ${m.replace('_', '-')}` : '');
  console.log(`HyperFrames: ${comChromeHeadless('npx hyperframes@0.9.77 doctor')}`);
  process.exitCode = falhou ? 1 : 0;
}

const [cmd, ...resto] = process.argv.slice(2);
const deps = !resto.includes('--sem-deps');
const args = resto.filter((a) => a !== '--sem-deps');
const comandos = { doctor, novo, versao, status, entregar, arquivar, retomar };
if (!comandos[cmd]) falha('uso: muri novo <cliente> <video> | versao [pasta] | status | entregar [pasta] | arquivar [pasta] | retomar [pasta] | doctor  (--sem-deps pula o pnpm install)');
comandos[cmd](args);
