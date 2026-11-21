// Testes do CLI `muri` pelo processo: repo git temporário + Orca e ai-memory falsos que gravam as chamadas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MURI = new URL('./muri.mjs', import.meta.url).pathname;
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();

function ambiente() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'muri-')));
  const repo = path.join(base, 'projetos/muri-video');
  fs.mkdirSync(path.join(repo, 'producao'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'src'));
  fs.writeFileSync(path.join(repo, 'producao/estado.json'), JSON.stringify({ etapa: 'aguardando_briefing', aprovacoes: { briefing: { aprovado: false } }, proximaAcao: 'Claude conduz o briefing.' }));
  fs.writeFileSync(path.join(repo, 'src/roteiro.json'), '{}');
  git(repo, 'init', '-q', '-b', 'main');
  fs.appendFileSync(path.join(repo, '.git/info/exclude'), '.ai-memory.toml\nout/\n'); // como no repo real
  git(repo, 'add', '.');
  git(repo, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'template');
  const bin = path.join(base, 'bin');
  const log = path.join(base, 'chamadas.log');
  fs.mkdirSync(bin);
  // Orca falso: grava a chamada; no `worktree rm` imita o real (remove o worktree e apaga o branch)
  fs.writeFileSync(path.join(bin, 'orca'), `#!/bin/sh
echo "orca $*" >> "${log}"
if [ "$1 $2" = "worktree rm" ]; then
  p="$(echo "$*" | sed -E 's/.*--worktree path:([^ ]+).*/\\1/')"
  b="$(git -C "$p" branch --show-current)"
  git -C "${repo}" worktree remove --force "$p" && git -C "${repo}" branch -D "$b" >/dev/null
fi
`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'ai-memory'), `#!/bin/sh
echo "ai-memory $* (em $PWD)" >> "${log}"
echo '[{"id":"h1","from_agent":"claude-code","cwd":"'$PWD'","created_at_ms":1793145002143}]'
`, { mode: 0o755 });
  const env = { ...process.env, MURI_ORCA_RAIZ: path.join(base, 'muri-video'), MURI_VIDEO_REPO: repo, MURI_ORCA_BIN: path.join(bin, 'orca'), MURI_AI_MEMORY_BIN: path.join(bin, 'ai-memory') };
  const muri = (args, cwd = base) => spawnSync('node', [MURI, ...args], { cwd, env, encoding: 'utf8' });
  const chamadas = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '');
  return { base, repo, raiz: env.MURI_ORCA_RAIZ, muri, chamadas };
}

test('novo cria a v1 como worktree da main, com projeto do ai-memory e nome no Orca', () => {
  const { raiz, muri, chamadas } = ambiente();
  const r = muri(['novo', 'acme', 'teste', '--sem-deps']);
  assert.equal(r.status, 0, r.stderr);
  const v1 = path.join(raiz, 'acme/teste/v1');
  assert.equal(git(v1, 'branch', '--show-current'), 'video/acme-teste-v1');
  assert.match(fs.readFileSync(path.join(v1, '.ai-memory.toml'), 'utf8'), /^project = "acme-teste"$/m);
  assert.match(chamadas(), new RegExp(`orca worktree set --worktree path:${v1} --display-name acme · teste · v1 --workspace-status in-progress`));
});

