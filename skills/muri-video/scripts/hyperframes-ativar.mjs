#!/usr/bin/env node
// Ativa as skills oficiais do HyperFrames (HeyGen) SÓ dentro do projeto de vídeo — nunca no global
// (~/.claude/skills e ~/.agents/skills ficam intactas). Instala cópias em <projeto>/.claude/skills/<skill>.
// macOS, Linux e Windows.
//
// Uso:
//   node <pasta-da-skill>/scripts/hyperframes-ativar.mjs <pasta-do-projeto> [extra …]
//   node <pasta-da-skill>/scripts/hyperframes-ativar.mjs <pasta-do-projeto> --remover
// Extras (conjunto da v0.9.77): slideshow · figma · remotion-to-hyperframes · reverse-any-video · style-sampling
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { rodarNpm } from '../ferramentas/plataforma.mjs';

const NUCLEO = ['hyperframes', 'hyperframes-cli', 'hyperframes-registry', 'media-use'];
const EXTRAS = ['slideshow', 'figma', 'remotion-to-hyperframes', 'reverse-any-video', 'style-sampling'];

const [projeto, ...resto] = process.argv.slice(2);
if (!projeto) {
  console.error('uso: hyperframes-ativar.mjs <pasta-do-projeto> [extra …] | --remover');
  process.exit(1);
}
fs.mkdirSync(projeto, { recursive: true });
const skills = path.join(projeto, '.claude', 'skills');
const npxSkills = (args) => {
  const r = rodarNpm('npx', ['-y', 'skills', ...args], { cwd: projeto, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (resto[0] === '--remover') {
  const instaladas = fs.existsSync(skills) ? fs.readdirSync(skills).filter((s) => NUCLEO.includes(s) || EXTRAS.includes(s)) : [];
  if (!instaladas.length) {
    console.log('Nenhuma skill do HyperFrames neste projeto.');
    process.exit(0);
  }
  npxSkills(['remove', ...instaladas, '-y']);
  console.log(`Removidas de ${skills}: ${instaladas.join(' ')}`);
  process.exit(0);
}

const contarGlobais = () =>
  ['.claude/skills', '.agents/skills'].map((d) => { try { return fs.readdirSync(path.join(os.homedir(), d)).length; } catch { return 0; } }).join('/');
const antes = contarGlobais();
// Sem -g = escopo do projeto; -a claude-code = só a pasta do Claude; --copy = cópia real (sem symlink para cache).
npxSkills(['add', 'heygen-com/hyperframes', ...[...NUCLEO, ...resto].flatMap((s) => ['-s', s]), '-a', 'claude-code', '-y', '--copy']);
if (contarGlobais() !== antes) {
  console.error('ATENÇÃO: o número de skills globais mudou — confira ~/.claude/skills e ~/.agents/skills.');
  process.exit(2);
}

console.log(`\nSkills do HyperFrames ativas só em ${path.resolve(skills)}:`);
for (const s of fs.readdirSync(skills)) console.log(`  - ${s}`);
console.log('\nSe a sessão do agente NÃO estiver rodando dentro desta pasta, elas não carregam sozinhas:');
console.log(`leia ${path.resolve(skills, 'hyperframes', 'SKILL.md')} (roteador) e o SKILL.md da extra escolhida.`);
