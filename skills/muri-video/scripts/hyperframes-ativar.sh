#!/usr/bin/env bash
# Ativa as skills oficiais do HyperFrames (HeyGen) SÓ dentro do projeto de vídeo — nunca no global
# (~/.claude/skills e ~/.agents/skills ficam intactas, então muri-saver e as outras sessões não veem nada).
# Instala cópias em <projeto>/.claude/skills/<skill> + <projeto>/skills-lock.json.
#
# Uso:
#   bash <pasta-da-skill>/scripts/hyperframes-ativar.sh <pasta-do-projeto> [workflow …]
#   bash <pasta-da-skill>/scripts/hyperframes-ativar.sh <pasta-do-projeto> --remover
# Workflows (escolha pelo tipo de peça): product-launch-video · motion-graphics · general-video · slideshow ·
#   music-to-video · pr-to-video · faceless-explainer · embedded-captions · talking-head-recut ·
#   remotion-to-hyperframes · figma
set -euo pipefail

projeto="${1:?uso: hyperframes-ativar.sh <pasta-do-projeto> [workflow …] | --remover}"
shift
mkdir -p "$projeto"
cd "$projeto"

NUCLEO=(hyperframes hyperframes-core hyperframes-cli hyperframes-animation hyperframes-audio media-use)

if [ "${1:-}" = "--remover" ]; then
  instaladas=$(ls .claude/skills 2>/dev/null | grep -E '^(hyperframes|media-use|product-launch-video|motion-graphics|general-video|slideshow|music-to-video|pr-to-video|faceless-explainer|embedded-captions|talking-head-recut|remotion-to-hyperframes|figma)' || true)
  if [ -z "$instaladas" ]; then echo "Nenhuma skill do HyperFrames neste projeto."; exit 0; fi
  # shellcheck disable=SC2086
  npx -y skills remove $instaladas -y
  echo "Removidas de $projeto/.claude/skills: $(echo $instaladas | tr '\n' ' ')"
  exit 0
fi

antes_claude=$(ls ~/.claude/skills | wc -l)
antes_agents=$(ls ~/.agents/skills | wc -l)

argumentos=()
for s in "${NUCLEO[@]}" "$@"; do argumentos+=(-s "$s"); done
# Sem -g = escopo do projeto; -a claude-code = só a pasta do Claude; --copy = cópia real (sem symlink para cache).
npx -y skills add heygen-com/hyperframes "${argumentos[@]}" -a claude-code -y --copy

# Garantia: o global não pode ter mudado.
if [ "$(ls ~/.claude/skills | wc -l)" != "$antes_claude" ] || [ "$(ls ~/.agents/skills | wc -l)" != "$antes_agents" ]; then
  echo "ATENÇÃO: o número de skills globais mudou — confira ~/.claude/skills e ~/.agents/skills." >&2
  exit 2
fi

echo
echo "Skills do HyperFrames ativas só em $(pwd)/.claude/skills:"
ls .claude/skills | sed 's/^/  - /'
echo
echo "Se a sessão do Claude NÃO estiver rodando dentro desta pasta, elas não carregam sozinhas:"
echo "leia $(pwd)/.claude/skills/hyperframes/SKILL.md (roteador) e o SKILL.md do workflow escolhido."
