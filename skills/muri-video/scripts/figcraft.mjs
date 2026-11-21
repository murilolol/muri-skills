#!/usr/bin/env node
// FigCraft (github.com/storytold/figcraft) para a muri-video: detecta, instala o CLI e registra o MCP no agente que a
// pessoa usa. macOS, Linux e Windows; só stdlib do Node (+ `tar`, que vem nos três sistemas).
//
//   node figcraft.mjs detectar [--json]
//   node figcraft.mjs instalar [--versao 0.18.1] [--forcar]
//   node figcraft.mjs mcp <claude|codex|gemini|antigravity> [--escopo usuario|projeto] [--raiz <pasta>]
//
// O agente NÃO decide sozinho: roda `detectar`, pergunta à pessoa (AskUserQuestion) o que instalar, em qual agente
// e escopo, e qual pasta o FigCraft pode ler/gravar; só então roda `instalar` e `mcp`.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { acharNoPath, rodarNpm, WIN } from '../ferramentas/plataforma.mjs';

const HOME = os.homedir();
const MAC = process.platform === 'darwin';
// Pasta própria (sem sudo): ~/.local/share/figcraft-cli no macOS/Linux, %LOCALAPPDATA%\figcraft no Windows.
const PASTA = WIN ? path.join(process.env.LOCALAPPDATA ?? path.join(HOME, 'AppData', 'Local'), 'figcraft') : path.join(HOME, '.local', 'share', 'figcraft-cli');
const EXE = WIN ? 'figcraft-cli.exe' : 'figcraft-cli';
const falha = (msg) => { console.error(msg); process.exit(1); };
const [cmd, ...resto] = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = resto.indexOf(nome); return i >= 0 ? resto[i + 1] : padrao; };
const lerJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return undefined; } };

function acharCli() {
  const noPath = acharNoPath('figcraft-cli');
  if (noPath) return noPath;
  const achados = fs.existsSync(PASTA) ? fs.readdirSync(PASTA, { recursive: true }).map((p) => path.join(PASTA, String(p))).filter((p) => path.basename(p) === EXE) : [];
  return achados[0];
}
const versaoCli = (cli) => spawnSync(cli, ['--version'], { encoding: 'utf8' }).stdout?.trim();
const acharApp = () =>
  MAC ? ['/Applications/FigCraft.app', path.join(HOME, 'Applications/FigCraft.app')].find((p) => fs.existsSync(p))
    : acharNoPath('figcraft') ?? [path.join(PASTA), path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'FigCraft')].map((d) => path.join(d, WIN ? 'figcraft.exe' : 'figcraft')).find((p) => fs.existsSync(p));

// Onde cada agente guarda o MCP (escopo usuário e projeto).
const ARQ = {
  claude: { usuario: path.join(HOME, '.claude.json'), projeto: path.join(process.cwd(), '.mcp.json') },
  codex: { usuario: path.join(HOME, '.codex', 'config.toml'), projeto: path.join(process.cwd(), '.codex', 'config.toml') },
  gemini: { usuario: path.join(HOME, '.gemini', 'settings.json'), projeto: path.join(process.cwd(), '.gemini', 'settings.json') },
  // Antigravity: ~/.gemini/config/mcp_config.json (versões antigas: ~/.gemini/antigravity/mcp_config.json)
  antigravity: { usuario: fs.existsSync(path.join(HOME, '.gemini', 'antigravity', 'mcp_config.json')) && !fs.existsSync(path.join(HOME, '.gemini', 'config', 'mcp_config.json')) ? path.join(HOME, '.gemini', 'antigravity', 'mcp_config.json') : path.join(HOME, '.gemini', 'config', 'mcp_config.json') },
};
function mcpRegistrado(agente, escopo) {
  const arq = ARQ[agente][escopo];
  if (!arq || !fs.existsSync(arq)) return false;
  if (agente === 'codex') return /^\[mcp_servers\.figcraft\]/m.test(fs.readFileSync(arq, 'utf8'));
  const d = lerJson(arq) ?? {};
  if (agente === 'claude' && escopo === 'usuario') return Boolean(d.mcpServers?.figcraft || d.projects?.[process.cwd()]?.mcpServers?.figcraft);
  return Boolean(d.mcpServers?.figcraft);
}

