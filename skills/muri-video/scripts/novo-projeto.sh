#!/usr/bin/env bash
# Cria um projeto de vídeo fora do Orca, exportando a main do template Muri Video (a mesma base dos workspaces do Orca).
# Uso: bash <pasta-da-skill>/scripts/novo-projeto.sh <pasta-destino> <NomeDoProjeto> [--sem-npm]
# Depois: src/plano.json (marca, cenas, divulgação), src/roteiro.json (texto) e src/tema.ts (tokens do produto).
# Outro repositório de template: MURI_VIDEO_REPO=<pasta> bash novo-projeto.sh …
set -euo pipefail

destino="${1:?uso: novo-projeto.sh <pasta-destino> <NomeDoProjeto> [--sem-npm]}"
nome="${2:?informe o nome do projeto (vira o id das composições: <Nome>-16x9 e <Nome>-9x16)}"
skill="$(cd "$(dirname "$0")/.." && pwd)"
repo="${MURI_VIDEO_REPO:-$HOME/videos/projetos/muri-video}"
git -C "$repo" rev-parse --verify -q main >/dev/null || { echo "Template não encontrado: $repo (branch main)." >&2; exit 1; }

if [ -e "$destino" ] && [ -n "$(ls -A "$destino" 2>/dev/null)" ]; then
  echo "A pasta $destino já existe e não está vazia — escolha outra." >&2
  exit 1
fi

mkdir -p "$destino"
git -C "$repo" archive main | tar -x -C "$destino"
python3 - "$destino" "$nome" <<'PY'
import json, sys, pathlib
destino, nome = pathlib.Path(sys.argv[1]), sys.argv[2]
plano = destino / "src/plano.json"
dados = json.loads(plano.read_text())
dados["projeto"] = nome
plano.write_text(json.dumps(dados, indent=2, ensure_ascii=False) + "\n")
pkg = destino / "package.json"
p = json.loads(pkg.read_text())
p["name"] = nome.lower().replace(" ", "-") + "-video"
pkg.write_text(json.dumps(p, indent=2, ensure_ascii=False) + "\n")
PY

if [ "${3:-}" != "--sem-npm" ]; then
  (cd "$destino" && npm install --no-fund --no-audit)
fi

cat <<EOF
Projeto criado em $destino (composições $nome-16x9 e $nome-9x16).
Próximos passos:
  1. src/plano.json · src/roteiro.json · src/tema.ts (tokens do produto; logo e fontes em public/)
  2. node scripts/sons.mjs <categoria/som …>        (trilha e efeitos da biblioteca da video-shotcraft)
  3. node scripts/quadros.mjs $nome-16x9 30 150 · $nome-9x16   (QA nos dois formatos; padrão em references/motion.md)
  4. node scripts/narrar-local.mjs                  (animatic com voz Kokoro, sem cota) ou
     GEMINI_API_KEY=… node scripts/narrar.mjs        (voz final, depois do roteiro aprovado)
  5. node scripts/alinhar.mjs                        (tempo real de cada palavra → marca() e legenda exatas)
  6. ESCALA=2 node scripts/entregar.mjs              (4 MP4 4K + VTT, formatos em paralelo)
  HyperFrames: bash $skill/scripts/hyperframes-ativar.sh $destino <workflow>   (skills só neste projeto)
EOF
