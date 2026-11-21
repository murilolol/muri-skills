// Diferenças entre macOS, Linux e Windows num lugar só (só stdlib do Node).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const WIN = process.platform === 'win32';

// Executável no PATH (no Windows, com as extensões do PATHEXT: .exe, .cmd…). undefined se não achar.
export function acharNoPath(nome) {
  const exts = WIN ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';').filter(Boolean) : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const p = path.join(dir, nome + ext);
      try {
        if (!fs.statSync(p).isFile()) continue;
        if (!WIN) fs.accessSync(p, fs.constants.X_OK);
        return p;
      } catch {}
    }
  }
}

// npx/npm/pnpm são .cmd no Windows e só rodam via shell (argumentos sem espaço, então sem aspas).
export const rodarNpm = (cmd, args, opts = {}) => spawnSync(cmd, args, { shell: WIN, ...opts });

// Python 3: python3 (macOS/Linux), python ou `py -3` (Windows). null se nenhum responder.
let py;
export function python() {
  if (py !== undefined) return py;
  for (const c of [['python3'], ['python'], ['py', '-3']]) {
    const r = spawnSync(c[0], [...c.slice(1), '--version'], { encoding: 'utf8' });
    if (r.status === 0 && /Python 3/.test(`${r.stdout}${r.stderr}`)) return (py = c);
  }
  return (py = null);
}
export function rodarPython(args, opts = {}) {
  const c = python();
  if (!c) return { status: null, stdout: '', stderr: 'Python 3 não encontrado (python3, python ou py -3)' };
  return spawnSync(c[0], [...c.slice(1), ...args], opts);
}

// Comando pra apontar o HyperFrames pro chrome-headless-shell, na sintaxe do shell da plataforma.
export const comChromeHeadless = (comando) =>
  WIN
    ? `$env:PUPPETEER_EXECUTABLE_PATH = (Get-Command chrome-headless-shell).Source; ${comando}`
    : `PUPPETEER_EXECUTABLE_PATH="$(command -v chrome-headless-shell)" ${comando}`;
