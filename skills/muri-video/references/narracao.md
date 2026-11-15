# Roteiro e narração (TTS)

## Escrever para a voz

- ~145–160 palavras por minuto de vídeo (vídeo-base: 574 palavras → 190 s de voz em 3 min 40 s de filme).
- Uma ideia por frase; frases de 8–20 palavras. Pontuação = pausa (o peso da pontuação também move a legenda).
- Números **por extenso** e sem concordância de gênero arriscada: "Mais de seis mil presenças", não "seis mil,
  quatrocentas e quarenta e nove" (o TTS errou "quatrocentos/quatrocentas"). Número exato vai na tela.
- Evite siglas difíceis na voz (nome de evento ou instituição em sigla): elas aparecem nas logos. "R.A." é lido certo, mas quebra a
  legenda — o template já troca por "RA" antes de dividir.
- Para cada número falado, um par em `PARA_TELA` (`src/narracao.tsx`): a legenda mostra "1.700 alunos".
- Use os trechos falados como âncoras: escreva sabendo que `marca(cena, "Na terça")` vai sincronizar o visual.

## Gemini TTS (padrão) — `scripts/narrar.mjs`

- Modelo `gemini-3.8-flash-tts`, voz **Achird** (natural em pt-BR). Chave em `GEMINI_API_KEY` (nunca no repo).
- **Texto puro**: o modelo LÊ EM VOZ ALTA qualquer instrução de estilo, e não aceita `systemInstruction`.
  Deixe `"estilo": ""` no roteiro.
- **Uma chamada para o roteiro inteiro**, cortada por cena nos silêncios: a cota diária gratuita é curta (429).
  O script desiste se a espera pedida passar de 180 s; o 2.5-pro tem cota zero no plano gratuito.
- Comandos:
  - `node scripts/narrar.mjs` — tudo; grava `out/narracao-inteira.wav`, `public/narracao/<cena>.wav`, `src/narracao.json`.
  - `--conferir [--so cena]` — transcreve com o gemini-3.8-flash e compara texto e sotaque.
  - `--so <cena>` — regrava uma cena (gasta cota).
  - `--recortar --mover cena=+4.2` — recorta de novo SEM chamar o TTS, quando um corte caiu errado (num vídeo real, uma
    frase foi parar na cena seguinte).
- Antes de gravar, o template estima 2,6 palavras/s e deixa a cena muda — monte e revise o visual sem gastar cota.

## Kokoro local (sem cota) — `scripts/narrar-local.mjs`

`node scripts/narrar-local.mjs [--voz pf_dora|pm_alex|pm_santa] [--velocidade 1.0] [cena …]` — uma chamada de
`hyperframes tts` por cena, corta o silêncio das pontas, grava o mesmo `public/narracao/<cena>.wav` +
`src/narracao.json` do Gemini. Testado: 3 cenas em 7,8 s. Pronúncia pt-BR boa, entonação menos natural que o
Achird — use para animatic/rascunho (valida o tempo das cenas antes de gastar cota) ou quando a cota acabou.

## Alinhamento palavra a palavra — `scripts/alinhar.mjs`

Depois de qualquer narração (Gemini ou Kokoro): `node scripts/alinhar.mjs [cena …]` transcreve cada cena com o
whisper `small` multilíngue em português (via `hyperframes transcribe`, ~1 s por cena) e grava `src/palavras.json`.
`marca()` passa a usar o instante real do trecho (a ocorrência mais perto da estimativa; se o trecho não casar — ex.:
número que o whisper escreveu em algarismos — volta à estimativa) e cada bloco de legenda começa na sua palavra.
Atenção: os modelos padrão do CLI são `.en` (só inglês) — para português use `--model small` (ou `large-v3`).

## Conferência

Ouça (ou transcreva) cada cena antes de produzir as cenas: um corte errado desloca todas as `marca()` seguintes.
