# HyperFrames (HeyGen) — motor HTML/GSAP

Repositório: https://github.com/heygen-com/hyperframes · Apache-2.0 · testado na v0.8.169 (17/10/2026) num Mac
(M5, Node 24, ffmpeg do Homebrew). Docs: hyperframes.heygen.com. CLI sempre via `npx hyperframes@<versão>`.

## Quando usar (em vez do Remotion)

- Peça curta e visual (promo 15–45 s, vinheta, abertura/encerramento, slideshow, card animado para post).
- Partir de um site real: `hyperframes capture <url>` e blocos prontos do catálogo (`hyperframes catalog`, `add`).
- Vídeo de pessoa falando: legenda embutida, recorte e sobreposições (skills `embedded-captions`, `talking-head-recut`).
- Sem cota de TTS: `hyperframes tts` (Kokoro local) e transcrição `hyperframes transcribe` (whisper).
- Converter cena Remotion para HTML: skill `remotion-to-hyperframes`.

Fique no Remotion para o vídeo longo dirigido pela narração, com cenas nativas 16:9 e 9:16, as `marca()` e o pipeline de som
desta skill (é o que está provado).

## Requisitos

Node ≥ 22, FFmpeg no PATH, Chrome headless (o CLI baixa e guarda em ~/.cache/puppeteer). Extras: whisper-cpp
(transcrição), kokoro-onnx + soundfile (TTS local), transformers + torch (MusicGen). `npx hyperframes@0.8.169 doctor`
deve mostrar tudo ✓. Opcional mais preciso para transcrição: `npx hyperframes models install parakeet`.

## Comandos que importam

```bash
export HYPERFRAMES_SKIP_SKILLS=1                 # o init tenta instalar/checar skills de IA — evite (ver abaixo)
npx hyperframes@0.8.169 init meu-video --example blank --non-interactive --resolution landscape   # ou portrait
npx hyperframes@0.8.169 preview                  # studio com recarga ao vivo
npx hyperframes@0.8.169 lint .                   # erros/avisos de estrutura
npx hyperframes@0.8.169 check .                  # lint + validação em runtime + inspeção de layout
npx hyperframes@0.8.169 snapshot . --at 1,2.5,4  # PNGs de verificação (equivale ao quadros.mjs)
npx hyperframes@0.8.169 render . -q draft -o renders/rascunho.mp4      # rápido; final: -q delivery
npx hyperframes@0.8.169 render . --format mov    # com transparência (ProRes 4444) para sobrepor
npx hyperframes@0.8.169 audio renders/final.mp4  # onde os sons caem, loudness, silêncios
npx hyperframes@0.8.169 tts texto.txt --voice pf_dora --lang pt-br -o voz.wav --json   # --json evita o spinner no log
npx hyperframes@0.8.169 transcribe voz.wav --engine whisper --model small --language pt --json   # palavras com tempo
```

Desempenho medido: 4 s (120 quadros, 1080p, rascunho) em 24 s, com reaproveitamento de quadros estáticos.

## Composição (o essencial)

- Um `index.html` com raiz `data-composition-id`, `data-start`, `data-duration`, `data-width`, `data-height`.
- Cada elemento de tempo tem `class="clip"` + `data-start`, `data-duration`, `data-track-index`. Áudio:
  `<audio data-start data-duration data-track-index data-volume src>`.
- Animação: timeline GSAP **pausada** registrada em `window.__timelines["<composition-id>"]` (o renderizador busca
  cada quadro por seek — nada de `setTimeout`, `requestAnimationFrame` livre ou animação CSS infinita).
- **Armadilha testada**: cada `.clip` vira uma camada posicionada sozinha — dois clips num `flex` da raiz se
  sobrepõem (a régua caiu em cima do título). Agrupe num único clip ou, do jeito idiomático que o `lint` pede,
  mova o grupo para uma subcomposição (`data-composition-src`).