test('versao cria a próxima vN a partir do último commit da anterior, sem tocar nela', () => {
  const { raiz, muri, chamadas } = ambiente();
  muri(['novo', 'acme', 'teste', '--sem-deps']);
  const v1 = path.join(raiz, 'acme/teste/v1');
  fs.writeFileSync(path.join(v1, 'src/cena.tsx'), 'commitada');
  git(v1, 'add', 'src/cena.tsx');
  git(v1, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'cena');
  fs.writeFileSync(path.join(v1, 'src/cena.tsx'), 'rascunho');
  const r = muri(['versao', '--sem-deps'], path.join(v1, 'src'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /v1 tem 1 mudança/);
  const v2 = path.join(raiz, 'acme/teste/v2');
  assert.equal(git(v2, 'rev-parse', 'HEAD'), git(v1, 'rev-parse', 'HEAD'));
  assert.equal(git(v2, 'branch', '--show-current'), 'video/acme-teste-v2');
  assert.equal(fs.readFileSync(path.join(v2, 'src/cena.tsx'), 'utf8'), 'commitada');
  assert.equal(fs.readFileSync(path.join(v1, 'src/cena.tsx'), 'utf8'), 'rascunho');
  assert.match(fs.readFileSync(path.join(v2, '.ai-memory.toml'), 'utf8'), /^project = "acme-teste"$/m);
  assert.match(chamadas(), /--display-name acme · teste · v2 /);
  assert.equal(muri(['novo', 'acme', 'teste', '--sem-deps']).status, 1);
});

test('status lista cada vN com etapa e próxima ação e sincroniza o status no Orca', () => {
  const { raiz, muri, chamadas } = ambiente();
  muri(['novo', 'acme', 'teste', '--sem-deps']);
  const v1 = path.join(raiz, 'acme/teste/v1');
  fs.writeFileSync(path.join(v1, 'producao/estado.json'), JSON.stringify({ etapa: 'aguardando_aprovacao_roteiro', proximaAcao: 'Usuário aprova o roteiro.' }));
  const solo = path.join(raiz, 'solo/v3'); // vídeo sem cliente (só <video>/vN)
  fs.mkdirSync(path.join(solo, 'producao'), { recursive: true });
  fs.writeFileSync(path.join(solo, 'producao/estado.json'), JSON.stringify({ etapa: 'entregue', proximaAcao: 'Nada.' }));
  const r = muri(['status']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /acme\s+teste\s+v1\s+aguardando_aprovacao_roteiro\s+Usuário aprova o roteiro\./);
  assert.match(r.stdout, /\n\s+solo\s+v3\s+entregue\s+Nada\./);
  assert.match(chamadas(), new RegExp(`path:${v1} --display-name acme · teste · v1 --workspace-status in-review`));
  assert.match(chamadas(), new RegExp(`path:${solo} --display-name solo · v3 --workspace-status completed`));
});

function comFinal(raiz, muri) {
  muri(['novo', 'acme', 'teste', '--sem-deps']);
  const v1 = path.join(raiz, 'acme/teste/v1');
  fs.mkdirSync(path.join(v1, 'out/final/divulgacao'), { recursive: true });
  fs.writeFileSync(path.join(v1, 'out/final/filme.mp4'), 'mp4');
  fs.writeFileSync(path.join(v1, 'out/final/divulgacao/story.png'), 'png');
  return v1;
}

test('entregar copia out/final para _entregas, marca entregue e conclui no Orca, sem sobrescrever', () => {
  const { base, raiz, muri, chamadas } = ambiente();
  const v1 = comFinal(raiz, muri);
  const r = muri(['entregar'], v1);
  assert.equal(r.status, 0, r.stderr);
  const destino = path.join(base, '_entregas/acme/teste/v1');
  assert.equal(fs.readFileSync(path.join(destino, 'filme.mp4'), 'utf8'), 'mp4');
  assert.equal(fs.readFileSync(path.join(destino, 'divulgacao/story.png'), 'utf8'), 'png');
  const estado = JSON.parse(fs.readFileSync(path.join(v1, 'producao/estado.json'), 'utf8'));
  assert.equal(estado.etapa, 'entregue');
  assert.deepEqual(estado.aprovacoes, { briefing: { aprovado: false } });
  assert.match(chamadas(), /--display-name acme · teste · v1 --workspace-status completed/);
  assert.equal(muri(['entregar'], v1).status, 1);
});

test('entregar recusa vídeo sem out/final', () => {
  const { raiz, muri } = ambiente();
  muri(['novo', 'acme', 'teste', '--sem-deps']);
  const r = muri(['entregar'], path.join(raiz, 'acme/teste/v1'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /out\/final/);
});

test('arquivar copia final, producao e roteiro para _arquivo, remove o worktree e mantém o branch', () => {
  const { base, repo, raiz, muri, chamadas } = ambiente();
  const v1 = comFinal(raiz, muri);
  muri(['entregar'], v1);
  git(v1, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'entrega');
  const head = git(v1, 'rev-parse', 'HEAD');
  const r = muri(['arquivar'], v1);
  assert.equal(r.status, 0, r.stderr);
  const arq = path.join(base, '_arquivo/muri-video/acme/teste/v1');
  for (const f of ['out/final/filme.mp4', 'out/final/divulgacao/story.png', 'producao/estado.json', 'src/roteiro.json']) assert.ok(fs.existsSync(path.join(arq, f)), f);
  assert.match(chamadas(), new RegExp(`orca worktree rm --worktree path:${v1} --force`));
  assert.ok(!fs.existsSync(v1));
  assert.equal(git(repo, 'rev-parse', 'video/acme-teste-v1'), head);
});

test('arquivar recusa worktree com mudança não commitada e não toca em nada', () => {
  const { base, raiz, muri, chamadas } = ambiente();
  const v1 = comFinal(raiz, muri);
  fs.writeFileSync(path.join(v1, 'src/roteiro.json'), '{"novo":1}');
  const r = muri(['arquivar'], v1);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /não commitada/);
  assert.ok(!fs.existsSync(path.join(base, '_arquivo')));
  assert.doesNotMatch(chamadas(), /worktree rm/);
});

test('retomar mostra etapa, aprovações pendentes, próxima ação e handoffs abertos do vídeo', () => {
  const { raiz, muri, chamadas } = ambiente();
  muri(['novo', 'acme', 'teste', '--sem-deps']);
  const v1 = path.join(raiz, 'acme/teste/v1');
  const r = muri(['retomar'], path.join(v1, 'src'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /acme · teste · v1/);
  assert.match(r.stdout, /Etapa: aguardando_briefing/);
  assert.match(r.stdout, /Aprovação pendente: briefing/);
  assert.match(r.stdout, /Próxima ação: Claude conduz o briefing\./);
  assert.match(r.stdout, /h1 · claude-code · 27\/10\/2026 20:50/);
  assert.match(chamadas(), new RegExp(`ai-memory handoffs --json \\(em ${v1}\\)`));
});

test('doctor lista ferramentas: FALTA e saída 1 sem o chrome-headless-shell, AVISO pro opcional, e 0 quando os obrigatórios existem', () => {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'muri-doctor-'));
  const falso = (n) => fs.writeFileSync(path.join(bin, n), '#!/bin/sh\n', { mode: 0o755 });
  ['ffmpeg', 'ffprobe', 'whisper-cli'].forEach(falso);
  const doctor = () => spawnSync(process.execPath, [MURI, 'doctor'], { env: { ...process.env, PATH: bin }, encoding: 'utf8' }); // PATH só com os falsos: sem python3 e sem figcraft-cli
  let r = doctor();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^OK ffmpeg: /m);
  assert.match(r.stdout, /^FALTA chrome-headless-shell/m);
  assert.match(r.stdout, /^AVISO figcraft-cli/m);
  assert.match(r.stdout, /^AVISO python3: /m);
  assert.match(r.stdout, /npx hyperframes@0\.9\.77 doctor/);
  falso('chrome-headless-shell');
  r = doctor();
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /^OK chrome-headless-shell: /m);
});