function detectar() {
  const cli = acharCli();
  const agentes = Object.fromEntries(Object.keys(ARQ).map((a) => [a, {
    instalado: Boolean(acharNoPath({ claude: 'claude', codex: 'codex', gemini: 'gemini', antigravity: 'antigravity' }[a]) || fs.existsSync(path.join(HOME, { claude: '.claude', codex: '.codex', gemini: '.gemini', antigravity: '.gemini/antigravity' }[a]))),
    mcp: Object.fromEntries(Object.keys(ARQ[a]).map((e) => [e, mcpRegistrado(a, e)])),
  }]));
  const r = { sistema: `${process.platform}-${process.arch}`, app: acharApp() ?? null, cli: cli ?? null, versao: cli ? versaoCli(cli) : null, pastaInstalacao: PASTA, agentes };
  if (resto.includes('--json')) return console.log(JSON.stringify(r, null, 2));
  console.log(`Sistema: ${r.sistema}`);
  console.log(`${r.app ? 'OK' : 'FALTA'} app FigCraft${r.app ? `: ${r.app}` : ' (opcional: só para ver/editar à mão)'}`);
  console.log(`${cli ? 'OK' : 'FALTA'} figcraft-cli${cli ? `: ${cli} (${r.versao})` : ` → node ${path.relative(process.cwd(), process.argv[1])} instalar`}`);
  for (const [a, s] of Object.entries(agentes)) {
    const reg = Object.entries(s.mcp).filter(([, v]) => v).map(([e]) => e);
    console.log(`${reg.length ? 'OK' : s.instalado ? 'FALTA' : '—'} MCP no ${a}${reg.length ? ` (${reg.join(', ')})` : s.instalado ? '' : ' (agente não encontrado)'}`);
  }
}

// Asset da release por sistema: macOS = zip só do CLI; Linux = tar.gz do app (bin/figcraft-cli); Windows = zip portátil.
function nomeAsset(v) {
  const arq = { x64: 'x86_64', arm64: 'aarch64' }[process.arch];
  if (MAC) return `figcraft-cli-${v}-macos-universal.zip`;
  if (WIN) return `figcraft-${v}-windows-${process.arch === 'arm64' ? 'arm64' : 'x64'}-portable.zip`;
  if (process.platform === 'linux' && arq) return `figcraft-${v}-linux-${arq}.tar.gz`;
  falha(`Sem binário pronto para ${process.platform}-${process.arch}: compile com cargo build --release -p figcraft-cli (repo storytold/figcraft).`);
}

async function instalar() {
  const atual = acharCli();
  if (atual && !resto.includes('--forcar')) return console.log(`Já instalado: ${atual} (${versaoCli(atual)}). Use --forcar para reinstalar.`);
  const api = 'https://api.github.com/repos/storytold/figcraft/releases/';
  const rel = await (await fetch(api + (opcao('--versao') ? `tags/v${opcao('--versao')}` : 'latest'), { headers: { 'User-Agent': 'muri-video-figcraft' } })).json();
  if (!rel.tag_name) falha(`Release não encontrada: ${rel.message ?? 'resposta inesperada do GitHub'}`);
  const v = rel.tag_name.replace(/^v/, '');
  const nome = nomeAsset(v);
  const url = (n) => rel.assets.find((a) => a.name === n)?.browser_download_url;
  if (!url(nome)) falha(`Asset ${nome} não está na release ${rel.tag_name}.`);
  const baixar = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer());
  console.log(`Baixando ${nome}…`);
  const dados = await baixar(url(nome));
  // Confere o SHA-256 com o SHA256SUMS.txt da própria release (download corrompido ou trocado → para).
  if (url('SHA256SUMS.txt')) {
    const somas = (await baixar(url('SHA256SUMS.txt'))).toString();
    const esperado = somas.split('\n').find((l) => l.trim().endsWith(nome))?.split(/\s+/)[0];
    const obtido = createHash('sha256').update(dados).digest('hex');
    if (!esperado || esperado !== obtido) falha(`SHA-256 não confere para ${nome} (esperado ${esperado ?? '?'}, obtido ${obtido}). Nada instalado.`);
  }
  fs.mkdirSync(PASTA, { recursive: true });
  const tmp = path.join(os.tmpdir(), nome);
  fs.writeFileSync(tmp, dados);
  // bsdtar (macOS, Windows 10+) abre zip; GNU tar (Linux) abre o tar.gz
  const tar = WIN ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar'; // o tar do Git Bash não abre zip
  const r = spawnSync(tar, ['-xf', tmp, '-C', PASTA], { stdio: 'inherit' });
  fs.rmSync(tmp, { force: true });
  if (r.status !== 0) falha('Falha ao extrair o pacote (precisa de `tar`).');
  const cli = fs.readdirSync(PASTA, { recursive: true }).map((p) => path.join(PASTA, String(p))).filter((p) => path.basename(p) === EXE).sort().at(-1);
  if (!cli) falha(`Extraído em ${PASTA}, mas não achei ${EXE}.`);
  if (!WIN) {
    fs.chmodSync(cli, 0o755);
    const bin = path.join(HOME, '.local', 'bin');
    fs.mkdirSync(bin, { recursive: true });
    fs.rmSync(path.join(bin, 'figcraft-cli'), { force: true });
    fs.symlinkSync(cli, path.join(bin, 'figcraft-cli'));
    if (!(process.env.PATH ?? '').split(path.delimiter).includes(bin)) console.log(`Aviso: ${bin} não está no PATH (o MCP usa o caminho completo, então funciona mesmo assim).`);
  } else {
    console.log(`Para usar no terminal, ponha ${path.dirname(cli)} no PATH (o MCP usa o caminho completo).`);
  }
  console.log(`Instalado: ${cli} (${versaoCli(cli)})`);
  if (!acharApp()) console.log(MAC ? 'App (opcional): brew install --cask figcraft' : `App (opcional): ${WIN ? 'figcraft.exe já veio na mesma pasta' : 'bin/figcraft já veio na mesma pasta'} — ou o instalador (.msi/.deb/.rpm/AppImage) da release.`);
}