- Tema: `template/hyperframes/index.html` desta skill já tem os tokens neutros de exemplo (tinta #1c1a17, destaque
  #a8452e, apoio #6b655c, fundo #faf8f5) e Manrope; troque pelos tokens do produto.
- Som: a skill oficial `hyperframes-audio` faz "carve" (ducking) da trilha sob a voz e envelopes; `normalize-audio`
  iguala loudness entre clipes.

## Skills oficiais do HyperFrames — sob demanda, só no projeto

Nunca `npx hyperframes skills` nem `npx skills add … -g` (instalariam ~21 skills no global de todas as ferramentas e
pesariam em toda sessão, inclusive no muri-saver). Use:

```bash
bash <pasta-da-skill>/scripts/hyperframes-ativar.sh <pasta-do-projeto> <workflow …>   # ativa
bash <pasta-da-skill>/scripts/hyperframes-ativar.sh <pasta-do-projeto> --remover       # desativa
```

Instala o núcleo (`hyperframes`, `hyperframes-core`, `hyperframes-cli`, `hyperframes-animation`,
`hyperframes-audio`, `media-use`) + os workflows pedidos, como cópias em `<projeto>/.claude/skills/`, e confere que
`~/.claude/skills` e `~/.agents/skills` não mudaram (testado: 7 instaladas e removidas, global intacto).
A sessão só carrega essas skills sozinha se estiver rodando DENTRO da pasta do projeto; senão, leia os `SKILL.md`
diretamente (roteador primeiro). Workflows: `product-launch-video`, `motion-graphics` (< 10–30 s, sem narração),
`general-video` (narrado/multicena), `slideshow`, `music-to-video`, `pr-to-video`, `faceless-explainer`,
`embedded-captions`, `talking-head-recut`, `remotion-to-hyperframes`, `figma`.

## Story 9:16 na batida (caso real: story 9:16 de evento)

Resultado: 30,5 s, 11 cartões, render "delivery" em 45 s, 6,6 MB. Estrutura: um gerador (Python) que escreve
`compositions/cNN.html` + `fundo.html` + `index.html` a partir de uma lista de cartões (textos, tempos e cores).

1. `npx hyperframes@0.8.169 init <proj> --example blank --non-interactive --resolution portrait` (com
   `HYPERFRAMES_SKIP_SKILLS=1`) e `hyperframes-ativar.sh <proj> music-to-video motion-graphics`.
2. **Nunca rode `npx hyperframes skills update`**, mesmo que o workflow oficial mande: ele atualiza o conjunto GLOBAL.
   As cópias do projeto acabaram de ser instaladas e já estão atualizadas.
3. Música: escolha na biblioteca (um hip-hop de ~86 BPM, por exemplo), rode
   `python3 <proj>/.claude/skills/music-to-video/scripts/analyze-beatgrid.py` na faixa inteira (precisa de
   `pip3 install librosa`), corte com ffmpeg um trecho que comece num downbeat de frase (`phrases`) e passe por um
   SURGE/DROP, com fade de 0,08 s na entrada e 1,6 s no fim, e analise o trecho de novo → `audiomap.json` (downbeats).
   **Confira o andamento antes de cortar.** Num story real, o analisador deu 86,1 BPM e a música era 129,9 (a bateria
   sincopada 3:2 enganou), e os cortes caíram ~0,45 s fora dos acentos; foi a revisão independente que pegou.
   Teste: `librosa.beat.beat_track` + os acentos mais fortes (`onset_strength` com `peak_pick`), e ajuste a grade
   (período e fase) que minimiza a distância aos acentos. As voltas fortes de frase e as pausas da música são os
   melhores pontos de corte. Depois do render, meça a distância de cada corte ao ataque mais forte em ±120 ms; o
   alvo é ≤ 1 quadro (no caso real ficou ≤ 18 ms).
4. Um cartão por compasso; elementos nas batidas locais (0 · 0,70 · 1,37 · 2,07 s a 86 BPM); cortes secos.
5. Os frame-workers (um subagente por cartão) do workflow oficial são opcionais: só os use com autorização. Com
   ≤ 12 cartões, um gerador em Python dá mais consistência.

### Armadilhas confirmadas

- **`#root` puro.** O runtime renomeia o id da raiz ao montar a subcomposição; `[data-composition-id=x]#root` não
  casa e a fonte e o fundo somem (o texto saiu em serifa genérica). Classes de descendentes podem ser escopadas.
- **`@font-face` dentro de CADA subcomposição** (o `<head>` do host não chega nelas; o lint acusa
  `font_family_without_font_face`). Fonte local em `assets/fonts/`; GSAP local copiado de
  `music-to-video/references/motion-primitives/assets/gsap.min.js`. Nada buscado na rede durante o render.
- Seletores do GSAP sempre escopados: `const q = gsap.utils.selector('#root[data-composition-id="c01"]')`.
- Contador: HTML inicial "0" (com o valor final no HTML, ele pisca por 1–2 quadros antes de o tween começar).
- Contraste: o `check` reprova texto laranja-claro sobre fundo claro (2,44:1); para texto, escureça o tom até passar de 4,5:1.
- Cartões com fundo transparente + uma camada `fundo` contínua (linhas a 8,5% que se desenham e
  aproximam devagar) dão continuidade aos cortes secos.
- Área segura do story: conteúdo entre y ≈ 260 e 1600 (barra do perfil em cima, resposta embaixo).
- `snapshot` manda os quadros para a análise do Gemini quando `GEMINI_API_KEY` está definida (gera
  `descriptions.md`); para não enviar, prefixe com `GEMINI_API_KEY=`.
- Loudness para o Instagram: −14 LUFS (loudnorm em duas passadas com `-c:v copy`, `alimiter` antes); o AAC ainda
  passa ~0,3 dB do pico, e o Instagram recomprime de qualquer jeito.
- Revisão no story: "N tentativas, nenhuma passou" sem a data virou afirmação falsa (as N eram de UMA noite, e antes
  dela houve tentativas que passaram). Número de segurança sempre com recorte (quando e qual).
- QA: `snapshot --at <estado final de cada cartão> --no-end` + prancha de 5 a 6 colunas; `check` tem que passar.

## Privacidade

Telemetria anônima vem LIGADA (não coleta caminhos nem conteúdo; se fizer login na HeyGen, liga à conta).
Desligar: `npx hyperframes telemetry disable`. `publish` e `cloud render` mandam o projeto para a HeyGen — só com
ok explícito do usuário (é publicação externa).
