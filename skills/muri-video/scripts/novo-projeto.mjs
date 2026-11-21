#!/usr/bin/env node
// Cria um projeto de vídeo fora do Orca, exportando a main do template Muri Video (a mesma base dos workspaces do Orca).
// macOS, Linux e Windows. Uso: node <pasta-da-skill>/scripts/novo-projeto.mjs <pasta-destino> <NomeDoProjeto> [--sem-npm]
// Depois: src/plano.json (marca, cenas, divulgação), src/roteiro.json (texto) e src/tema.ts (tokens do produto).
// Outro repositório de template: MURI_VIDEO_REPO=<pasta>.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rodarNpm } from '../ferramentas/plataforma.mjs';

const falha = (msg) => { console.error(msg); process.exit(1); };
const [destino, nome, flag] = process.argv.slice(2);
if (!destino || !nome) falha('uso: novo-projeto.mjs <pasta-destino> <NomeDoProjeto> [--sem-npm]  (o nome vira o id das composições: <Nome>-16x9 e <Nome>-9x16)');
const skill = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repo = process.env.MURI_VIDEO_REPO ?? path.join(os.homedir(), 'videos/projetos/muri-video');
try { execFileSync('git', ['-C', repo, 'rev-parse', '--verify', '-q', 'main'], { stdio: 'ignore' }); } catch { falha(`Template não encontrado: ${repo} (branch main).`); }
if (fs.existsSync(destino) && fs.readdirSync(destino).length) falha(`A pasta ${destino} já existe e não está vazia — escolha outra.`);

// clone + apagar .git = export da main sem depender de tar/pipe do shell
execFileSync('git', ['clone', '-q', '--branch', 'main', '--single-branch', repo, destino], { stdio: 'inherit' });
fs.rmSync(path.join(destino, '.git'), { recursive: true, force: true });

const editarJson = (rel, fn) => {
  const arq = path.join(destino, rel);
  const dados = JSON.parse(fs.readFileSync(arq, 'utf8'));
  fn(dados);
  fs.writeFileSync(arq, `${JSON.stringify(dados, null, 2)}\n`);
};
editarJson('src/plano.json', (d) => { d.projeto = nome; });
editarJson('package.json', (d) => { d.name = `${nome.toLowerCase().replaceAll(' ', '-')}-video`; });

if (flag !== '--sem-npm') {
  const r = rodarNpm('npm', ['install', '--no-fund', '--no-audit'], { cwd: destino, stdio: 'inherit' });
  if (r.status !== 0) falha('npm install falhou (o projeto foi criado; rode de novo dentro da pasta).');
}

console.log(`Projeto criado em ${destino} (composições ${nome}-16x9 e ${nome}-9x16).
Próximos passos:
  1. src/plano.json · src/roteiro.json · src/tema.ts (tokens do produto; logo e fontes em public/)
  2. node scripts/sons.mjs <categoria/som …>        (trilha e efeitos da biblioteca da video-shotcraft)
  3. node scripts/quadros.mjs ${nome}-16x9 30 150 · ${nome}-9x16   (QA nos dois formatos; padrão em references/motion.md)
  4. node scripts/narrar-local.mjs                  (animatic com voz Kokoro, sem cota) ou
     GEMINI_API_KEY=… node scripts/narrar.mjs        (voz final, depois do roteiro aprovado)
  5. node scripts/alinhar.mjs                        (tempo real de cada palavra → marca() e legenda exatas)
  6. ESCALA=2 node scripts/entregar.mjs              (4 MP4 4K + VTT, formatos em paralelo)
  7. node ${path.join(skill, 'ferramentas', 'qa.mjs')} .   (QA da entrega antes de mandar)
  HyperFrames: node ${path.join(skill, 'scripts', 'hyperframes-ativar.mjs')} ${destino} [extra]   (skills só neste projeto)`);