function mcp() {
  const agente = resto[0];
  if (!ARQ[agente]) falha('uso: figcraft.mjs mcp <claude|codex|gemini|antigravity> [--escopo usuario|projeto] [--raiz <pasta>]');
  const escopo = opcao('--escopo', 'usuario');
  if (!ARQ[agente][escopo]) falha(`${agente} não tem escopo "${escopo}".`);
  if (mcpRegistrado(agente, escopo)) return console.log(`O MCP figcraft já está no ${agente} (${escopo}); nada mudou.`);
  const cli = acharCli() ?? falha('figcraft-cli não encontrado: rode `figcraft.mjs instalar` antes.');
  const raiz = path.resolve(opcao('--raiz', process.cwd()));
  if (!fs.existsSync(raiz)) falha(`A pasta ${raiz} não existe (o FigCraft exige que exista).`);
  // O FigCraft só lê e grava dentro da raiz escolhida pela pessoa.
  const args = ['mcp', '--automation-read-root', raiz, '--automation-write-root', raiz];
  const arq = ARQ[agente][escopo];
  if (agente === 'claude' && acharNoPath('claude')) {
    const r = rodarNpm('claude', ['mcp', 'add', 'figcraft', '--scope', escopo === 'usuario' ? 'user' : 'project', '--', cli, ...args], { stdio: 'inherit' });
    if (r.status !== 0) falha('`claude mcp add` falhou.');
  } else if (agente === 'codex') {
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    // JSON.stringify gera string TOML válida (aspas e barras invertidas do Windows escapadas)
    fs.appendFileSync(arq, `\n[mcp_servers.figcraft]\ncommand = ${JSON.stringify(cli)}\nargs = ${JSON.stringify(args)}\n`);
  } else {
    if (agente === 'claude' && escopo === 'usuario') falha('Sem o comando `claude` no PATH: use --escopo projeto (grava .mcp.json) ou instale o Claude Code.');
    const d = lerJson(arq) ?? {};
    if (fs.existsSync(arq) && !lerJson(arq)) falha(`${arq} não é JSON válido; corrija antes (nada foi alterado).`);
    d.mcpServers = { ...d.mcpServers, figcraft: { command: cli, args } };
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    fs.writeFileSync(arq, `${JSON.stringify(d, null, 2)}\n`);
  }
  console.log(`MCP figcraft registrado no ${agente} (${escopo}) com acesso só a ${raiz}. Reinicie o agente para carregar.`);
}

const comandos = { detectar, instalar, mcp };
if (!comandos[cmd]) falha('uso: figcraft.mjs detectar [--json] | instalar [--versao X] [--forcar] | mcp <claude|codex|gemini|antigravity> [--escopo usuario|projeto] [--raiz <pasta>]');
await comandos[cmd]();
