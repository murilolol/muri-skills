# Som: trilha baixa + efeitos ancorados

Base: `references/sound-design.md` da skill video-shotcraft (leia uma vez) + o que foi medido no vídeo-base.

## Ordem

Visual travado → trilha → efeitos, cena por cena. Mudou o tempo de uma cena? Como tudo é relativo a
`inicioCena` + `marca()`, os efeitos acompanham sozinhos.

## Escolher e medir os sons

```bash
node scripts/sons.mjs bgm/bgm-tech-house transition/air-woosh-quick transition/whoosh-big ui/pop ui/switch-tap \
  riser/riser-cine impact/impact-deep-whoosh light/sparkle --ganho counter/clock-knob-spin=4.5
```

Copia para `public/audio/` e grava o pico (quadro e dBFS) de cada um em `src/picos.json`. Avisos do script:
"baixo" (pico < −12 dBFS → a voz encobre: use `--ganho` ou outro som) e "longo" (> 5 s → dê `dur` no `fx()`).

## Vocabulário (vídeo institucional — nada de som de jogo)

| Ação na tela | Som (biblioteca) | Volume típico |
|---|---|---|
| entrada de bloco, movimento de câmera | `air-woosh-quick`, `whoosh-fast`, `swoosh-quick` | 0,16–0,26 |
| objeto grande sobe/vira protagonista | `whoosh-big` | 0,22–0,28 |
| assentar, encaixe | `transition-snap` | 0,2–0,25 |
| destaque/selo pequeno (série) | `pop` ↔ `switch-tap` alternados, −0,02 por repetição | 0,22 → 0,16 |
| clique de cursor | `click-camera` | 0,6 (baixo de origem) |
| papel, cartas | `paper-slide`, `paper-move-quick` (0,5–0,6); muitas cartas → um só `paper-book-browse-fast` | |
| congelamento com clarão | `camera-shutter-hard` | 0,36 |
| régua/relógio freando | `clock-mech-retract` | 0,3 |
| varredura de dados | `data-scan` por passada, decrescente | 0,18 → 0,1 |
| trava / selo final | `lock-quick` | 0,24–0,34 |
| fecho (encerramento) | `riser-cine` → `impact-deep-whoosh` (pico do filme, 0,5) → `sparkle` (`ancora: "inicio"`) | |

Os sons `ui-*-tone`, `ui-confirm-*` e `ui-notify-*` são sintéticos: proibidos (S1), salvo narrativa de "sistema falando".

## Alinhamento

- `fx(cena, alvo, som, vol, dur?, ancora?)` põe o PICO do arquivo no quadro `alvo` da cena. Para brilhos e
  ambiências longas (pico no meio da cauda), use `ancora: "inicio"`.
- Atraso da faixa de saída medido = **0 quadro** (Remotion 4.0.536, AAC 48 kHz em mp4). A video-shotcraft sugere
  1,28 f de priming do AAC: aqui isso ADIANTOU os sons 1 quadro. Se mudar o Remotion/codec, meça de novo:
  `python3 ferramentas/analisar_audio.py render.wav sonda.wav <quadro-alvo-do-pico> <pico-da-sonda>`
  (wav mono 30 kHz; use 2 sondas nítidas, ex.: `pop` e o impacto final; resíduo ≤ 0,5 f).
- Verifique a âncora de cada ação: no vídeo-base, a trava da mira tocou 24 quadros cedo porque a âncora foi a fala, não o
  quadro da mordida da mira. Âncora = quadro da ação visual.

## Trilha

- `bgm-tech-house` é a única da biblioteca com > 4 min (as outras têm ~2 min).
- Trilha sob medida: o MusicGen local (deps instaladas, torch com MPS) é o "fallback de música" da skill
  `media-use` do HyperFrames — ative-a com `hyperframes-ativar.sh` e peça uma trilha do tamanho do vídeo a partir
  de um briefing de clima. Qualidade abaixo da biblioteca Mixkit: só quando nenhuma faixa servir.
- Volumes do ducking (`VOLUME` em `som.tsx`): 0,07 sob a voz, 0,13 nas pausas, 0,2 na abertura sem voz, 0,24 no
  fim; rampas de 10/14 quadros. Medido: trilha 11–12,5 dB abaixo da voz durante a fala — "trilha baixa" aprovada.
- Prop `trilha` (padrão `true`) controla só a trilha; a versão sem trilha mantém voz e efeitos (mesma linha do tempo).

## Conferência no render (não no preview: o preview limita volume a 1,0)

- Cada efeito audível no mix final (a revisão comparou os 106; 14 estavam encobertos — subir +6 a +10 dB ou cortar).
- Pico ≤ −1 dBTP; loudness final −16 LUFS (feito no `montar.mjs`).
